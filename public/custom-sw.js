/**
 * Custom Service Worker for HappyStats PWA
 * Handles background sync and offline functionality
 */

// Import Workbox if available
if (typeof importScripts === 'function') {
  importScripts('/workbox-4d767a27.js');
}

const CACHE_NAME = 'happystats-v1';
const OFFLINE_URL = '/offline';

// Background sync tag
const BACKGROUND_SYNC_TAG = 'happystats-background-sync';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/auth/login',
        '/offline',
        '/manifest.json',
        '/icon-192x192.png',
        '/icon-512x512.png'
      ]);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - handle offline requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline response for API calls
            return new Response(
              JSON.stringify({ error: 'Offline', offline: true }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Handle page requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful page responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached response if available
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL) || caches.match('/');
          }
          // Return generic offline response
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(syncPendingActions());
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SYNC_PENDING_ACTIONS':
      syncPendingActions().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'CACHE_DATA':
      cacheOfflineData(data).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

/**
 * Sync pending actions with the server
 */
async function syncPendingActions() {
  try {
    // Get pending actions from IndexedDB or localStorage
    const pendingActions = await getPendingActionsFromStorage();
    
    for (const action of pendingActions) {
      try {
        await executeAction(action);
        await removePendingActionFromStorage(action.id);
        console.log('Synced action:', action.id);
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
        await incrementRetryCountInStorage(action.id);
      }
    }
    
    // Notify all clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * Execute a pending action
 */
async function executeAction(action) {
  const { type, data } = action;
  
  const options = {
    method: getMethodForAction(type),
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (options.method !== 'DELETE') {
    options.body = JSON.stringify(data);
  }
  
  const url = getUrlForAction(type, data);
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response;
}

/**
 * Get HTTP method for action type
 */
function getMethodForAction(type) {
  switch (type) {
    case 'CREATE_CHART':
    case 'CREATE_DATA_POINT':
      return 'POST';
    case 'UPDATE_CHART':
    case 'UPDATE_DATA_POINT':
      return 'PUT';
    case 'DELETE_CHART':
    case 'DELETE_DATA_POINT':
      return 'DELETE';
    default:
      return 'POST';
  }
}

/**
 * Get URL for action type
 */
function getUrlForAction(type, data) {
  switch (type) {
    case 'CREATE_CHART':
      return '/api/charts';
    case 'UPDATE_CHART':
      return `/api/charts/${data.id}`;
    case 'DELETE_CHART':
      return `/api/charts/${data.id}`;
    case 'CREATE_DATA_POINT':
      return `/api/charts/${data.chartId}/data-points`;
    case 'UPDATE_DATA_POINT':
      return `/api/data-points/${data.id}`;
    case 'DELETE_DATA_POINT':
      return `/api/data-points/${data.id}`;
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

/**
 * Cache offline data for later use
 */
async function cacheOfflineData(data) {
  const cache = await caches.open(CACHE_NAME);
  const response = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
  await cache.put('/offline-data', response);
}

/**
 * Get pending actions from storage (simplified for service worker)
 */
async function getPendingActionsFromStorage() {
  try {
    // In a real implementation, you'd use IndexedDB here
    // For now, we'll return empty array as localStorage isn't available in SW
    return [];
  } catch (error) {
    console.error('Error getting pending actions:', error);
    return [];
  }
}

/**
 * Remove pending action from storage
 */
async function removePendingActionFromStorage(actionId) {
  // Implementation would remove from IndexedDB
  console.log('Would remove action:', actionId);
}

/**
 * Increment retry count in storage
 */
async function incrementRetryCountInStorage(actionId) {
  // Implementation would update retry count in IndexedDB
  console.log('Would increment retry count for action:', actionId);
}