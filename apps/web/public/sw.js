// EstateOS service worker — Phase 1
// Pass-through fetch + push handler + notification click

const CACHE_NAME = 'estateos-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'EstateOS', body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'EstateOS', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/agent' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/agent';
  event.waitUntil(self.clients.openWindow(url));
});
