/**
 * API Client with offline support
 * Handles API calls with automatic offline fallback and sync
 */

import { isOnline, addPendingAction, getOfflineData } from './offline';

export interface ApiResponse<T = Record<string, unknown>> {
  data?: T;
  error?: string;
  offline?: boolean;
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  offlineAction?: {
    type: 'CREATE_CHART' | 'UPDATE_CHART' | 'DELETE_CHART' | 'CREATE_DATA_POINT' | 'UPDATE_DATA_POINT' | 'DELETE_DATA_POINT';
    data: Record<string, unknown>;
  };
}

/**
 * Enhanced fetch with offline support
 */
export async function apiCall<T = Record<string, unknown>>(
  url: string, 
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    offlineAction
  } = options;

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    // Try online request first
    if (isOnline()) {
      const response = await fetch(url, requestOptions);
      
      if (response.ok) {
        const data = await response.json();
        return { data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } else {
      throw new Error('Offline');
    }
  } catch (error) {
    console.log('API call failed, handling offline:', error);
    
    // Handle offline scenario
    if (method === 'GET') {
      // Try to get cached data for GET requests
      const cachedData = await getCachedData(url);
      if (cachedData) {
        return { data: cachedData, offline: true };
      }
      return { error: 'Data not available offline', offline: true };
    } else {
      // For mutations, add to pending actions
      if (offlineAction) {
        addPendingAction(offlineAction);
        return { 
          data: generateOptimisticResponse(offlineAction), 
          offline: true 
        };
      }
      return { error: 'Action not available offline', offline: true };
    }
  }
}

/**
 * Get cached data for offline use
 */
async function getCachedData(url: string): Promise<Record<string, unknown> | null> {
  try {
    // Try service worker cache first
    if ('caches' in window) {
      const cache = await caches.open('happystats-v1');
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        return await cachedResponse.json();
      }
    }

    // Fallback to offline data in localStorage
    const offlineData = getOfflineData();
    if (offlineData) {
      if (url.includes('/api/charts')) {
        return offlineData.charts;
      }
      if (url.includes('/api/data-points')) {
        return offlineData.dataPoints;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

/**
 * Generate optimistic response for offline actions
 */
function generateOptimisticResponse(action: { type: string; data: Record<string, unknown> }): Record<string, unknown> {
  const { type, data } = action;
  
  switch (type) {
    case 'CREATE_CHART':
      return {
        id: `temp-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataPoints: [],
        _pending: true
      };
      
    case 'UPDATE_CHART':
      return {
        ...data,
        updatedAt: new Date().toISOString(),
        _pending: true
      };
      
    case 'CREATE_DATA_POINT':
      return {
        id: `temp-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        _pending: true
      };
      
    case 'UPDATE_DATA_POINT':
      return {
        ...data,
        updatedAt: new Date().toISOString(),
        _pending: true
      };
      
    default:
      return { success: true, _pending: true };
  }
}

/**
 * Chart API methods with offline support
 */
export const chartApi = {
  async list(filters?: { category?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    
    const url = `/api/charts${params.toString() ? `?${params.toString()}` : ''}`;
    return apiCall(url);
  },

  async get(id: string) {
    return apiCall(`/api/charts/${id}`);
  },

  async create(data: { name: string; category: string }) {
    return apiCall('/api/charts', {
      method: 'POST',
      body: data,
      offlineAction: {
        type: 'CREATE_CHART',
        data
      }
    });
  },

  async update(id: string, data: { name?: string; category?: string }) {
    return apiCall(`/api/charts/${id}`, {
      method: 'PUT',
      body: data,
      offlineAction: {
        type: 'UPDATE_CHART',
        data: { id, ...data }
      }
    });
  },

  async delete(id: string) {
    return apiCall(`/api/charts/${id}`, {
      method: 'DELETE',
      offlineAction: {
        type: 'DELETE_CHART',
        data: { id }
      }
    });
  }
};

/**
 * Data Point API methods with offline support
 */
export const dataPointApi = {
  async create(chartId: string, data: { measurement: number; date: string; name?: string }) {
    return apiCall(`/api/charts/${chartId}/data-points`, {
      method: 'POST',
      body: data,
      offlineAction: {
        type: 'CREATE_DATA_POINT',
        data: { chartId, ...data }
      }
    });
  },

  async update(id: string, data: { measurement?: number; date?: string; name?: string }) {
    return apiCall(`/api/data-points/${id}`, {
      method: 'PUT',
      body: data,
      offlineAction: {
        type: 'UPDATE_DATA_POINT',
        data: { id, ...data }
      }
    });
  },

  async delete(id: string) {
    return apiCall(`/api/data-points/${id}`, {
      method: 'DELETE',
      offlineAction: {
        type: 'DELETE_DATA_POINT',
        data: { id }
      }
    });
  }
};