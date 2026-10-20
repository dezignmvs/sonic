const CACHE = 'sonic-shell-v52';
const SHELL = ['./', './index.html', './offline.html', './manifest.webmanifest', './css/styles.css', './js/app.js', './js/config.js', './js/firebase.js', './js/api/audius.js', './js/api/jamendo.js', './js/api/saavn.js', './assets/icons/icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => (await caches.match(event.request)) || caches.match('./offline.html')));
    return;
  }
  // Prefer current same-origin app files so a cached PWA cannot keep running
  // an old config/module after a deploy. Keep a cached copy for offline use.
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.webmanifest'))) {
      const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
