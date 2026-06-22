/**
 * Traveloop Service Worker — Offline-first caching for trip data
 */

const CACHE_NAME = 'travelloop-v1';
const TRIP_CACHE = 'travelloop-trips-v1';

// App shell files to cache on install
const APP_SHELL = [
  '/',
  '/index.html'
];

// Cache app shell on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Clean up old caches on activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== TRIP_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET requests
  if (e.request.method !== 'GET') return;

  // Trip/itinerary data: cache-first with network fallback
  if (url.pathname.includes('/api/trips/') ||
      url.pathname.includes('/api/itinerary/') ||
      url.pathname.includes('/api/copilot/') ||
      url.pathname.includes('/api/travelers') ||
      url.pathname.includes('/api/expenses/')) {
    e.respondWith(
      caches.open(TRIP_CACHE).then(async (cache) => {
        // Try cache first
        const cached = await cache.match(e.request);
        if (cached) {
          // Also try network in background to update cache
          fetch(e.request)
            .then(response => {
              if (response.ok) cache.put(e.request, response.clone());
            })
            .catch(() => { /* offline — cache is fine */ });
          return cached;
        }

        // No cache — try network
        try {
          const response = await fetch(e.request);
          if (response.ok) {
            cache.put(e.request, response.clone());
          }
          return response;
        } catch {
          return new Response(
            JSON.stringify({ error: 'Offline — showing cached data', offline: true }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
      })
    );
    return;
  }

  // Everything else: network-first with cache fallback
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses for static assets
        if (response.ok && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
