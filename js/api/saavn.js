const API = 'https://saavn.sumit.co/api';

async function request(path, params = {}) {
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || json.error || `JioSaavn API returned ${response.status}`);
  }
  return json.data ?? json;
}

function secureUrl(value = '') {
  return typeof value === 'string' ? value.replace(/^http:/i, 'https:') : '';
}

function pickLink(links = []) {
  if (typeof links === 'string') return secureUrl(links);
  if (!Array.isArray(links)) return '';
  const ordered = [...links].sort((a, b) => Number.parseInt(b.quality, 10) - Number.parseInt(a.quality, 10));
  return secureUrl(ordered.find(link => link.url)?.url || '');
}

export function normalize(song) {
  if (!song?.id) return null;
  const artists = song.artists?.primary || song.artists?.all || [];
  const artist = artists.map(item => item.name).filter(Boolean).join(', ')
    || song.artist || song.subtitle || song.more_info?.music || 'Unknown artist';
  return {
    id: `saavn:${song.id}`,
    providerId: String(song.id),
    source: 'JioSaavn',
    title: song.name || song.title || 'Untitled',
    artist,
    album: song.album?.name || song.album || 'Single',
    artwork: pickLink(song.image) || secureUrl(song.image) || secureUrl(song.artwork),
    duration: Number(song.duration || song.more_info?.duration) || 0,
    genre: song.language || '',
    license: 'JioSaavn catalog · see the linked track page for terms',
    permalink: song.url || song.perma_url || song.more_info?.album_url || 'https://www.jiosaavn.com',
    audioUrl: pickLink(song.downloadUrl || song.download_url || song.more_info?.download_url)
  };
}

function songList(payload) {
  if (payload?.id) return [normalize(payload)].filter(Boolean);
  const list = Array.isArray(payload) ? payload : payload?.results || payload?.songs || payload?.data?.results || [];
  return list.map(normalize).filter(Boolean);
}

export async function search(query, limit = 30) {
  if (!query.trim()) return [];
  const payload = await request('/search/songs', { query, page: 0, limit });
  return songList(payload);
}

export async function trending(limit = 24) {
  return search('top hindi songs', limit);
}

export async function streamUrl(track) {
  if (!track?.providerId) return track?.audioUrl || '';
  try {
    const payload = await request('/songs', { ids: track.providerId });
    const refreshed = songList(payload).find(song => song.providerId === track.providerId);
    if (refreshed?.audioUrl) return refreshed.audioUrl;
  } catch {
    // Search results include a stream link, so use it if detail lookup fails.
  }
  return track.audioUrl || '';
}
