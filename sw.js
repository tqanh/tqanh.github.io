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
  const req = e.request;
  const url = new URL(req.url);
  if (!(url.protocol === 'http:' || url.protocol === 'https:') || req.method !== 'GET') {
    return;
  }
  const isNavigate = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  const isSameOrigin = url.origin === self.location.origin;

  if (isNavigate) {
    // Network-first for HTML to avoid stale pages after soft reload
    e.respondWith(
      fetch(new Request(req, { cache: 'no-store' }))
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
          }
          return resp;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        const ok = resp && resp.status === 200;
        const isBasic = resp && resp.type === 'basic';
        if (ok && (isBasic || isSameOrigin)) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
        }
        return resp;
      });
    })
  );
});
