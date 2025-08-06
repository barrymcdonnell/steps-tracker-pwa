// service-worker.js
const CACHE_NAME = 'step-tracker-cache-v2'; // Updated cache version as requested
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './db.js',
    './utils.js',
    './constants.js',
    './workoutConstants.js', // Added as requested
    './display.js',
    './charts.js', // Added as requested
    './workoutDisplay.js',
    './achievementsDisplay.js',
    './manifest.json',
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png'
];

// Install event: caches the static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching assets');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Cache addAll failed', error);
            })
    );
});

// Activate event: cleans up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                    return null;
                })
            );
        })
    );
});

// Fetch event: serves cached content first, then fetches from network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // No cache hit - fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        // IMPORTANT: Clone the response. A response is a stream
                        // and can only be consumed once. We must clone it so that
                        // we can consume the stream twice: one for the cache and one
                        // for the browser.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(error => {
                        console.error('Service Worker: Fetch failed:', event.request.url, error);
                        // Fallback for offline if network fails and not in cache
                        // You can serve an offline page here if you have one
                        // For now, just return a generic response or throw error
                        return new Response('<h1>Offline</h1><p>Please check your internet connection.</p>', {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    });
            })
    );
});
