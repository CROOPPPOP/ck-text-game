self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // PWA installability requires a fetch handler.
  // We just let the network handle it for now to ensure dynamic API routes work perfectly.
});
