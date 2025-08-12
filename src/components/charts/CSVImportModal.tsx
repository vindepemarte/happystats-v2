// CSV Import Modal Component with drag-and-drop support

"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  validateCSVFile, 
  readFileAsText, 
  parseAndValidateCSV,
  groupDataPointsByCategory 
} from '../../lib/csv-import';
import { Chart, CSVDataPoint } from '../../types/chart';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (chart: Chart) => void;
}

interface ImportPreview {
  isValid: boolean;
  errors: string[];
  validRows: CSVDataPoint[];
  totalRows: number;
  categories: string[];
  sampleData: CSVDataPoint[];
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const [chartName, setChartName] = useState<string>('');
  const [skipFirstRow, setSkipFirstRow] = useState<boolean>(true);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state
  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setCsvData('');
    setChartName('');
    setSkipFirstRow(true);
    setPreview(null);
    setError(null);
    setIsDragOver(false);
    setIsProcessing(false);
  }, []);

  // Handle modal close
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validate file
      const fileValidation = validateCSVFile(selectedFile);
      if (!fileValidation.isValid) {
        setError(fileValidation.error || 'Invalid file');
        setIsProcessing(false);
        return;
      }

      // Read file content
      const content = await readFileAsText(selectedFile);
      
      setFile(selectedFile);
      setCsvData(content);
      
      // Generate default chart name from filename
      const defaultName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setChartName(defaultName);
      
      // Parse and preview data
      await handlePreviewData(content, skipFirstRow);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setIsProcessing(false);
    }
  }, [skipFirstRow]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Preview CSV data
  const handlePreviewData = useCallback(async (data: string, skipFirst: boolean) => {
    setIsProcessing(true);
    setError(null);

    try {
      const parseResult = parseAndValidateCSV(data, { skipFirstRow: skipFirst });
      
      const categoryGroups = parseResult.validRows.length > 0 
        ? groupDataPointsByCategory(parseResult.validRows)
        : {};

      setPreview({
        isValid: parseResult.isValid,
        errors: parseResult.errors,
        validRows: parseResult.validRows,
        totalRows: parseResult.totalRows,
        categories: Object.keys(categoryGroups),
        sampleData: parseResult.validRows.slice(0, 5)
      });

      if (parseResult.isValid && parseResult.validRows.length > 0) {
        setStep('preview');
      } else {
        setError('No valid data found in CSV file');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handle skip first row change
  const handleSkipFirstRowChange = useCallback((checked: boolean) => {
    setSkipFirstRow(checked);
    if (csvData) {
      handlePreviewData(csvData, checked);
    }
  }, [csvData]);

  // Import CSV data
  const handleImport = useCallback(async () => {
    if (!csvData || !chartName.trim() || !preview?.isValid) {
      return;
    }

    setStep('importing');
    setError(null);

    try {
      const response = await fetch('/api/charts/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData,
          chartName: chartName.trim(),
          skipFirstRow,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import CSV');
      }

      // Success
      onImportSuccess(result.chart);
      handleClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
      setStep('preview');
    }
  }, [csvData, chartName, preview, skipFirstRow, onImportSuccess, handleClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import CSV Data">
      <div className="space-y-6">
        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload a CSV file with your data. The file should contain columns for measurement, date, name, and category.
            </div>

            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div className="space-y-2">
                <div className="text-lg font-medium">
                  {isDragOver ? 'Drop your CSV file here' : 'Drag and drop your CSV file'}
                </div>
                <div className="text-sm text-muted-foreground">
                  or click to browse files
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  'Choose File'
                )}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* File Info */}
            {file && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Options */}
            {file && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="skipFirstRow"
                    checked={skipFirstRow}
                    onChange={(e) => handleSkipFirstRowChange(e.target.checked)}
                    className="rounded border-border"
                  />
                  <label htmlFor="skipFirstRow" className="text-sm">
                    Skip first row (contains headers)
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preview Import</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('upload')}
              >
                Back
              </Button>
            </div>

            {/* Chart Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Chart Name</label>
              <Input
                value={chartName}
                onChange={(e) => setChartName(e.target.value)}
                placeholder="Enter chart name"
                required
              />
            </div>

            {/* Import Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Import Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total rows:</span>
                  <span className="font-medium">{preview.totalRows}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Valid rows:</span>
                  <span className="font-medium text-green-600">{preview.validRows.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Categories found:</span>
                  <span className="font-medium">{preview.categories.length}</span>
                </div>
                {preview.categories.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Categories: {preview.categories.join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sample Data Preview */}
            {preview.sampleData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sample Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Measurement</th>
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sampleData.map((row, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{row.measurement}</td>
                            <td className="p-2">{row.date}</td>
                            <td className="p-2">{row.name}</td>
                            <td className="p-2">{row.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.validRows.length > preview.sampleData.length && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Showing {preview.sampleData.length} of {preview.validRows.length} rows
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Validation Errors */}
            {preview.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Validation Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {preview.errors.map((error, index) => (
                      <li key={index} className="text-destructive">• {error}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <div className="text-lg font-medium">Importing your data...</div>
            <div className="text-sm text-muted-foreground">This may take a moment</div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          
          {step === 'preview' && (
            <Button
              onClick={handleImport}
              disabled={!chartName.trim() || !preview?.isValid || preview.validRows.length === 0}
            >
              Import Data
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CSVImportModal;