// CSV export button component for individual charts

"use client";

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal, ModalFooter } from '../ui/Modal';
import { Chart } from '../../types/chart';
import { 
  exportChart, 
  validateChartForExport, 
  ExportProgress,
  CSVExportOptions 
} from '../../lib/csv-export';

interface CSVExportButtonProps {
  chart: Chart;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

const CSVExportButton: React.FC<CSVExportButtonProps> = ({
  chart,
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

  // Validate chart before showing modal
  const handleExportClick = () => {
    const validation = validateChartForExport(chart);
    
    if (!validation.isValid) {
      // Show validation errors (could be enhanced with a proper error modal)
      alert(`Cannot export chart:\n${validation.errors.join('\n')}`);
      return;
    }
    
    setIsModalOpen(true);
  };

  // Handle export execution
  const handleConfirmExport = async () => {
    setIsExporting(true);
    setProgress(null);
    
    try {
      await exportChart(chart, exportOptions, (progress) => {
        setProgress(progress);
      });
      
      // Close modal after successful export
      setTimeout(() => {
        setIsModalOpen(false);
        setIsExporting(false);
        setProgress(null);
      }, 1000);
      
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      // Progress will show error state
    }
  };

  const handleCancelExport = () => {
    if (!isExporting) {
      setIsModalOpen(false);
      setProgress(null);
    }
  };

  // Check if chart has data to export
  const hasData = chart.dataPoints && chart.dataPoints.length > 0;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleExportClick}
        disabled={!hasData}
        title={hasData ? 'Export chart data as CSV' : 'No data to export'}
      >
        {showIcon && (
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {children || 'Export CSV'}
      </Button>

      {/* Export Configuration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelExport}
        title="Export Chart Data"
        description="Configure your CSV export settings"
      >
        <div className="space-y-6">
          {/* Chart Information */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-2">{chart.name}</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Category: {chart.category}</p>
              <p>Data points: {chart.dataPoints?.length || 0}</p>
              {chart.dataPoints && chart.dataPoints.length > 0 && (
                <p>
                  Date range: {new Date(Math.min(...chart.dataPoints.map(dp => new Date(dp.date).getTime()))).toLocaleDateString()} 
                  {' '} to {' '}
                  {new Date(Math.max(...chart.dataPoints.map(dp => new Date(dp.date).getTime()))).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h5 className="font-medium">Export Options</h5>
            
            {/* Include Headers */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeHeaders"
                checked={exportOptions.includeHeaders}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  includeHeaders: e.target.checked
                }))}
                className="rounded border-border"
              />
              <label htmlFor="includeHeaders" className="text-sm">
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
                  Export completed successfully!
                </div>
              )}
            </div>
          )}

          {/* CSV Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium">CSV Preview</label>
            <div className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto">
              <div className="text-muted-foreground">
                {exportOptions.includeHeaders && 'measurement,date,name,category\n'}
                {chart.dataPoints && chart.dataPoints.slice(0, 3).map((dp, index) => (
                  <div key={index}>
                    {dp.measurement},{new Date(dp.date).toISOString().split('T')[0]},{`"${dp.name}"`},{`"${chart.category}"`}
                  </div>
                ))}
                {chart.dataPoints && chart.dataPoints.length > 3 && (
                  <div className="text-muted-foreground">
                    ... and {chart.dataPoints.length - 3} more rows
                  </div>
                )}
              </div>
            </div>
          </div>
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
            disabled={isExporting || !chart.dataPoints || chart.dataPoints.length === 0}
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export { CSVExportButton };