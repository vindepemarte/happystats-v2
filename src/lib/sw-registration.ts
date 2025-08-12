/**
 * Service Worker Registration and Management
 * Handles PWA service worker registration and background sync
 */

"use client";

export interface ServiceWorkerMessage {
  type: string;
  data?: Record<string, unknown>;
}

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker and setup background sync
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') {
    console.log('Service Worker registration skipped: not in browser environment');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported in this browser');
    return null;
  }

  try {
    // Wait for page to load before registering
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    console.log('Attempting to register service worker...');

    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    swRegistration = registration;

    console.log('Service Worker registered successfully:', registration.scope);

    // Setup message listener
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Setup update listener
    registration.addEventListener('updatefound', () => {
      console.log('Service worker update found');
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          console.log('Service worker state changed:', newWorker.state);
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            console.log('New service worker available');
            showUpdateAvailableNotification();
          }
        });
      }
    });

    // Wait for service worker to be ready before checking for updates
    try {
      await navigator.serviceWorker.ready;
      console.log('Service worker is ready');
    } catch (readyError) {
      console.log('Service worker ready check failed:', readyError);
    }
    
    // Check for updates
    try {
      await registration.update();
      console.log('Service worker update check completed');
    } catch (updateError) {
      console.log('Service worker update check failed:', updateError);
    }

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Handle messages from service worker
 */
function handleServiceWorkerMessage(event: MessageEvent<ServiceWorkerMessage>) {
  const { type, data } = event.data;

  switch (type) {
    case 'SYNC_COMPLETE':
      console.log('Background sync completed');
      // Refresh data or show notification
      window.dispatchEvent(new CustomEvent('sw-sync-complete'));
      break;

    case 'CACHE_UPDATED':
      console.log('Cache updated:', data);
      break;

    default:
      console.log('Unknown service worker message:', type, data);
  }
}

/**
 * Show notification when app update is available
 */
function showUpdateAvailableNotification() {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.className = `
    fixed top-4 right-4 z-50 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg
    flex items-center gap-3 max-w-sm
  `;
  notification.innerHTML = `
    <div class="flex-1">
      <div class="font-medium">Update Available</div>
      <div class="text-sm opacity-90">A new version of HappyStats is ready.</div>
    </div>
    <button class="bg-primary-foreground text-primary px-3 py-1 rounded text-sm font-medium hover:bg-opacity-90">
      Reload
    </button>
  `;

  // Add click handler for reload button
  const reloadButton = notification.querySelector('button');
  if (reloadButton) {
    reloadButton.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 10000);

  document.body.appendChild(notification);
}

/**
 * Request background sync for pending actions
 */
export async function requestBackgroundSync(tag: string = 'happystats-background-sync'): Promise<void> {
  if (!swRegistration) {
    console.log('No service worker registration available');
    return;
  }

  if (!('sync' in window.ServiceWorkerRegistration.prototype)) {
    console.log('Background sync not supported');
    return;
  }

  try {
    await swRegistration.sync.register(tag);
    console.log('Background sync registered:', tag);
  } catch (error) {
    console.error('Background sync registration failed:', error);
  }
}

/**
 * Send message to service worker
 */
export async function sendMessageToServiceWorker(message: ServiceWorkerMessage): Promise<Record<string, unknown>> {
  if (!navigator.serviceWorker.controller) {
    throw new Error('No service worker controller available');
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data.success) {
        resolve(event.data);
      } else {
        reject(new Error(event.data.error || 'Service worker message failed'));
      }
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
  });
}

/**
 * Cache data for offline use
 */
export async function cacheDataForOffline(data: Record<string, unknown>): Promise<void> {
  try {
    await sendMessageToServiceWorker({
      type: 'CACHE_DATA',
      data
    });
  } catch (error) {
    console.error('Failed to cache data for offline use:', error);
  }
}

/**
 * Trigger manual sync of pending actions
 */
export async function syncPendingActions(): Promise<void> {
  try {
    await sendMessageToServiceWorker({
      type: 'SYNC_PENDING_ACTIONS'
    });
  } catch (error) {
    console.error('Failed to sync pending actions:', error);
  }
}

/**
 * Check if app is running as PWA
 */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as Record<string, unknown>).standalone === true;
}

/**
 * Show install prompt for PWA
 */
export function showInstallPrompt(): void {
  // This would be handled by the browser's install prompt
  // We can listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // Store the event for later use
    (window as Record<string, unknown>).deferredPrompt = e;
    
    // Show custom install button or notification
    console.log('PWA install prompt available');
  });
}