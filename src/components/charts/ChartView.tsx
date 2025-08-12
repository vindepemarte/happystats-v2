// Chart visualization component with trending lines

"use client";

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { DataPoint } from '../../types/chart';
import { formatDate, formatNumber, calculateTrendLine } from '../../lib/utils';

interface ChartViewProps {
  dataPoints: DataPoint[];
  chartName: string;
  showTrendLine?: boolean;
  height?: number;
  className?: string;
  fullScreen?: boolean;
  isFiltered?: boolean;
  emptyStateMessage?: string;
}

interface ChartDataPoint {
  index: number;
  date: string;
  dateFormatted: string;
  measurement: number;
  name: string;
  trendValue?: number;
}

const ChartView: React.FC<ChartViewProps> = ({
  dataPoints,
  chartName,
  showTrendLine = true,
  height = 300,
  className = '',
  fullScreen = false,
  isFiltered = false,
  emptyStateMessage,
}) => {


  // Prepare chart data and calculate trend
  const { chartData, trendCalculation, stats } = useMemo(() => {
    if (dataPoints.length === 0) {
      return {
        chartData: [],
        trendCalculation: { slope: 0, intercept: 0, rSquared: 0 },
        stats: null,
      };
    }

    // Sort data points by date (with safe date handling)
    const sortedDataPoints = [...dataPoints].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      
      // Handle invalid dates by putting them at the end
      const timeA = isNaN(dateA.getTime()) ? Date.now() : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? Date.now() : dateB.getTime();
      
      return timeA - timeB;
    });

    // Calculate trend
    const trend = calculateTrendLine(sortedDataPoints);

    // Prepare chart data
    const chartData: ChartDataPoint[] = sortedDataPoints.map((point, index) => {
      // Ensure we have a valid Date object
      const dateObj = point.date instanceof Date ? point.date : new Date(point.date);
      const isValidDate = !isNaN(dateObj.getTime());
      
      return {
        index,
        date: isValidDate ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        dateFormatted: formatDate(isValidDate ? dateObj : new Date()),
        measurement: point.measurement,
        name: point.name,
        trendValue: showTrendLine && isFinite(trend.slope) && isFinite(trend.intercept) 
          ? trend.slope * index + trend.intercept 
          : undefined,
      };
    });

    // Calculate basic statistics
    const measurements = sortedDataPoints
      .map(dp => dp.measurement)
      .filter(m => typeof m === 'number' && !isNaN(m) && isFinite(m));
    
    const stats = measurements.length > 0 ? {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      average: measurements.reduce((sum, val) => sum + val, 0) / measurements.length,
      latest: measurements[measurements.length - 1],
      earliest: measurements[0],
    } : {
      count: 0,
      min: 0,
      max: 0,
      average: 0,
      latest: 0,
      earliest: 0,
    };

    return { chartData, trendCalculation: trend, stats };
  }, [dataPoints, showTrendLine]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-card-foreground mb-1">
            {data.name}
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            {data.dateFormatted}
          </p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Value:</span>{' '}
              <span className="font-medium text-chart-1">
                {formatNumber(data.measurement)}
              </span>
            </p>
            {showTrendLine && data.trendValue !== undefined && (
              <p className="text-sm">
                <span className="text-muted-foreground">Trend:</span>{' '}
                <span className="font-medium text-chart-2">
                  {formatNumber(data.trendValue)}
                </span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Format X-axis labels for mobile and full-screen mode
  const formatXAxisLabel = (tickItem: string, index: number) => {
    const totalTicks = chartData.length;
    
    // Full-screen mode: show more labels
    if (fullScreen) {
      if (totalTicks <= 15) return new Date(tickItem).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (index % Math.ceil(totalTicks / 8) === 0) {
        return new Date(tickItem).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return '';
    }
    
    // On mobile (< 768px), show fewer labels
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (totalTicks <= 5) return new Date(tickItem).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (index % Math.ceil(totalTicks / 3) === 0) {
        return new Date(tickItem).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return '';
    }
    
    // Desktop: show more labels
    if (totalTicks <= 10) return new Date(tickItem).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (index % Math.ceil(totalTicks / 6) === 0) {
      return new Date(tickItem).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return '';
  };

  if (dataPoints.length === 0) {
    const defaultMessage = isFiltered 
      ? "No data points found in the selected date range"
      : "Add some data points to see your chart";
    
    const displayMessage = emptyStateMessage || defaultMessage;
    
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                {isFiltered ? (
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {isFiltered ? "No data in range" : "No data to display"}
              </h3>
              <p className="text-muted-foreground">
                {displayMessage}
              </p>
              {isFiltered && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your date range or clearing the filter
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{chartName}</span>
          {stats && (
            <div className="text-sm font-normal text-muted-foreground">
              {stats.count} point{stats.count !== 1 ? 's' : ''}
              {isFiltered && (
                <span className="ml-1 text-xs bg-muted px-2 py-0.5 rounded">
                  filtered
                </span>
              )}
            </div>
          )}
        </CardTitle>
        
        {/* Chart statistics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Latest</div>
              <div className="font-medium text-chart-1">{formatNumber(stats.latest)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Average</div>
              <div className="font-medium">{formatNumber(stats.average)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Min</div>
              <div className="font-medium">{formatNumber(stats.min)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max</div>
              <div className="font-medium">{formatNumber(stats.max)}</div>
            </div>
          </div>
        )}
        
        {/* Trend information */}
        {showTrendLine && trendCalculation.rSquared > 0 && (
          <div className="text-sm text-muted-foreground">
            Trend: {trendCalculation.slope > 0 ? '↗' : trendCalculation.slope < 0 ? '↘' : '→'}{' '}
            {trendCalculation.slope > 0 ? 'Increasing' : trendCalculation.slope < 0 ? 'Decreasing' : 'Stable'}{' '}
            (R² = {trendCalculation.rSquared.toFixed(3)})
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisLabel}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Main data line */}
              <Line
                type="monotone"
                dataKey="measurement"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{
                  fill: "hsl(var(--chart-1))",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  stroke: "hsl(var(--chart-1))",
                  strokeWidth: 2,
                  fill: "hsl(var(--background))",
                }}
              />
              
              {/* Trend line */}
              {showTrendLine && trendCalculation.rSquared > 0.1 && (
                <Line
                  type="monotone"
                  dataKey="trendValue"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export { ChartView };