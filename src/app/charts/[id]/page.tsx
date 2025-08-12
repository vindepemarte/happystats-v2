// Full-view chart page with detailed data display and editing interface

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { LoadingPage } from '../../../components/ui/LoadingSpinner';
import { ChartView } from '../../../components/charts/ChartView';
import { DataPointList } from '../../../components/charts/DataPointList';
import { QuickAddDataPoint } from '../../../components/charts/DataPointForm';
import { ChartSettingsModal } from '../../../components/charts/ChartSettingsModal';
import { DateRangeFilter, DateRange } from '../../../components/charts/DateRangeFilter';
import { Chart, DataPoint } from '../../../types/chart';
import { filterDataPointsByDateRange, getDataPointDateRange } from '../../../lib/utils';

interface ChartDetailPageProps {
  params: Promise<{ id: string }>;
}

const ChartDetailPage: React.FC<ChartDetailPageProps> = ({ params }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chartId, setChartId] = useState<string | null>(null);

  const [chart, setChart] = useState<Chart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  // Resolve params Promise
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setChartId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }
  }, [session, status, router]);

  // Load chart data
  const loadChart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/charts/${chartId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Chart not found');
          return;
        }
        if (response.status === 403) {
          setError('Access denied');
          return;
        }
        throw new Error('Failed to load chart');
      }

      const data = await response.json();
      setChart(data.chart);

    } catch (error) {
      console.error('Chart loading error:', error);
      setError('Failed to load chart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [chartId]);

  // Initial data load
  useEffect(() => {
    if (session && chartId) {
      loadChart();
    }
  }, [session, chartId, loadChart]);

  // Handle data point added
  const handleDataPointAdded = (newDataPoint: DataPoint) => {
    if (!chart) return;

    setChart(prev => prev ? {
      ...prev,
      dataPoints: [...prev.dataPoints, newDataPoint],
      updatedAt: new Date(),
    } : null);
  };

  // Handle data point updated
  const handleDataPointUpdated = (updatedDataPoint: DataPoint) => {
    if (!chart) return;

    setChart(prev => prev ? {
      ...prev,
      dataPoints: prev.dataPoints.map(dp => 
        dp.id === updatedDataPoint.id ? updatedDataPoint : dp
      ),
      updatedAt: new Date(),
    } : null);
  };

  // Handle data point deleted
  const handleDataPointDeleted = (dataPointId: string) => {
    if (!chart) return;

    setChart(prev => prev ? {
      ...prev,
      dataPoints: prev.dataPoints.filter(dp => dp.id !== dataPointId),
      updatedAt: new Date(),
    } : null);
  };

  // Handle chart settings updated
  const handleChartUpdated = (updatedChart: Chart) => {
    setChart(updatedChart);
  };

  // Handle date range change
  const handleDateRangeChange = (newDateRange: DateRange | null) => {
    setDateRange(newDateRange);
  };

  // Get filtered data points based on date range
  const filteredDataPoints = chart ? filterDataPointsByDateRange(chart.dataPoints, dateRange) : [];
  
  // Get data date range for the filter component
  const dataDateRange = chart ? getDataPointDateRange(chart.dataPoints) : null;

  // Show loading state
  if (status === 'loading' || isLoading || !chartId) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingPage message="Loading chart..." />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Chart Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
                <Button onClick={loadChart}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!chart) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with navigation and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground truncate">{chart.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                {chart.category}
              </span>
              <span>•</span>
              <span>{chart.dataPoints.length} data point{chart.dataPoints.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Button>
          <QuickAddDataPoint
            chartId={chart.id}
            onDataPointAdded={handleDataPointAdded}
          />
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-4">
        <DateRangeFilter
          onDateRangeChange={handleDateRangeChange}
          dataDateRange={dataDateRange || undefined}
          isActive={dateRange !== null}
        />
      </div>

      {/* Full-size chart visualization */}
      <div className="space-y-4">
        <ChartView
          dataPoints={filteredDataPoints}
          chartName={chart.name}
          showTrendLine={true}
          height={400}
          className="w-full"
          fullScreen={true}
          isFiltered={dateRange !== null}
          emptyStateMessage={
            dateRange !== null 
              ? "No data points found in the selected date range. Try adjusting the date range or clearing the filter."
              : undefined
          }
        />
      </div>

      {/* Data point management */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 order-2 xl:order-1">
          <DataPointList
            dataPoints={filteredDataPoints}
            chartId={chart.id}
            onDataPointUpdated={handleDataPointUpdated}
            onDataPointDeleted={handleDataPointDeleted}
            showActions={true}
            maxHeight="max-h-[600px]"
          />
          {dateRange !== null && filteredDataPoints.length === 0 && chart.dataPoints.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No data points in the selected date range.</p>
              <p className="text-sm mt-1">
                Showing 0 of {chart.dataPoints.length} total data points.
              </p>
            </div>
          )}
        </div>

        {/* Chart metadata and quick stats */}
        <div className="space-y-4 order-1 xl:order-2">
          {/* Quick stats - show first on mobile */}
          {filteredDataPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Quick Stats
                  {dateRange !== null && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (filtered)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const measurements = filteredDataPoints
                    .map(dp => dp.measurement)
                    .filter(m => typeof m === 'number' && !isNaN(m));
                  
                  if (measurements.length === 0) {
                    return (
                      <div className="text-center text-muted-foreground">
                        No valid measurements available
                      </div>
                    );
                  }

                  const latest = measurements[measurements.length - 1];
                  const average = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
                  const min = Math.min(...measurements);
                  const max = Math.max(...measurements);

                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Latest Value</span>
                        <span className="font-medium">{latest?.toFixed(2) ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average</span>
                        <span className="font-medium">{average?.toFixed(2) ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Minimum</span>
                        <span className="font-medium">{min?.toFixed(2) ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Maximum</span>
                        <span className="font-medium">{max?.toFixed(2) ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Range</span>
                        <span className="font-medium">{(max - min)?.toFixed(2) ?? '—'}</span>
                      </div>
                      {dateRange !== null && (
                        <div className="pt-2 border-t text-xs text-muted-foreground">
                          Showing {filteredDataPoints.length} of {chart.dataPoints.length} data points
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Chart Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{chart.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Category</div>
                <div className="font-medium">{chart.category}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {new Date(chart.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="font-medium">
                  {new Date(chart.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chart Settings Modal */}
      <ChartSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        chart={chart}
        onChartUpdated={handleChartUpdated}
      />
    </div>
  );
};

export default ChartDetailPage;