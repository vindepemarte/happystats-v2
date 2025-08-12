/**
 * Offline Indicator Component
 * Shows connection status and pending sync actions
 */

"use client";

import React, { useState, useEffect } from 'react';
import { isOnline, getPendingActions, syncPendingActions, type PendingAction } from '../../lib/offline';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const [online, setOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Initial state
    setOnline(isOnline());
    setPendingActions(getPendingActions());

    // Online/offline event listeners
    const handleOnline = async () => {
      setOnline(true);
      setSyncing(true);
      try {
        await syncPendingActions();
        setPendingActions(getPendingActions());
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        setSyncing(false);
      }
    };

    const handleOffline = () => {
      setOnline(false);
      setSyncing(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check for pending actions
    const interval = setInterval(() => {
      setPendingActions(getPendingActions());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Don't show indicator if online and no pending actions
  if (online && pendingActions.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-16 right-4 z-50 ${className}`}>
      <div className={`
        px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2
        ${online 
          ? 'bg-primary/10 text-primary border border-primary/20' 
          : 'bg-destructive/10 text-destructive border border-destructive/20'
        }
      `}>
        {/* Connection Status Icon */}
        <div className="flex-shrink-0">
          {syncing ? (
            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : online ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L12 12m-6.364 6.364L12 12m6.364-6.364L12 12" />
            </svg>
          )}
        </div>

        {/* Status Text */}
        <div>
          {syncing ? (
            'Syncing...'
          ) : online ? (
            pendingActions.length > 0 ? (
              `${pendingActions.length} pending sync${pendingActions.length > 1 ? 's' : ''}`
            ) : (
              'Online'
            )
          ) : (
            'Offline'
          )}
        </div>

        {/* Pending Actions Count */}
        {pendingActions.length > 0 && !syncing && (
          <div className="flex-shrink-0 bg-current text-background rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {pendingActions.length > 9 ? '9+' : pendingActions.length}
          </div>
        )}
      </div>

      {/* Detailed pending actions (show on hover or click) */}
      {pendingActions.length > 0 && (
        <div className="mt-2 bg-card border rounded-lg shadow-lg p-3 text-xs max-w-xs">
          <div className="font-medium text-card-foreground mb-2">Pending Actions:</div>
          <div className="space-y-1">
            {pendingActions.slice(0, 5).map((action) => (
              <div key={action.id} className="text-muted-foreground flex justify-between">
                <span>{getActionDescription(action)}</span>
                {action.retryCount > 0 && (
                  <span className="text-destructive">({action.retryCount} retries)</span>
                )}
              </div>
            ))}
            {pendingActions.length > 5 && (
              <div className="text-muted-foreground">
                +{pendingActions.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get human-readable description for an action
 */
function getActionDescription(action: PendingAction): string {
  switch (action.type) {
    case 'CREATE_CHART':
      return `Create chart: ${action.data.name || 'Untitled'}`;
    case 'UPDATE_CHART':
      return `Update chart: ${action.data.name || 'Untitled'}`;
    case 'DELETE_CHART':
      return 'Delete chart';
    case 'CREATE_DATA_POINT':
      return 'Add data point';
    case 'UPDATE_DATA_POINT':
      return 'Update data point';
    case 'DELETE_DATA_POINT':
      return 'Delete data point';
    default:
      return 'Unknown action';
  }
}