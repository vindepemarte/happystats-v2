// Date range filter component for chart data filtering

"use client";

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeFilterProps {
  onDateRangeChange: (dateRange: DateRange | null) => void;
  dataDateRange?: {
    earliest: Date;
    latest: Date;
  };
  isActive?: boolean;
  className?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onDateRangeChange,
  dataDateRange,

  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Parse date from input string
  const parseDateFromInput = (dateString: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString + 'T00:00:00');
    return isNaN(date.getTime()) ? null : date;
  };

  // Validate date range
  const validateDateRange = (start: string, end: string): string => {
    if (!start && !end) return '';
    
    const startDateObj = parseDateFromInput(start);
    const endDateObj = parseDateFromInput(end);
    
    if (start && !startDateObj) return 'Invalid start date';
    if (end && !endDateObj) return 'Invalid end date';
    
    if (startDateObj && endDateObj && startDateObj > endDateObj) {
      return 'Start date must be before end date';
    }
    
    return '';
  };

  // Handle start date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDate(value);
    
    const validationError = validateDateRange(value, endDate);
    setError(validationError);
    
    if (!validationError) {
      const startDateObj = parseDateFromInput(value);
      const endDateObj = parseDateFromInput(endDate);
      
      if (startDateObj || endDateObj) {
        onDateRangeChange({
          startDate: startDateObj,
          endDate: endDateObj,
        });
      } else {
        onDateRangeChange(null);
      }
    }
  };

  // Handle end date change
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndDate(value);
    
    const validationError = validateDateRange(startDate, value);
    setError(validationError);
    
    if (!validationError) {
      const startDateObj = parseDateFromInput(startDate);
      const endDateObj = parseDateFromInput(value);
      
      if (startDateObj || endDateObj) {
        onDateRangeChange({
          startDate: startDateObj,
          endDate: endDateObj,
        });
      } else {
        onDateRangeChange(null);
      }
    }
  };

  // Clear date range
  const handleClearDateRange = () => {
    setStartDate('');
    setEndDate('');
    setError('');
    onDateRangeChange(null);
  };

  // Quick date range presets
  const handleQuickRange = (days: number) => {
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(endDateObj.getDate() - days);
    
    setStartDate(formatDateForInput(startDateObj));
    setEndDate(formatDateForInput(endDateObj));
    setError('');
    
    onDateRangeChange({
      startDate: startDateObj,
      endDate: endDateObj,
    });
  };

  // Get min and max dates for inputs based on data range
  const getInputConstraints = () => {
    if (!dataDateRange) return {};
    
    return {
      min: formatDateForInput(dataDateRange.earliest),
      max: formatDateForInput(dataDateRange.latest),
    };
  };

  const inputConstraints = getInputConstraints();
  const hasActiveRange = startDate || endDate;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Date Range Toggle Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Date Range
          {hasActiveRange && (
            <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </Button>
        
        {hasActiveRange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDateRange}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Date Range Controls */}
      {isExpanded && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Quick Range Buttons */}
            <div>
              <h4 className="text-sm font-medium mb-2">Quick Ranges</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRange(7)}
                  className="text-xs"
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRange(30)}
                  className="text-xs"
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRange(90)}
                  className="text-xs"
                >
                  Last 3 months
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRange(365)}
                  className="text-xs"
                >
                  Last year
                </Button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div>
              <h4 className="text-sm font-medium mb-2">Custom Range</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    {...inputConstraints}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    {...inputConstraints}
                    className="text-sm"
                  />
                </div>
              </div>
              
              {error && (
                <div className="text-sm text-destructive mt-2">
                  {error}
                </div>
              )}
            </div>

            {/* Data Range Info */}
            {dataDateRange && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <div className="flex justify-between">
                  <span>Data available from:</span>
                  <span>{dataDateRange.earliest.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>to:</span>
                  <span>{dataDateRange.latest.toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Range Display */}
      {hasActiveRange && !isExpanded && (
        <div className="text-sm text-muted-foreground">
          <span>Showing: </span>
          {startDate && (
            <span>
              from {new Date(startDate + 'T00:00:00').toLocaleDateString()}
            </span>
          )}
          {startDate && endDate && <span> </span>}
          {endDate && (
            <span>
              to {new Date(endDate + 'T00:00:00').toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export { DateRangeFilter };