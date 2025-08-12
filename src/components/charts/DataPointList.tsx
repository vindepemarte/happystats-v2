// Data point list component with edit/delete functionality

"use client";

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Modal, ModalFooter } from '../ui/Modal';
import { LoadingInline } from '../ui/LoadingSpinner';
import { DataPointForm, DataPointFormData } from './DataPointForm';
import { formatDate, formatNumber } from '../../lib/utils';
import { DataPoint } from '../../types/chart';

import { cn } from '../../lib/utils';

interface DataPointListProps {
  dataPoints: DataPoint[];
  chartId: string;
  isLoading?: boolean;
  onDataPointUpdated?: (dataPoint: DataPoint) => void;
  onDataPointDeleted?: (dataPointId: string) => void;
  showActions?: boolean;
  maxHeight?: string;
}

const DataPointList: React.FC<DataPointListProps> = ({
  dataPoints,
  chartId,
  isLoading = false,
  onDataPointUpdated,
  onDataPointDeleted,
  showActions = true,
  maxHeight = 'max-h-96',
}) => {
  const [editingDataPoint, setEditingDataPoint] = useState<DataPoint | null>(null);
  const [deletingDataPoint, setDeletingDataPoint] = useState<DataPoint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (dataPoint: DataPoint) => {
    setEditingDataPoint(dataPoint);
  };

  const handleEditSubmit = async (formData: DataPointFormData) => {
    if (!editingDataPoint) return;

    const response = await fetch(`/api/data-points/${editingDataPoint.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        measurement: formData.measurement,
        date: formData.date.toISOString(),
        name: formData.name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update data point');
    }

    const { dataPoint } = await response.json();
    
    if (onDataPointUpdated) {
      onDataPointUpdated(dataPoint);
    }
    
    setEditingDataPoint(null);
  };

  const handleDelete = (dataPoint: DataPoint) => {
    setDeletingDataPoint(dataPoint);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDataPoint) return;

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/data-points/${deletingDataPoint.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete data point');
      }

      if (onDataPointDeleted) {
        onDataPointDeleted(deletingDataPoint.id);
      }
      
      setDeletingDataPoint(null);
    } catch (error) {
      console.error('Delete error:', error);
      // Handle error (could show toast notification)
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingDataPoint(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingInline message="Loading data points..." />
        </CardContent>
      </Card>
    );
  }

  if (dataPoints.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No data points yet</h3>
            <p className="text-muted-foreground">
              Add your first data point to start tracking
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort data points by date (newest first)
  const sortedDataPoints = [...dataPoints].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Data Points ({dataPoints.length})</span>
            {dataPoints.length > 0 && (
              <div className="text-sm font-normal text-muted-foreground">
                Latest: {formatDate(new Date(sortedDataPoints[0].date))}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('overflow-y-auto', maxHeight)}>
            <div className="space-y-2">
              {sortedDataPoints.map((dataPoint, index) => (
                <DataPointItem
                  key={dataPoint.id}
                  dataPoint={dataPoint}
                  onEdit={() => handleEdit(dataPoint)}
                  onDelete={() => handleDelete(dataPoint)}
                  showActions={showActions}
                  isLatest={index === 0}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Data Point Modal */}
      <DataPointForm
        isOpen={!!editingDataPoint}
        onClose={() => setEditingDataPoint(null)}
        onSubmit={handleEditSubmit}
        initialData={editingDataPoint}
        chartId={chartId}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingDataPoint}
        onClose={handleCancelDelete}
        title="Delete Data Point"
        description="Are you sure you want to delete this data point? This action cannot be undone."
      >
        {deletingDataPoint && (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Measurement</div>
                  <div className="font-medium">{formatNumber(deletingDataPoint.measurement)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Date</div>
                  <div className="font-medium">{formatDate(deletingDataPoint.date)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground">Name</div>
                  <div className="font-medium">{deletingDataPoint.name}</div>
                </div>
              </div>
            </div>
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
            Delete Data Point
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

// Individual data point item component
interface DataPointItemProps {
  dataPoint: DataPoint;
  onEdit: () => void;
  onDelete: () => void;
  showActions: boolean;
  isLatest: boolean;
}

const DataPointItem: React.FC<DataPointItemProps> = ({
  dataPoint,
  onEdit,
  onDelete,
  showActions,
  isLatest,
}) => {
  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg border transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      isLatest && 'border-primary bg-primary/5'
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">
            {formatNumber(dataPoint.measurement)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDate(dataPoint.date)}
          </div>
          {isLatest && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary text-primary-foreground">
              Latest
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {dataPoint.name}
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-1 ml-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onEdit}
            title="Edit data point"
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
            title="Delete data point"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
};

export { DataPointList };