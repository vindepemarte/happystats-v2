// Data validation utilities

import { z } from 'zod';

// Data point validation schemas
export const dataPointValidation = {
  measurement: z
    .number()
    .finite('Measurement must be a valid number')
    .refine((val) => !isNaN(val), 'Measurement must be a valid number'),

  date: z
    .date()
    .max(new Date(), 'Date cannot be in the future')
    .min(new Date('1900-01-01'), 'Date must be after 1900'),

  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
};

// Chart validation schemas
export const chartValidation = {
  name: z
    .string()
    .min(1, 'Chart name is required')
    .max(255, 'Chart name must be less than 255 characters')
    .trim(),

  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters')
    .trim(),
};

// Combined schemas
export const createDataPointSchema = z.object({
  measurement: dataPointValidation.measurement,
  date: dataPointValidation.date,
  name: dataPointValidation.name,
});

export const updateDataPointSchema = z.object({
  measurement: dataPointValidation.measurement.optional(),
  date: dataPointValidation.date.optional(),
  name: dataPointValidation.name.optional(),
});

export const createChartSchema = z.object({
  name: chartValidation.name,
  category: chartValidation.category,
});

export const updateChartSchema = z.object({
  name: chartValidation.name.optional(),
  category: chartValidation.category.optional(),
});

// Validation helper functions
export function validateMeasurement(value: string | number): { isValid: boolean; error?: string; value?: number } {
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const result = dataPointValidation.measurement.safeParse(numValue);

    if (result.success) {
      return { isValid: true, value: result.data };
    } else {
      return { isValid: false, error: result.error.issues[0]?.message || 'Invalid measurement' };
    }
  } catch (error) {
    return { isValid: false, error: 'Invalid measurement format' };
  }
}

export function validateDate(value: string | Date): { isValid: boolean; error?: string; value?: Date } {
  try {
    const dateValue = typeof value === 'string' ? new Date(value) : value;
    const result = dataPointValidation.date.safeParse(dateValue);

    if (result.success) {
      return { isValid: true, value: result.data };
    } else {
      return { isValid: false, error: result.error.issues[0]?.message || 'Invalid date' };
    }
  } catch (error) {
    return { isValid: false, error: 'Invalid date format' };
  }
}

export function validateDataPointName(value: string): { isValid: boolean; error?: string; value?: string } {
  try {
    const result = dataPointValidation.name.safeParse(value);

    if (result.success) {
      return { isValid: true, value: result.data };
    } else {
      return { isValid: false, error: result.error.issues[0]?.message || 'Invalid name' };
    }
  } catch (error) {
    return { isValid: false, error: 'Invalid name format' };
  }
}

// Batch validation for multiple data points (useful for CSV import)
export function validateDataPoints(dataPoints: any[]): {
  valid: any[];
  invalid: { index: number; data: any; errors: string[] }[];
} {
  const valid: any[] = [];
  const invalid: { index: number; data: any; errors: string[] }[] = [];

  dataPoints.forEach((dataPoint, index) => {
    const result = createDataPointSchema.safeParse(dataPoint);

    if (result.success) {
      valid.push(result.data);
    } else {
      const errors = result.error?.issues?.map(err => err.message) || ['Validation failed'];
      invalid.push({ index, data: dataPoint, errors });
    }
  });

  return { valid, invalid };
}

// Data type inference and conversion
export function inferDataType(values: (string | number)[]): 'number' | 'text' {
  const numericValues = values.filter(val => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return !isNaN(num) && isFinite(num);
  });

  // If more than 80% of values are numeric, treat as numeric
  return numericValues.length / values.length > 0.8 ? 'number' : 'text';
}

// Convert string values to appropriate types
export function convertValue(value: string, targetType: 'number' | 'text'): number | string {
  if (targetType === 'number') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  return value.toString();
}

// Sanitize input values
export function sanitizeInput(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

// Date range validation
export function validateDateRange(startDate: Date, endDate: Date): { isValid: boolean; error?: string } {
  if (startDate > endDate) {
    return { isValid: false, error: 'Start date must be before end date' };
  }

  const maxRange = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years in milliseconds
  if (endDate.getTime() - startDate.getTime() > maxRange) {
    return { isValid: false, error: 'Date range cannot exceed 10 years' };
  }

  return { isValid: true };
}

// Measurement range validation (for outlier detection)
export function validateMeasurementRange(
  measurement: number,
  existingMeasurements: number[],
  outlierThreshold: number = 3
): { isValid: boolean; warning?: string } {
  if (existingMeasurements.length < 3) {
    return { isValid: true }; // Not enough data for outlier detection
  }

  const mean = existingMeasurements.reduce((sum, val) => sum + val, 0) / existingMeasurements.length;
  const variance = existingMeasurements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / existingMeasurements.length;
  const standardDeviation = Math.sqrt(variance);

  const zScore = Math.abs((measurement - mean) / standardDeviation);

  if (zScore > outlierThreshold) {
    return {
      isValid: true,
      warning: `This value (${measurement}) is significantly different from your usual range. Please verify it's correct.`
    };
  }

  return { isValid: true };
}