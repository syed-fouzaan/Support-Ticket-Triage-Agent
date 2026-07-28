// SentinelDesk PWA Service Worker
// Provides offline support, background sync, and asset caching.

const CACHE_NAME = 'sentineldesk-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event: pre-cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing SentinelDesk Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating SentinelDesk Service Worker...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch event: cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls always go to network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Push notification support (placeholder for future integration)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'SentinelDesk', body: 'New update available.' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'SentinelDesk 🛡️', {
      body: data.body || 'You have a new support event.',
      icon: '/manifest.json',
      badge: '/manifest.json',
    })
  );
});
