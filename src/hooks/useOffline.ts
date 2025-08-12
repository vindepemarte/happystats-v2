/**
 * Custom hook for offline functionality
 * Provides offline state and utilities for components
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  isOnline, 
  getOfflineData, 
  saveOfflineData, 
  addPendingAction, 
  syncPendingActions,
  setupOfflineListeners,
  type OfflineData,
  type PendingAction 
} from '../lib/offline';

export interface UseOfflineReturn {
  isOnline: boolean;
  offlineData: OfflineData | null;
  addOfflineAction: (action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  syncData: () => Promise<void>;
  saveDataForOffline: (data: OfflineData) => void;
}

export function useOffline(): UseOfflineReturn {
  const [online, setOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);

  useEffect(() => {
    // Initialize state
    setOnline(isOnline());
    setOfflineData(getOfflineData());

    // Setup event listeners
    const handleOnline = () => {
      setOnline(true);
      syncPendingActions();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup offline listeners for sync
    setupOfflineListeners();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addOfflineAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>) => {
    addPendingAction(action);
  }, []);

  const syncData = useCallback(async () => {
    if (online) {
      await syncPendingActions();
    }
  }, [online]);

  const saveDataForOffline = useCallback((data: OfflineData) => {
    saveOfflineData(data);
    setOfflineData(data);
  }, []);

  return {
    isOnline: online,
    offlineData,
    addOfflineAction,
    syncData,
    saveDataForOffline,
  };
}