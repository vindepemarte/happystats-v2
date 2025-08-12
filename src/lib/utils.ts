// Utility functions for HappyStats

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function to merge Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date: Date | string | null | undefined): string {
  try {
    // Handle null, undefined, or empty values
    if (!date || date === null || date === undefined) {
      return 'Unknown date';
    }
    
    // Handle empty objects (which might be coming from database conversion issues)
    if (typeof date === 'object' && !(date instanceof Date)) {
      // Check if it's an empty object
      if (Object.keys(date).length === 0) {
        console.warn('formatDate received empty object - this indicates a serialization issue');
        return 'Invalid date';
      }
      console.warn('formatDate received unexpected object type:', typeof date, date);
      return 'Invalid date';
    }
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      if (date.trim() === '') {
        return 'Unknown date';
      }
      // Handle ISO date strings from API
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      console.warn('formatDate received unexpected type:', typeof date, date);
      return 'Invalid date';
    }
    
    // Ensure dateObj is actually a Date object and has getTime method
    if (!dateObj || typeof dateObj.getTime !== 'function') {
      console.warn('formatDate: dateObj is not a valid Date object:', dateObj);
      return 'Invalid date';
    }
    
    // Check if the date is valid
    const time = dateObj.getTime();
    if (isNaN(time)) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error in formatDate:', error, 'Input was:', date);
    return 'Invalid date';
  }
}

// Format date for input fields
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return new Date().toISOString().split('T')[0]; // fallback to today
  }
  
  return dateObj.toISOString().split('T')[0];
}

// Parse date from input
export function parseDateFromInput(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
}

// Format number with proper decimal places
export function formatNumber(num: number, decimals: number = 2): string {
  // Handle invalid inputs
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    return '—'; // em dash for invalid numbers
  }
  
  return num.toFixed(decimals);
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get initials from name or email
export function getInitials(text: string): string {
  return text
    .split(/[\s@]/)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Calculate percentage change
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Date range filtering utilities
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// Filter data points by date range without mutating original array
export function filterDataPointsByDateRange<T extends { date: Date | string }>(
  dataPoints: T[],
  dateRange: DateRange | null
): T[] {
  if (!dateRange || (!dateRange.startDate && !dateRange.endDate)) {
    return dataPoints;
  }

  return dataPoints.filter(point => {
    const pointDate = point.date instanceof Date ? point.date : new Date(point.date);
    
    // Skip invalid dates
    if (isNaN(pointDate.getTime())) {
      return false;
    }

    // Check start date constraint
    if (dateRange.startDate) {
      const startOfDay = new Date(dateRange.startDate);
      startOfDay.setHours(0, 0, 0, 0);
      if (pointDate < startOfDay) {
        return false;
      }
    }

    // Check end date constraint
    if (dateRange.endDate) {
      const endOfDay = new Date(dateRange.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (pointDate > endOfDay) {
        return false;
      }
    }

    return true;
  });
}

// Get date range from data points
export function getDataPointDateRange<T extends { date: Date | string }>(
  dataPoints: T[]
): { earliest: Date; latest: Date } | null {
  if (dataPoints.length === 0) {
    return null;
  }

  const validDates = dataPoints
    .map(point => point.date instanceof Date ? point.date : new Date(point.date))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (validDates.length === 0) {
    return null;
  }

  return {
    earliest: validDates[0],
    latest: validDates[validDates.length - 1],
  };
}

// Calculate trend line for filtered data
export interface TrendCalculation {
  slope: number;
  intercept: number;
  rSquared: number;
}

export function calculateTrendLine<T extends { measurement: number }>(
  dataPoints: T[]
): TrendCalculation {
  if (dataPoints.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }
  
  const n = dataPoints.length;
  const xValues = dataPoints.map((_, index) => index);
  const yValues = dataPoints.map(point => point.measurement);
  
  // Calculate means
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
  
  // Calculate slope and intercept using least squares method
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // Calculate R-squared
  let totalSumSquares = 0;
  let residualSumSquares = 0;
  
  for (let i = 0; i < n; i++) {
    const predicted = slope * xValues[i] + intercept;
    totalSumSquares += (yValues[i] - yMean) ** 2;
    residualSumSquares += (yValues[i] - predicted) ** 2;
  }
  
  const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
  
  return { slope, intercept, rSquared };
}