const CACHE_NAME = 'game-hub-v1';
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
  './games/snake/snake.js'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k))))
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request).then((r) => {
      const clone = r.clone();
      caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
      return r;
    }).catch(() => caches.match('./index.html')))
  );
});
