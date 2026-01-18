const CACHE_NAME = 'attendance-tracker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  // Static assets like JS and CSS will be handled by the fetch event
];

// Install event: cache initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and Firestore API calls (Firestore SDK handles its own offline mode)
  if (event.request.method !== 'GET' || url.hostname.includes('googleapis.com')) {
    return;
  }

  // Cache-first strategy for static assets and app shell
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache new static assets (JS, CSS, images)
        if (
          response.ok &&
          (url.pathname.endsWith('.js') || 
           url.pathname.endsWith('.css') || 
           url.pathname.match(/\.(png|jpg|jpeg|svg|woff2?)$/))
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});
