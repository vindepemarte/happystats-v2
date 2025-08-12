// Bulk CSV export button component for multiple charts

"use client";

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal, ModalFooter } from '../ui/Modal';
import { Chart } from '../../types/chart';
import { 
  exportCharts, 
  validateChartForExport, 
  ExportProgress,
  CSVExportOptions,
  getExportStatistics
} from '../../lib/csv-export';

interface BulkCSVExportButtonProps {
  charts: Chart[];
  selectedCharts?: Chart[];
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

const BulkCSVExportButton: React.FC<BulkCSVExportButtonProps> = ({
  charts,
  selectedCharts,
  variant = 'outline',
  size = 'sm',
  className = '',
  showIcon = true,
  children
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportOptions, setExportOptions] = useState<CSVExportOptions>({
    includeHeaders: true,
    dateFormat: 'ISO'
  });
  const [chartSelection, setChartSelection] = useState<string[]>([]);

  // Use selected charts if provided, otherwise use all charts
  const availableCharts = selectedCharts || charts;
  
  // Initialize chart selection when modal opens
  const handleExportClick = () => {
    // Validate charts and filter out invalid ones
    const validCharts = availableCharts.filter(chart => {
      const validation = validateChartForExport(chart);
      return validation.isValid;
    });
    
    if (validCharts.length === 0) {
      alert('No valid charts available for export. Charts must have data points to be exported.');
      return;
    }
    
    // Pre-select all valid charts
    setChartSelection(validCharts.map(chart => chart.id));
    setIsModalOpen(true);
  };

  // Handle chart selection toggle
  const handleChartToggle = (chartId: string) => {
    setChartSelection(prev => 
      prev.includes(chartId)
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  // Handle select all/none
  const handleSelectAll = () => {
    const validCharts = availableCharts.filter(chart => {
      const validation = validateChartForExport(chart);
      return validation.isValid;
    });
    
    setChartSelection(validCharts.map(chart => chart.id));
  };

  const handleSelectNone = () => {
    setChartSelection([]);
  };

  // Handle export execution
  const handleConfirmExport = async () => {
    const selectedChartObjects = availableCharts.filter(chart => 
      chartSelection.includes(chart.id)
    );
    
    if (selectedChartObjects.length === 0) {
      alert('Please select at least one chart to export.');
      return;
    }
    
    setIsExporting(true);
    setProgress(null);
    
    try {
      await exportCharts(selectedChartObjects, exportOptions, (progress) => {
        setProgress(progress);
      });
      
      // Close modal after successful export
      setTimeout(() => {
        setIsModalOpen(false);
        setIsExporting(false);
        setProgress(null);
      }, 1000);
      
    } catch (error) {
      console.error('Bulk export error:', error);
      setIsExporting(false);
      // Progress will show error state
    }
  };

  const handleCancelExport = () => {
    if (!isExporting) {
      setIsModalOpen(false);
      setProgress(null);
      setChartSelection([]);
    }
  };

  // Get statistics for selected charts
  const selectedChartObjects = availableCharts.filter(chart => 
    chartSelection.includes(chart.id)
  );
  const stats = getExportStatistics(selectedChartObjects);

  // Check if any charts have data to export
  const hasValidCharts = availableCharts.some(chart => {
    const validation = validateChartForExport(chart);
    return validation.isValid;
  });

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleExportClick}
        disabled={!hasValidCharts}
        title={hasValidCharts ? 'Export multiple charts as CSV' : 'No charts with data to export'}
      >
        {showIcon && (
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        )}
        {children || `Export ${availableCharts.length} Charts`}
      </Button>

      {/* Bulk Export Configuration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelExport}
        title="Bulk Export Charts"
        description="Select charts and configure export settings"
      >
        <div className="space-y-6">
          {/* Chart Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Select Charts to Export</h5>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isExporting}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectNone}
                  disabled={isExporting}
                >
                  Select None
                </Button>
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
              {availableCharts.map((chart) => {
                const validation = validateChartForExport(chart);
                const isValid = validation.isValid;
                const isSelected = chartSelection.includes(chart.id);
                
                return (
                  <div
                    key={chart.id}
                    className={`flex items-center space-x-3 p-3 border-b border-border last:border-b-0 ${
                      !isValid ? 'opacity-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`chart-${chart.id}`}
                      checked={isSelected}
                      onChange={() => handleChartToggle(chart.id)}
                      disabled={!isValid || isExporting}
                      className="rounded border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={`chart-${chart.id}`}
                        className={`block text-sm font-medium cursor-pointer ${
                          !isValid ? 'text-muted-foreground' : ''
                        }`}
                      >
                        {chart.name}
                      </label>
                      <div className="text-xs text-muted-foreground">
                        {chart.category} • {chart.dataPoints.length} data points
                        {!isValid && (
                          <span className="text-destructive ml-2">
                            (No data to export)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selection Summary */}
          {chartSelection.length > 0 && (
            <div className="bg-muted rounded-lg p-4">
              <h5 className="font-medium mb-2">Export Summary</h5>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Charts selected: {stats.totalCharts}</p>
                <p>Total data points: {stats.totalDataPoints}</p>
                <p>Categories: {stats.categories.join(', ')}</p>
                {stats.dateRange.earliest && stats.dateRange.latest && (
                  <p>
                    Date range: {stats.dateRange.earliest.toLocaleDateString()} 
                    {' '} to {' '}
                    {stats.dateRange.latest.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-4">
            <h5 className="font-medium">Export Options</h5>
            
            {/* Include Headers */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="bulkIncludeHeaders"
                checked={exportOptions.includeHeaders}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  includeHeaders: e.target.checked
                }))}
                disabled={isExporting}
                className="rounded border-border"
              />
              <label htmlFor="bulkIncludeHeaders" className="text-sm">
                Include column headers
              </label>
            </div>

            {/* Date Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Format</label>
              <select
                value={exportOptions.dateFormat}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateFormat: e.target.value as 'ISO' | 'US' | 'EU'
                }))}
                disabled={isExporting}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="ISO">ISO (YYYY-MM-DD)</option>
                <option value="US">US (MM/DD/YYYY)</option>
                <option value="EU">EU (DD/MM/YYYY)</option>
              </select>
            </div>
          </div>

          {/* Progress Indicator */}
          {progress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {progress.message || 'Processing...'}
                </span>
                <span className="font-medium">
                  {Math.round(progress.percentage)}%
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress.status === 'error' 
                      ? 'bg-destructive' 
                      : progress.status === 'complete'
                      ? 'bg-green-500'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              
              {progress.status === 'error' && (
                <div className="text-sm text-destructive">
                  Export failed. Please try again.
                </div>
              )}
              
              {progress.status === 'complete' && (
                <div className="text-sm text-green-600">
                  Bulk export completed successfully!
                </div>
              )}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button 
            variant="outline" 
            onClick={handleCancelExport}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmExport}
            loading={isExporting}
            disabled={isExporting || chartSelection.length === 0}
          >
            {isExporting 
              ? 'Exporting...' 
              : `Export ${chartSelection.length} Chart${chartSelection.length !== 1 ? 's' : ''}`
            }
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export { BulkCSVExportButton };