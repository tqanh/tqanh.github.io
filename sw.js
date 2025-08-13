const CACHE_NAME = 'game-hub-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.webmanifest',
  './js/config.js',
  './js/remoteLeaderboard.js',
  './js/hub.js',
  './js/auth-guard.js',
  './styles/main.css',
  './assets/icons/egg.svg',
  './assets/icons/snake.svg',
  './assets/icons/memory.svg',
  './games/egg-shooter/index.html',
  './games/egg-shooter/script.js',
  './games/egg-shooter/style.css',
  './games/egg-shooter/sounds.js',
  './games/snake/index.html',
  './games/snake/snake.js',
  './games/memory/index.html',
  './games/memory/memory.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Add URLs one by one with error handling
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.log('Failed to cache:', url, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker installed successfully');
      })
      .catch(err => {
        console.log('Service Worker installation failed:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) return;
  
  // Network-first strategy for HTML files to ensure fresh content
  if (event.request.destination === 'document' || 
      event.request.url.includes('.html') ||
      event.request.url.includes('.svg') ||
      event.request.url.includes('version.txt')) {
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for other static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
