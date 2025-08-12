/**
 * Utils Unit Tests
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn, formatDate, debounce, calculateTrendLine } from '../utils';

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('should handle empty strings', () => {
      expect(cn('base', '', 'end')).toBe('base end');
    });
  });

  describe('formatDate', () => {
    it('should format Date objects correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('should format ISO strings correctly', () => {
      expect(formatDate('2024-01-15T10:30:00Z')).toBe('Jan 15, 2024');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid date');
    });

    it('should handle null and undefined', () => {
      expect(formatDate(null)).toBe('Unknown date');
      expect(formatDate(undefined)).toBe('Unknown date');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const debouncedFn = debounce(fn, 100);

      // Call multiple times quickly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should not have been called yet
      expect(callCount).toBe(0);

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have been called once
      expect(callCount).toBe(1);
    });

    it('should pass arguments correctly', async () => {
      let lastArgs: any[] = [];
      const fn = (...args: any[]) => {
        lastArgs = args;
      };
      const debouncedFn = debounce(fn, 50);

      debouncedFn('arg1', 'arg2', 123);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(lastArgs).toEqual(['arg1', 'arg2', 123]);
    });
  });

  describe('calculateTrendLine', () => {
    it('should calculate trend line for positive slope', () => {
      const dataPoints = [
        { measurement: 1 },
        { measurement: 2 },
        { measurement: 3 },
        { measurement: 4 },
      ];

      const result = calculateTrendLine(dataPoints);

      expect(result.slope).toBeGreaterThan(0);
      expect(result.intercept).toBeDefined();
      expect(result.rSquared).toBeGreaterThan(0.9); // Should be a strong correlation
    });

    it('should calculate trend line for negative slope', () => {
      const dataPoints = [
        { measurement: 4 },
        { measurement: 3 },
        { measurement: 2 },
        { measurement: 1 },
      ];

      const result = calculateTrendLine(dataPoints);

      expect(result.slope).toBeLessThan(0);
      expect(result.rSquared).toBeGreaterThan(0.9);
    });

    it('should handle flat data', () => {
      const dataPoints = [
        { measurement: 5 },
        { measurement: 5 },
        { measurement: 5 },
      ];

      const result = calculateTrendLine(dataPoints);

      expect(Math.abs(result.slope)).toBeLessThan(0.001);
    });

    it('should handle empty data', () => {
      const result = calculateTrendLine([]);

      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
      expect(result.rSquared).toBe(0);
    });

    it('should handle single data point', () => {
      const dataPoints = [{ measurement: 10 }];

      const result = calculateTrendLine(dataPoints);

      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
      expect(result.rSquared).toBe(0);
    });
  });
});