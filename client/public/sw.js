
// Service Worker: Only disable caching, always fetch from network
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
