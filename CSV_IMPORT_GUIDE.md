# CSV Import Guide

## Overview

The CSV import functionality allows users to bulk import data points from CSV files to create new charts. This feature includes drag-and-drop support, data validation, preview functionality, and subscription limit checking.

## CSV Format Requirements

### Required Columns

Your CSV file must contain the following columns (column names are case-insensitive):

- **measurement** (aliases: value, amount, data, number) - Numeric value for the data point
- **date** (aliases: timestamp, time, when) - Date in ISO format (YYYY-MM-DD) or other standard formats
- **name** (aliases: label, description, title) - Name/description for the data point
- **category** (aliases: type, group, class) - Category for grouping the data

### Sample CSV Format

```csv
measurement,date,name,category
10.5,2024-01-01,Morning Weight,Health
10.3,2024-01-02,Morning Weight,Health
150,2024-01-01,Daily Steps,Fitness
200,2024-01-02,Daily Steps,Fitness
```

### File Requirements

- File format: `.csv` or `.txt`
- Maximum file size: 5MB
- First row should contain column headers (can be skipped during import)
- Empty rows are automatically skipped

## Features Implemented

### 1. CSV File Upload Component (`CSVImportModal.tsx`)
- **Drag-and-drop support**: Users can drag CSV files directly onto the upload area
- **File validation**: Checks file type and size before processing
- **Visual feedback**: Shows drag-over states and file information

### 2. CSV Parsing and Validation (`csv-import.ts`)
- **Column detection**: Automatically detects required columns using aliases
- **Data validation**: Validates each row for required fields and data types
- **Error reporting**: Provides detailed error messages for invalid data
- **Flexible parsing**: Handles various CSV formats and column naming conventions

### 3. Data Preview
- **Sample data display**: Shows first 5 rows of parsed data in a table
- **Import summary**: Displays total rows, valid rows, and categories found
- **Error display**: Lists all validation errors with row numbers
- **Category breakdown**: Shows how data will be grouped by category

### 4. Chart Creation with Subscription Limits
- **Limit checking**: Respects user subscription tier chart limits
- **Single chart creation**: Currently creates one chart from the primary category
- **Data point creation**: Bulk creates all data points for the chart
- **Success feedback**: Shows import summary and created chart information

### 5. API Endpoints

#### POST `/api/charts/import`
Creates a new chart from CSV data.

**Request Body:**
```json
{
  "csvData": "string", // Raw CSV content
  "chartName": "string", // Name for the new chart
  "skipFirstRow": boolean // Whether to skip header row (default: true)
}
```

**Response:**
```json
{
  "message": "CSV imported successfully",
  "chart": { /* Chart object with data points */ },
  "importSummary": {
    "totalRowsProcessed": 10,
    "validRowsFound": 8,
    "dataPointsCreated": 8,
    "categoriesFound": ["Health", "Fitness"],
    "primaryCategory": "Health",
    "skippedCategories": ["Fitness"]
  },
  "warnings": ["Found 2 categories. Only 'Health' was imported..."]
}
```

#### PUT `/api/charts/import/validate`
Validates CSV data without creating a chart.

**Request Body:**
```json
{
  "csvData": "string",
  "skipFirstRow": boolean
}
```

**Response:**
```json
{
  "validation": {
    "isValid": true,
    "errors": [],
    "totalRows": 10,
    "validRows": 8
  },
  "preview": {
    "categories": ["Health", "Fitness"],
    "sampleData": [/* First 5 valid data points */],
    "categoryBreakdown": [
      {
        "category": "Health",
        "count": 4,
        "samplePoints": [/* First 3 points */]
      }
    ]
  }
}
```

## Integration Points

### Dashboard Integration
- CSV import button added to dashboard header alongside "Create Chart" button
- Import success triggers chart list refresh
- Respects existing chart filtering and search functionality

### Subscription Integration
- Uses `withChartLimit` middleware to check subscription limits
- Prevents import if user has reached chart limit for their tier
- Shows appropriate error messages for limit violations

## Error Handling

### File Validation Errors
- Invalid file type or extension
- File size exceeds 5MB limit
- File read errors

### CSV Parsing Errors
- Missing required columns
- Empty CSV files
- Invalid CSV format

### Data Validation Errors
- Invalid measurement values (non-numeric)
- Invalid date formats
- Missing required fields (measurement, date, name, category)
- Field length violations (name > 255 chars, category > 100 chars)

### API Errors
- Authentication required
- Subscription limit reached
- Database errors during chart/data point creation

## Future Enhancements

1. **Multiple Chart Creation**: Allow creating separate charts for each category
2. **Advanced CSV Parsing**: Use a more robust CSV parser like PapaParse
3. **Date Format Detection**: Automatically detect and convert various date formats
4. **Data Mapping Interface**: Allow users to manually map CSV columns to required fields
5. **Batch Import**: Support importing multiple CSV files at once
6. **Import History**: Track and display previous imports
7. **Data Transformation**: Allow basic data transformations during import (unit conversion, etc.)

## Testing

To test the CSV import functionality:

1. Use the sample CSV file at `/public/sample-data.csv`
2. Navigate to the dashboard
3. Click "Import CSV" button
4. Upload the sample file or drag it to the upload area
5. Review the preview and click "Import Data"
6. Verify the chart is created with the imported data points

## Requirements Satisfied

This implementation satisfies the following requirements from task 13:

- ✅ **6.3**: CSV file upload component with drag-and-drop support
- ✅ **6.4**: CSV parsing and validation logic for required columns
- ✅ **6.5**: Error handling for invalid CSV formats
- ✅ **6.3**: Preview functionality to show parsed data before import
- ✅ **6.5**: Chart creation from CSV data with subscription limit checking