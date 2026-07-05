/* ========================================
   Farm Dashboard - Service Worker
   PWA Offline Support
   ======================================== */

const CACHE_NAME = 'farm-dashboard-v1';
const OFFLINE_URL = '/index.html';

const ASSETS_TO_CACHE = [
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// Install event - cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.log('Cache install error:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension and data URLs
    if (event.request.url.startsWith('chrome-extension://') ||
        event.request.url.startsWith('data:')) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then((response) => {
                    // Don't cache error responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            })
            .catch(() => {
                // Return offline page for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match(OFFLINE_URL);
                }
            })
    );
});

// Background sync for data persistence (optional)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Data is already saved in localStorage, no additional sync needed
            Promise.resolve()
        );
    }
});
