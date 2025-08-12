/**
 * Offline Functionality Unit Tests
 * Tests for offline utilities and sync
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isOnline,
  addPendingAction,
  getPendingActions,
  removePendingAction,
  clearOfflineData,
  getOfflineData,
  saveOfflineData,
} from '../offline';
import { mockLocalStorage } from '../../test/utils';

describe('Offline Functionality', () => {
  let localStorage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorage = mockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: localStorage,
      writable: true,
    });
    clearOfflineData();
  });

  describe('isOnline', () => {
    it('should return navigator.onLine status', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      expect(isOnline()).toBe(true);

      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      expect(isOnline()).toBe(false);
    });
  });

  describe('pending actions', () => {
    it('should add pending action', () => {
      addPendingAction({
        type: 'CREATE_CHART',
        data: { name: 'Test Chart', category: 'Test' },
      });

      const actions = getPendingActions();
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('CREATE_CHART');
      expect(actions[0].data).toEqual({ name: 'Test Chart', category: 'Test' });
      expect(actions[0].id).toBeDefined();
      expect(actions[0].timestamp).toBeDefined();
      expect(actions[0].retryCount).toBe(0);
    });

    it('should remove pending action', () => {
      addPendingAction({
        type: 'CREATE_CHART',
        data: { name: 'Test Chart' },
      });

      const actions = getPendingActions();
      const actionId = actions[0].id;

      removePendingAction(actionId);

      expect(getPendingActions()).toHaveLength(0);
    });

    it('should handle multiple pending actions', () => {
      addPendingAction({
        type: 'CREATE_CHART',
        data: { name: 'Chart 1' },
      });

      addPendingAction({
        type: 'UPDATE_CHART',
        data: { id: 'chart-1', name: 'Updated Chart' },
      });

      const actions = getPendingActions();
      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('CREATE_CHART');
      expect(actions[1].type).toBe('UPDATE_CHART');
    });

    it('should persist actions in localStorage', () => {
      addPendingAction({
        type: 'CREATE_CHART',
        data: { name: 'Test Chart' },
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'happystats_pending_actions',
        expect.any(String)
      );
    });
  });

  describe('offline data', () => {
    it('should save and retrieve offline data', () => {
      const testData = {
        charts: [{ id: '1', name: 'Test Chart' }],
        dataPoints: [{ id: '1', measurement: 10 }],
        lastSync: Date.now(),
      };

      saveOfflineData(testData);
      const retrieved = getOfflineData();

      expect(retrieved).toEqual(testData);
    });

    it('should return null for invalid offline data', () => {
      localStorage.getItem.mockReturnValue('invalid-json');

      const data = getOfflineData();
      expect(data).toBeNull();
    });

    it('should clear all offline data', () => {
      saveOfflineData({
        charts: [],
        dataPoints: [],
        lastSync: Date.now(),
      });

      addPendingAction({
        type: 'CREATE_CHART',
        data: { name: 'Test' },
      });

      clearOfflineData();

      expect(getOfflineData()).toBeNull();
      expect(getPendingActions()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => {
        addPendingAction({
          type: 'CREATE_CHART',
          data: { name: 'Test' },
        });
      }).not.toThrow();
    });

    it('should handle localStorage read errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(getPendingActions()).toEqual([]);
      expect(getOfflineData()).toBeNull();
    });
  });
});