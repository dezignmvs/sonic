import { AUDIUS_API_KEY } from '../config.js';

const API = 'https://api.audius.co/v1';
const headers = AUDIUS_API_KEY ? { 'X-Audius-API-Key': AUDIUS_API_KEY } : {};
const cache = new Map();

async function request(path, params = {}) {
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) if (value !== '' && value != null) url.searchParams.set(key, value);
  if (AUDIUS_API_KEY) url.searchParams.set('api_key', AUDIUS_API_KEY);
  const key = url.toString();
  if (cache.has(key)) return cache.get(key);
  const response = await fetch(key, { headers });
  if (!response.ok) throw new Error(`Audius returned ${response.status}`);
  const json = await response.json();
  const data = json.data ?? [];
  cache.set(key, data);
  return data;
}

export function normalize(track) {
  if (!track) return null;
  const artwork = track.artwork?.['480x480'] || track.artwork?.['150x150'] || track.artwork?.['1000x1000'] || '';
  return {
    id: `audius:${track.id}`, providerId: track.id, source: 'Audius', title: track.title || 'Untitled',
    artist: track.user?.name || track.user?.handle || 'Unknown artist', album: track.playlist_name || 'Single',
    artwork, duration: Number(track.duration) || 0, genre: track.genre || '', license: track.license || 'See artist’s Audius track page',
    permalink: track.permalink ? `https://audius.co${track.permalink}` : 'https://audius.co', audioUrl: `${API}/tracks/${encodeURIComponent(track.id)}/stream`
  };
}

export async function trending(limit = 12) {
  const data = await request('/tracks/trending', { limit, app_name: 'Sonic' });
  return data.map(normalize).filter(Boolean);
}

export async function search(query, limit = 30) {
  if (!query.trim()) return [];
  const data = await request('/tracks/search', { query, limit, app_name: 'Sonic' });
  return data.map(normalize).filter(Boolean);
}

export async function streamUrl(track) {
  if (track.source === 'Audius' && track.providerId) {
    const url = new URL(`${API}/tracks/${encodeURIComponent(track.providerId)}/stream`);
    url.searchParams.set('app_name', 'Sonic');
    if (AUDIUS_API_KEY) url.searchParams.set('api_key', AUDIUS_API_KEY);
    return url.toString();
  }
  return track.audioUrl;
}
