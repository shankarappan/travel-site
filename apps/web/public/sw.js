/* Minimal offline shell. Never cache live prices or booking state. */
const SHELL = ['/', '/destinations', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('travel-shell-v1').then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/api/stays') ||
    url.pathname.startsWith('/api/checkout') ||
    url.pathname.startsWith('/api/bookings')
  ) {
    return; // network-only for live commercial data
  }
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
