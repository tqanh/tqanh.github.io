const CACHE_NAME = 'game-hub-v2.5.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.webmanifest',
  './version.txt',
  './js/config.js',
  './js/remoteLeaderboard.js',
  './js/hub.js',
  './js/auth-guard.js',
  './js/login.js',
  './styles/main.css',
  './styles/login.css',
  './assets/icons/egg.svg',
  './assets/icons/snake.svg',
  './assets/icons/memory.svg'
];

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching files...');
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
  // Không sử dụng skipWaiting để tránh vòng lặp
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
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
  // Không sử dụng clients.claim để tránh vòng lặp
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) return;
  
  // Skip favicon requests to avoid errors
  if (event.request.url.includes('favicon.ico')) return;
  
  // Chuẩn hoá URL để bỏ query (?v=...) khi match cache
  const requestUrl = new URL(event.request.url);
  const normalizedPathname = requestUrl.pathname; // giữ nguyên path, bỏ query khi match cache
  
  // If the request is for a game file, try to resolve the correct path
  if (normalizedPathname.includes('/games/')) {
    // Extract the path after the domain
    const pathname = normalizedPathname;
    
    // Check if this is a request from a game subdirectory
    if (pathname.includes('/tqanh.github.io/games/')) {
      // This is a request from a game, try to serve from cache first
      event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
          .then(response => {
            if (response) {
              return response;
            }
            // If not in cache, try to fetch from network
            return fetch(event.request).catch(error => {
              console.log('Failed to fetch game resource:', requestUrl.href, error);
              // Try to find the resource in cache with a different path
              const cacheKey = pathname.replace('/tqanh.github.io', '');
              return caches.match(cacheKey, { ignoreSearch: true }).then(cachedResponse => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                // Return a basic error response
                return new Response('Game resource not available', { status: 404 });
              });
            });
          })
      );
      return;
    }
  }
  
  // Handle JavaScript file requests that might be coming from nested directories
  if (normalizedPathname.includes('.js') && normalizedPathname.includes('/tqanh.github.io/')) {
    const pathname = normalizedPathname;
    
    // Try to serve from cache first
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(response => {
          if (response) {
            return response;
          }
          // If not in cache, try to fetch from network
          return fetch(event.request).catch(error => {
            console.log('Failed to fetch JS resource:', requestUrl.href, error);
            // Try to find the resource in cache with a different path
            const cacheKey = pathname.replace('/tqanh.github.io', '');
            return caches.match(cacheKey, { ignoreSearch: true }).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Try to find the resource in cache with the full path
              return caches.match(pathname, { ignoreSearch: true }).then(cachedResponse => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                // Return a basic error response
                return new Response('JavaScript resource not available', { status: 404 });
              });
            });
          });
        })
    );
    return;
  }
  
  // Cache-first strategy for all assets to avoid network requests
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(response => {
        if (response) {
          return response;
        }
        // If not in cache, try to fetch from network
        return fetch(event.request).catch(error => {
          console.log('Failed to fetch:', requestUrl.href, error);
          // Return a basic error response
          return new Response('Resource not available', { status: 404 });
        });
      })
  );
});
