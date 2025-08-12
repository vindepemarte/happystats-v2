// CSV export utilities for generating and downloading chart data

import { Chart, DataPoint } from '../types/chart';

export interface CSVExportOptions {
  includeHeaders?: boolean;
  dateFormat?: 'ISO' | 'US' | 'EU';
  filename?: string;
}

export interface ExportProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'preparing' | 'generating' | 'downloading' | 'complete' | 'error';
  message?: string;
}

// CSV column headers
export const CSV_HEADERS = ['measurement', 'date', 'name', 'category'] as const;

// Format date for CSV export
export function formatDateForCSV(date: Date | string, format: 'ISO' | 'US' | 'EU' = 'ISO'): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return new Date().toISOString().split('T')[0]; // Fallback to today
  }

  switch (format) {
    case 'US':
      return dateObj.toLocaleDateString('en-US'); // MM/DD/YYYY
    case 'EU':
      return dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
    case 'ISO':
    default:
      return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}

// Escape CSV field value
export function escapeCSVField(value: string | number): string {
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

// Convert single chart to CSV format
export function chartToCSV(chart: Chart, options: CSVExportOptions = {}): string {
  if (!chart || !chart.dataPoints) {
    throw new Error('Invalid chart data provided');
  }
  
  const { includeHeaders = true, dateFormat = 'ISO' } = options;
  
  const lines: string[] = [];
  
  // Add headers if requested
  if (includeHeaders) {
    lines.push(CSV_HEADERS.join(','));
  }
  
  // Sort data points by date
  const sortedDataPoints = [...chart.dataPoints].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Convert each data point to CSV row
  for (const dataPoint of sortedDataPoints) {
    if (!dataPoint) continue;
    
    const row = [
      escapeCSVField(dataPoint.measurement),
      escapeCSVField(formatDateForCSV(dataPoint.date, dateFormat)),
      escapeCSVField(dataPoint.name),
      escapeCSVField(chart.category)
    ];
    
    lines.push(row.join(','));
  }
  
  return lines.join('\n');
}

// Convert multiple charts to CSV format
export function chartsToCSV(charts: Chart[], options: CSVExportOptions = {}): string {
  const { includeHeaders = true, dateFormat = 'ISO' } = options;
  
  const lines: string[] = [];
  
  // Add headers if requested
  if (includeHeaders) {
    lines.push(CSV_HEADERS.join(','));
  }
  
  // Collect all data points from all charts
  const allDataPoints: Array<DataPoint & { chartName: string; category: string }> = [];
  
  for (const chart of charts) {
    for (const dataPoint of chart.dataPoints) {
      allDataPoints.push({
        ...dataPoint,
        chartName: chart.name,
        category: chart.category
      });
    }
  }
  
  // Sort all data points by date
  allDataPoints.sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Convert each data point to CSV row
  for (const dataPoint of allDataPoints) {
    const row = [
      escapeCSVField(dataPoint.measurement),
      escapeCSVField(formatDateForCSV(dataPoint.date, dateFormat)),
      escapeCSVField(dataPoint.name),
      escapeCSVField(dataPoint.category)
    ];
    
    lines.push(row.join(','));
  }
  
  return lines.join('\n');
}

// Generate filename for CSV export
export function generateCSVFilename(chart: Chart): string;
export function generateCSVFilename(charts: Chart[]): string;
export function generateCSVFilename(input: Chart | Chart[]): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (Array.isArray(input)) {
    // Multiple charts
    if (input.length === 0) {
      return `happystats-export-${timestamp}.csv`;
    }
    
    if (input.length === 1) {
      const chart = input[0];
      const safeName = chart.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
      return `${safeName}-${timestamp}.csv`;
    }
    
    // Multiple charts - use generic name
    return `happystats-${input.length}-charts-${timestamp}.csv`;
  } else {
    // Single chart
    const chart = input;
    const safeName = chart.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    return `${safeName}-${timestamp}.csv`;
  }
}

// Download CSV file
export function downloadCSV(csvContent: string, filename: string): void {
  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

// Export single chart with progress tracking
export async function exportChart(
  chart: Chart, 
  options: CSVExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const totalSteps = 3;
  let currentStep = 0;
  
  try {
    // Step 1: Prepare data
    onProgress?.({
      current: ++currentStep,
      total: totalSteps,
      percentage: (currentStep / totalSteps) * 100,
      status: 'preparing',
      message: 'Preparing chart data...'
    });
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UX
    
    // Step 2: Generate CSV
    onProgress?.({
      current: ++currentStep,
      total: totalSteps,
      percentage: (currentStep / totalSteps) * 100,
      status: 'generating',
      message: 'Generating CSV file...'
    });
    
    const csvContent = chartToCSV(chart, options);
    const filename = options.filename || generateCSVFilename(chart);
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for UX
    
    // Step 3: Download file
    onProgress?.({
      current: ++currentStep,
      total: totalSteps,
      percentage: (currentStep / totalSteps) * 100,
      status: 'downloading',
      message: 'Starting download...'
    });
    
    downloadCSV(csvContent, filename);
    
    // Complete
    onProgress?.({
      current: totalSteps,
      total: totalSteps,
      percentage: 100,
      status: 'complete',
      message: 'Export completed successfully!'
    });
    
  } catch (error) {
    onProgress?.({
      current: currentStep,
      total: totalSteps,
      percentage: 0,
      status: 'error',
      message: error instanceof Error ? error.message : 'Export failed'
    });
    throw error;
  }
}

// Export multiple charts with progress tracking
export async function exportCharts(
  charts: Chart[], 
  options: CSVExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const totalSteps = 3;
  let currentStep = 0;
  
  try {
    // Step 1: Prepare data
    onProgress?.({
      current: ++currentStep,
      total: totalSteps,
      percentage: (currentStep / totalSteps) * 100,
      status: 'preparing',
      message: `Preparing ${charts.length} charts...`
    });
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for UX
    
    // Step 2: Generate CSV
    onProgress?.({
      current: ++currentStep,
      total: totalSteps,
      percentage: (currentStep / totalSteps) * 100,
      status: 'generating',
      message: 'Generating CSV file...'
    });
    
    const csvContent = chartsToCSV(charts, options);
    const filename = options.filename || generateCSVFilename(charts);
    
    // Add longer delay for multiple charts
    await new Promise(resolve => setTimeout(resolve, Math.min(charts.length * 50, 500)));
    
    // Step 3: Download file
    onProgress?.({
      current: ++currentStep,
      total: totalSteps,
      percentage: (currentStep / totalSteps) * 100,
      status: 'downloading',
      message: 'Starting download...'
    });
    
    downloadCSV(csvContent, filename);
    
    // Complete
    onProgress?.({
      current: totalSteps,
      total: totalSteps,
      percentage: 100,
      status: 'complete',
      message: `Successfully exported ${charts.length} charts!`
    });
    
  } catch (error) {
    onProgress?.({
      current: currentStep,
      total: totalSteps,
      percentage: 0,
      status: 'error',
      message: error instanceof Error ? error.message : 'Export failed'
    });
    throw error;
  }
}

// Validate chart data before export
export function validateChartForExport(chart: Chart): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!chart) {
    errors.push('Chart data is missing');
    return { isValid: false, errors };
  }
  
  if (!chart.name || chart.name.trim().length === 0) {
    errors.push('Chart name is required');
  }
  
  if (!chart.category || chart.category.trim().length === 0) {
    errors.push('Chart category is required');
  }
  
  if (!chart.dataPoints || chart.dataPoints.length === 0) {
    errors.push('Chart has no data points to export');
  } else {
    // Validate data points
    for (let i = 0; i < chart.dataPoints.length; i++) {
      const dp = chart.dataPoints[i];
      
      if (!dp) {
        errors.push(`Data point ${i + 1}: Data point is missing`);
        continue;
      }
      
      if (typeof dp.measurement !== 'number' || isNaN(dp.measurement)) {
        errors.push(`Data point ${i + 1}: Invalid measurement value`);
      }
      
      if (!dp.date) {
        errors.push(`Data point ${i + 1}: Missing date`);
      } else {
        const date = dp.date instanceof Date ? dp.date : new Date(dp.date);
        if (isNaN(date.getTime())) {
          errors.push(`Data point ${i + 1}: Invalid date`);
        }
      }
      
      if (!dp.name || dp.name.trim().length === 0) {
        errors.push(`Data point ${i + 1}: Missing name`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Get export statistics
export function getExportStatistics(charts: Chart[]): {
  totalCharts: number;
  totalDataPoints: number;
  dateRange: { earliest: Date | null; latest: Date | null };
  categories: string[];
} {
  const totalCharts = charts.length;
  let totalDataPoints = 0;
  let earliest: Date | null = null;
  let latest: Date | null = null;
  const categories = new Set<string>();
  
  for (const chart of charts) {
    totalDataPoints += chart.dataPoints.length;
    categories.add(chart.category);
    
    for (const dp of chart.dataPoints) {
      const date = dp.date instanceof Date ? dp.date : new Date(dp.date);
      
      if (!isNaN(date.getTime())) {
        if (!earliest || date < earliest) {
          earliest = date;
        }
        if (!latest || date > latest) {
          latest = date;
        }
      }
    }
  }
  
  return {
    totalCharts,
    totalDataPoints,
    dateRange: { earliest, latest },
    categories: Array.from(categories).sort()
  };
}