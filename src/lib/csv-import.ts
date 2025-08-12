// CSV import utilities for parsing and validation

import { CSVDataPoint, ImportValidationResult } from '../types/chart';

export interface CSVImportOptions {
  skipFirstRow?: boolean;
  dateFormat?: 'ISO' | 'US' | 'EU';
}

// Expected CSV columns
export const REQUIRED_COLUMNS = ['measurement', 'date', 'name', 'category'] as const;
export const COLUMN_ALIASES = {
  measurement: ['measurement', 'value', 'amount', 'data', 'number'],
  date: ['date', 'timestamp', 'time', 'when'],
  name: ['name', 'label', 'description', 'title'],
  category: ['category', 'type', 'group', 'class']
};

// Parse CSV text into rows
export function parseCSVText(csvText: string): string[][] {
  const lines = csvText.trim().split('\n');
  const rows: string[][] = [];
  
  for (const line of lines) {
    // Simple CSV parsing - handles basic comma separation
    // For production, consider using a more robust CSV parser like papaparse
    const row = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
    rows.push(row);
  }
  
  return rows;
}

// Detect column mapping from headers
export function detectColumnMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  for (const [requiredCol, aliases] of Object.entries(COLUMN_ALIASES)) {
    const headerIndex = headers.findIndex(header => 
      aliases.some(alias => 
        header.toLowerCase().includes(alias.toLowerCase())
      )
    );
    
    if (headerIndex !== -1) {
      mapping[requiredCol] = headerIndex;
    }
  }
  
  return mapping;
}

// Validate a single data point
export function validateDataPoint(
  row: string[], 
  mapping: Record<string, number>,
  rowIndex: number
): { isValid: boolean; errors: string[]; dataPoint?: CSVDataPoint } {
  const errors: string[] = [];
  
  // Check if all required columns are mapped
  for (const col of REQUIRED_COLUMNS) {
    if (!(col in mapping)) {
      errors.push(`Missing required column: ${col}`);
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Extract values
  const measurementStr = row[mapping.measurement]?.trim();
  const dateStr = row[mapping.date]?.trim();
  const name = row[mapping.name]?.trim();
  const category = row[mapping.category]?.trim();
  
  // Validate measurement
  if (!measurementStr) {
    errors.push(`Row ${rowIndex + 1}: Measurement is required`);
  } else {
    const measurement = parseFloat(measurementStr);
    if (isNaN(measurement)) {
      errors.push(`Row ${rowIndex + 1}: Invalid measurement value "${measurementStr}"`);
    }
  }
  
  // Validate date
  if (!dateStr) {
    errors.push(`Row ${rowIndex + 1}: Date is required`);
  } else {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      errors.push(`Row ${rowIndex + 1}: Invalid date format "${dateStr}"`);
    }
  }
  
  // Validate name
  if (!name) {
    errors.push(`Row ${rowIndex + 1}: Name is required`);
  } else if (name.length > 255) {
    errors.push(`Row ${rowIndex + 1}: Name too long (max 255 characters)`);
  }
  
  // Validate category
  if (!category) {
    errors.push(`Row ${rowIndex + 1}: Category is required`);
  } else if (category.length > 100) {
    errors.push(`Row ${rowIndex + 1}: Category too long (max 100 characters)`);
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Create valid data point
  const dataPoint: CSVDataPoint = {
    measurement: parseFloat(measurementStr),
    date: dateStr,
    name,
    category
  };
  
  return { isValid: true, errors: [], dataPoint };
}

// Parse and validate entire CSV
export function parseAndValidateCSV(
  csvText: string, 
  options: CSVImportOptions = {}
): ImportValidationResult {
  const { skipFirstRow = true } = options;
  
  try {
    const rows = parseCSVText(csvText);
    
    if (rows.length === 0) {
      return {
        isValid: false,
        errors: ['CSV file is empty'],
        validRows: [],
        totalRows: 0
      };
    }
    
    // Detect headers and column mapping
    const headers = rows[0];
    const mapping = detectColumnMapping(headers);
    
    // Check if we have all required columns
    const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in mapping));
    if (missingColumns.length > 0) {
      return {
        isValid: false,
        errors: [
          `Missing required columns: ${missingColumns.join(', ')}`,
          `Available columns: ${headers.join(', ')}`,
          `Expected columns: ${REQUIRED_COLUMNS.join(', ')}`
        ],
        validRows: [],
        totalRows: rows.length
      };
    }
    
    // Process data rows
    const dataRows = skipFirstRow ? rows.slice(1) : rows;
    const validRows: CSVDataPoint[] = [];
    const allErrors: string[] = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Skip empty rows
      if (row.every(cell => !cell.trim())) {
        continue;
      }
      
      const validation = validateDataPoint(row, mapping, i);
      
      if (validation.isValid && validation.dataPoint) {
        validRows.push(validation.dataPoint);
      } else {
        allErrors.push(...validation.errors);
      }
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      validRows,
      totalRows: dataRows.length
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
      validRows: [],
      totalRows: 0
    };
  }
}

// Create chart from CSV data
export function groupDataPointsByCategory(dataPoints: CSVDataPoint[]): Record<string, CSVDataPoint[]> {
  const groups: Record<string, CSVDataPoint[]> = {};
  
  for (const dataPoint of dataPoints) {
    if (!groups[dataPoint.category]) {
      groups[dataPoint.category] = [];
    }
    groups[dataPoint.category].push(dataPoint);
  }
  
  return groups;
}

// Generate suggested chart names from CSV data
export function generateChartNames(dataPoints: CSVDataPoint[]): string[] {
  const categories = Array.from(new Set(dataPoints.map(dp => dp.category)));
  return categories.map(category => `${category} Data`);
}

// Validate file size and type
export function validateCSVFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const validTypes = ['text/csv', 'application/csv', 'text/plain'];
  const validExtensions = ['.csv', '.txt'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidType && !hasValidExtension) {
    return {
      isValid: false,
      error: 'Please upload a CSV file (.csv or .txt)'
    };
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 5MB'
    };
  }
  
  return { isValid: true };
}

// Read file as text
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}