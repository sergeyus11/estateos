// EstateOS service worker — Phase 0 stub
// Full offline + push handling in Phase 1

const CACHE_NAME = 'estateos-v0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through, no caching in Phase 0
  event.respondWith(fetch(event.request));
});
