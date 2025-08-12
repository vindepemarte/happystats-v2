// Debug service worker to clear all caches and force refresh
self.addEventListener('install', function(event) {
  console.log('[DEBUG SW] Installing new service worker');
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[DEBUG SW] Activating new service worker');
  
  event.waitUntil(
    // Clear ALL caches
    caches.keys().then(function(cacheNames) {
      console.log('[DEBUG SW] Found caches:', cacheNames);
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('[DEBUG SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      console.log('[DEBUG SW] All caches cleared, taking control');
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Don't cache anything - force network requests
self.addEventListener('fetch', function(event) {
  console.log('[DEBUG SW] Fetch request for:', event.request.url);
  
  // For static assets, always go to network
  if (event.request.url.includes('/_next/static/') || 
      event.request.url.includes('.css') || 
      event.request.url.includes('.js')) {
    console.log('[DEBUG SW] Forcing network request for static asset');
    event.respondWith(
      fetch(event.request).catch(function(error) {
        console.error('[DEBUG SW] Network request failed:', error);
        throw error;
      })
    );
  }
});