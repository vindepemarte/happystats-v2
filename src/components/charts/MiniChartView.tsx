// Mini chart visualization for dashboard cards

"use client";

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { DataPoint } from '../../types/chart';
import { calculateTrendLine } from '../../lib/utils';

interface MiniChartViewProps {
  dataPoints: DataPoint[];
  showTrendLine?: boolean;
  height?: number;
}



const MiniChartView: React.FC<MiniChartViewProps> = ({
  dataPoints,
  showTrendLine = true,
  height = 80,
}) => {


  // Prepare chart data and calculate trend
  const chartData = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) {
      return [];
    }

    try {
      // Filter out invalid data points
      const validDataPoints = dataPoints.filter(point => 
        point && 
        typeof point.measurement === 'number' && 
        !isNaN(point.measurement) &&
        point.date
      );

      if (validDataPoints.length === 0) {
        return [];
      }

      // Sort data points by date
      const sortedDataPoints = [...validDataPoints].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      // Calculate trend if needed
      const trend = showTrendLine && sortedDataPoints.length > 1 ? calculateTrendLine(sortedDataPoints) : null;

      // Prepare chart data
      return sortedDataPoints.map((point, index) => ({
        index,
        measurement: point.measurement,
        trendValue: trend && isFinite(trend.slope) && isFinite(trend.intercept) 
          ? trend.slope * index + trend.intercept 
          : undefined,
      }));
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return [];
    }
  }, [dataPoints, showTrendLine]);

  if (dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded">
        <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 5,
          }}
        >
          {/* Main data line */}
          <Line
            type="monotone"
            dataKey="measurement"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
          
          {/* Trend line */}
          {showTrendLine && chartData.length > 1 && (
            <Line
              type="monotone"
              dataKey="trendValue"
              stroke="hsl(var(--chart-2))"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export { MiniChartView };