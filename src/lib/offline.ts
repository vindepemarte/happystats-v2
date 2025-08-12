/**
 * Offline functionality utilities for PWA
 * Handles offline data synchronization and background sync
 */

export interface PendingAction {
  id: string;
  type: 'CREATE_CHART' | 'UPDATE_CHART' | 'DELETE_CHART' | 'CREATE_DATA_POINT' | 'UPDATE_DATA_POINT' | 'DELETE_DATA_POINT';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export interface OfflineData {
  charts: Record<string, unknown>[];
  dataPoints: Record<string, unknown>[];
  lastSync: number;
}

const OFFLINE_STORAGE_KEY = 'happystats_offline_data';
const PENDING_ACTIONS_KEY = 'happystats_pending_actions';
const MAX_RETRY_COUNT = 3;

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Get offline data from localStorage
 */
export function getOfflineData(): OfflineData | null {
  try {
    const data = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading offline data:', error);
    return null;
  }
}

/**
 * Save data for offline access
 */
export function saveOfflineData(data: OfflineData): void {
  try {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving offline data:', error);
  }
}

/**
 * Get pending actions from localStorage
 */
export function getPendingActions(): PendingAction[] {
  try {
    const actions = localStorage.getItem(PENDING_ACTIONS_KEY);
    return actions ? JSON.parse(actions) : [];
  } catch (error) {
    console.error('Error reading pending actions:', error);
    return [];
  }
}

/**
 * Save pending actions to localStorage
 */
export function savePendingActions(actions: PendingAction[]): void {
  try {
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
  } catch (error) {
    console.error('Error saving pending actions:', error);
  }
}

/**
 * Add a pending action for later synchronization
 */
export function addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): void {
  const pendingAction: PendingAction = {
    ...action,
    id: generateId(),
    timestamp: Date.now(),
    retryCount: 0,
  };

  const actions = getPendingActions();
  actions.push(pendingAction);
  savePendingActions(actions);
}

/**
 * Remove a pending action after successful sync
 */
export function removePendingAction(actionId: string): void {
  const actions = getPendingActions();
  const filteredActions = actions.filter(action => action.id !== actionId);
  savePendingActions(filteredActions);
}

/**
 * Increment retry count for a pending action
 */
export function incrementRetryCount(actionId: string): void {
  const actions = getPendingActions();
  const action = actions.find(a => a.id === actionId);
  if (action) {
    action.retryCount++;
    savePendingActions(actions);
  }
}

/**
 * Get actions that haven't exceeded max retry count
 */
export function getRetryableActions(): PendingAction[] {
  const actions = getPendingActions();
  return actions.filter(action => action.retryCount < MAX_RETRY_COUNT);
}

/**
 * Sync pending actions when online
 */
export async function syncPendingActions(): Promise<void> {
  if (!isOnline()) {
    return;
  }

  const actions = getRetryableActions();
  
  for (const action of actions) {
    try {
      await executeAction(action);
      removePendingAction(action.id);
    } catch (error) {
      console.error(`Failed to sync action ${action.id}:`, error);
      incrementRetryCount(action.id);
    }
  }
}

/**
 * Execute a pending action
 */
async function executeAction(action: PendingAction): Promise<void> {
  const { type, data } = action;

  switch (type) {
    case 'CREATE_CHART':
      await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      break;

    case 'UPDATE_CHART':
      await fetch(`/api/charts/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      break;

    case 'DELETE_CHART':
      await fetch(`/api/charts/${data.id}`, {
        method: 'DELETE',
      });
      break;

    case 'CREATE_DATA_POINT':
      await fetch(`/api/charts/${data.chartId}/data-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      break;

    case 'UPDATE_DATA_POINT':
      await fetch(`/api/data-points/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      break;

    case 'DELETE_DATA_POINT':
      await fetch(`/api/data-points/${data.id}`, {
        method: 'DELETE',
      });
      break;

    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

/**
 * Generate a unique ID for actions
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clear all offline data (useful for logout)
 */
export function clearOfflineData(): void {
  try {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    localStorage.removeItem(PENDING_ACTIONS_KEY);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
}

/**
 * Setup online/offline event listeners
 */
export function setupOfflineListeners(): void {
  window.addEventListener('online', () => {
    console.log('Connection restored, syncing pending actions...');
    syncPendingActions().catch(error => {
      console.error('Sync failed after coming online:', error);
    });
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost, switching to offline mode...');
  });
}