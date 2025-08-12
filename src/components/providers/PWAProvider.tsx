/**
 * PWA Provider Component
 * Initializes PWA functionality and offline support
 */

"use client";

import React, { useEffect } from 'react';
import { registerServiceWorker, requestBackgroundSync } from '../../lib/sw-registration';
import { setupOfflineListeners } from '../../lib/offline';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const initializePWA = async () => {
    try {
      console.log('Initializing PWA...');
      
      // Always setup offline listeners (works without service worker)
      setupOfflineListeners();
      
      // Setup periodic sync check (fallback for browsers without background sync)
      setupPeriodicSync();
      
      // Try to register service worker
      const registration = await registerServiceWorker();
      
      if (registration) {
        console.log('PWA initialized successfully with service worker');
        
        // Request initial background sync registration (with delay to ensure SW is ready)
        setTimeout(async () => {
          try {
            await requestBackgroundSync();
          } catch (error) {
            console.log('Background sync registration skipped:', error);
          }
        }, 1000);
      } else {
        console.log('PWA initialized without service worker (offline features limited)');
      }
    } catch (error) {
      console.error('PWA initialization failed:', error);
      // Continue without PWA features
      console.log('Continuing without PWA features...');
    }
  };

  useEffect(() => {
    // Initialize PWA functionality
    initializePWA();
  }, [initializePWA]);

  const setupPeriodicSync = () => {
    // Check for pending actions every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine) {
        // Import dynamically to avoid SSR issues
        import('../../lib/offline').then(({ syncPendingActions }) => {
          syncPendingActions().catch(console.error);
        });
      }
    }, 30000);
  };

  return <>{children}</>;
}

export default PWAProvider;