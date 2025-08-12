// Chart settings modal for editing chart metadata

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { ErrorMessage } from '../ui/ErrorBoundary';
import { Chart } from '../../types/chart';
import { formatDate } from '../../lib/utils';

import { z } from 'zod';

interface ChartSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chart: Chart;
  onChartUpdated: (updatedChart: Chart) => void;
}

const chartSettingsSchema = z.object({
  name: z.string().min(1, 'Chart name is required').max(255, 'Chart name too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long'),
});

const ChartSettingsModal: React.FC<ChartSettingsModalProps> = ({
  isOpen,
  onClose,
  chart,
  onChartUpdated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
  });

  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when modal opens/closes or chart changes
  useEffect(() => {
    if (isOpen && chart) {
      setFormData({
        name: chart.name,
        category: chart.category,
      });
      setErrors({});
      setHasChanges(false);
    }
  }, [isOpen, chart]);

  // Check for changes
  useEffect(() => {
    if (chart) {
      const hasNameChange = formData.name !== chart.name;
      const hasCategoryChange = formData.category !== chart.category;
      setHasChanges(hasNameChange || hasCategoryChange);
    }
  }, [formData, chart]);

  const validateForm = () => {
    const result = chartSettingsSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));

    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Clear general error
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/api/charts/${chart.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update chart');
      }

      const { chart: updatedChart } = await response.json();
      onChartUpdated(updatedChart);
      onClose();

    } catch (error) {
      console.error('Chart update error:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to update chart settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleReset = () => {
    if (chart) {
      setFormData({
        name: chart.name,
        category: chart.category,
      });
      setErrors({});
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Chart Settings"
      description="Update your chart name and category"
    >
      {errors.general && (
        <div className="mb-6">
          <ErrorMessage
            title="Update Failed"
            message={errors.general}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Chart Name"
          type="text"
          value={formData.name}
          onChange={handleInputChange('name')}
          error={errors.name}
          placeholder="e.g., Daily Weight, Weekly Revenue"
          autoFocus
          leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        <Input
          label="Category"
          type="text"
          value={formData.category}
          onChange={handleInputChange('category')}
          error={errors.category}
          placeholder="e.g., Health, Finance, Fitness"
          helperText="Used to organize and filter your charts"
          leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />

        {/* Chart Statistics (read-only) */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium text-foreground">Chart Statistics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Data Points</div>
              <div className="font-medium">{chart.dataPoints.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Created</div>
              <div className="font-medium">
                {formatDate(chart.createdAt)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Last Updated</div>
              <div className="font-medium">
                {formatDate(chart.updatedAt)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Chart ID</div>
              <div className="font-mono text-xs text-muted-foreground truncate">
                {chart.id}
              </div>
            </div>
          </div>
        </div>
      </form>

      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <Button 
            variant="ghost" 
            onClick={handleReset} 
            disabled={isLoading || !hasChanges}
            className="text-sm"
          >
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isLoading}
              disabled={isLoading || !hasChanges}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export { ChartSettingsModal };