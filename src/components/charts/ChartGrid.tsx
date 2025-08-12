// Chart grid component for dashboard display

"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal, ModalFooter } from '../ui/Modal';

import { MiniChartView } from './MiniChartView';
import { formatDate } from '../../lib/utils';
import { Chart } from '../../types/chart';

interface ChartGridProps {
  charts: Chart[];
  isLoading?: boolean;
  onDeleteChart?: (chartId: string) => void;
  onEditChart?: (chart: Chart) => void;
}

const ChartGrid: React.FC<ChartGridProps> = ({
  charts,
  isLoading = false,
  onDeleteChart,
  onEditChart,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chartToDelete, setChartToDelete] = useState<Chart | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (chart: Chart) => {
    setChartToDelete(chart);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!chartToDelete || !onDeleteChart) return;

    setIsDeleting(true);
    try {
      await onDeleteChart(chartToDelete.id);
      setDeleteModalOpen(false);
      setChartToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setChartToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
            <CardFooter>
              <div className="h-8 bg-muted rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No charts yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your first chart to start tracking your data
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {charts.map((chart) => (
          <ChartCard
            key={chart.id}
            chart={chart}
            onDelete={() => handleDeleteClick(chart)}
            onEdit={() => onEditChart?.(chart)}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        title="Delete Chart"
        description="Are you sure you want to delete this chart? This action cannot be undone."
      >
        {chartToDelete && (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium">{chartToDelete.name}</h4>
              <p className="text-sm text-muted-foreground">
                Category: {chartToDelete.category}
              </p>
              <p className="text-sm text-muted-foreground">
                Data points: {chartToDelete.dataPoints?.length || 0}
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              All data points associated with this chart will also be permanently deleted.
            </p>
          </div>
        )}

        <ModalFooter>
          <Button variant="outline" onClick={handleCancelDelete} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirmDelete}
            loading={isDeleting}
            disabled={isDeleting}
          >
            Delete Chart
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

// Individual chart card component
interface ChartCardProps {
  chart: Chart;
  onDelete: () => void;
  onEdit: () => void;
}

const ChartCard: React.FC<ChartCardProps> = ({ chart, onDelete, onEdit }) => {
  const dataPointCount = chart.dataPoints?.length || 0;
  const hasData = dataPointCount > 0;
  
  // Calculate basic stats if there's data
  const stats = useMemo(() => {
    if (!hasData || !chart.dataPoints || chart.dataPoints.length === 0) {
      return null;
    }
    
    try {
      const validDataPoints = chart.dataPoints.filter(dp => dp && typeof dp.measurement === 'number');
      if (validDataPoints.length === 0) return null;
      
      return {
        latest: validDataPoints[validDataPoints.length - 1]?.measurement,
        earliest: validDataPoints[0]?.measurement,
        average: validDataPoints.reduce((sum, dp) => sum + dp.measurement, 0) / validDataPoints.length,
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return null;
    }
  }, [hasData, chart.dataPoints]);

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{chart.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                {chart.category}
              </span>
              <span className="text-xs">
                {dataPointCount} data point{dataPointCount !== 1 ? 's' : ''}
              </span>
            </CardDescription>
          </div>
          
          {/* Quick actions menu */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onEdit}
                title="Edit chart"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={onDelete}
                title="Delete chart"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            {/* Mini chart visualization */}
            <div className="h-16">
              <MiniChartView
                dataPoints={chart.dataPoints || []}
                showTrendLine={true}
                height={64}
              />
            </div>
            
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Latest</div>
                <div className="text-sm font-medium">
                  {stats?.latest !== undefined ? stats.latest.toFixed(1) : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Average</div>
                <div className="text-sm font-medium">
                  {stats?.average !== undefined ? stats.average.toFixed(1) : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">First</div>
                <div className="text-sm font-medium">
                  {stats?.earliest !== undefined ? stats.earliest.toFixed(1) : '—'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-16 bg-muted rounded flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">No data yet</div>
              <div className="text-xs text-muted-foreground">Add your first data point</div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Link href={`/charts/${chart.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            {hasData ? 'View Chart' : 'Add Data'}
          </Button>
        </Link>
        
        <div className="text-xs text-muted-foreground text-center">
          Created {(() => {
            try {
              if (!chart.createdAt) {
                return 'Unknown date';
              }
              
              return formatDate(chart.createdAt);
            } catch (error) {
              console.error('Error formatting date:', error, 'Chart createdAt:', chart.createdAt);
              return 'Unknown date';
            }
          })()}
        </div>
      </CardFooter>
    </Card>
  );
};

export { ChartGrid };