const CACHE_NAME = 'game-hub-v2';
const ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './js/hub.js',
  './games/egg-shooter/index.html',
  './games/egg-shooter/style.css',
  './games/egg-shooter/script.js',
  './games/egg-shooter/sounds.js',
  './games/snake/index.html',
  './games/snake/snake.js',
  './games/memory/index.html',
  './games/memory/memory.js'
];
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))),
      self.clients.claim()
    ])
  );
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (!(url.protocol === 'http:' || url.protocol === 'https:') || e.request.method !== 'GET') {
    return;
  }
  const isSameOrigin = url.origin === self.location.origin;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((resp) => {
          const ok = resp && resp.status === 200;
          const isBasic = resp && resp.type === 'basic';
          if (ok && (isBasic || isSameOrigin)) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone)).catch(() => {});
          }
          return resp;
        })
        .catch(() => {
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return Promise.reject(new Error('Network error'));
        });
    })
  );
});
