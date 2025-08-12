// Data point form component with mobile-friendly inputs

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { ErrorMessage } from '../ui/ErrorBoundary';
import { formatDateForInput, parseDateFromInput } from '../../lib/utils';
import { DataPoint } from '../../types/chart';

import { z } from 'zod';

interface DataPointFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dataPoint: DataPointFormData) => Promise<void>;
  initialData?: DataPoint | null;
  chartId: string;
  title?: string;
}

export interface DataPointFormData {
  measurement: number;
  date: Date;
  name: string;
}

const dataPointSchema = z.object({
  measurement: z.number().finite('Measurement must be a valid number'),
  date: z.date(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
});

const DataPointForm: React.FC<DataPointFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  chartId,
  title,
}) => {
  const isEditing = !!initialData;
  const modalTitle = title || (isEditing ? 'Edit Data Point' : 'Add Data Point');

  const [formData, setFormData] = useState({
    measurement: '',
    date: formatDateForInput(new Date()),
    name: '',
  });

  const [errors, setErrors] = useState<{
    measurement?: string;
    date?: string;
    name?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes or initial data changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          measurement: initialData.measurement.toString(),
          date: formatDateForInput(initialData.date),
          name: initialData.name,
        });
      } else {
        setFormData({
          measurement: '',
          date: formatDateForInput(new Date()),
          name: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validateForm = (): DataPointFormData | null => {
    const measurementNum = parseFloat(formData.measurement);
    const dateObj = parseDateFromInput(formData.date);

    const result = dataPointSchema.safeParse({
      measurement: measurementNum,
      date: dateObj,
      name: formData.name.trim(),
    });

    if (!result.success) {
      const newErrors: any = {};
      result.error.issues.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0]] = error.message;
        }
      });

      // Custom validation for measurement input
      if (isNaN(measurementNum)) {
        newErrors.measurement = 'Please enter a valid number';
      }

      setErrors(newErrors);
      return null;
    }

    setErrors({});
    return result.data;
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

    const validatedData = validateForm();
    if (!validatedData) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await onSubmit(validatedData);
      onClose();
    } catch (error) {
      console.error('Data point form error:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to save data point',
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      description={isEditing ? 'Update your data point' : 'Add a new data point to your chart'}
    >
      {errors.general && (
        <div className="mb-6">
          <ErrorMessage
            title="Save Failed"
            message={errors.general}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Measurement"
          type="number"
          step="any"
          value={formData.measurement}
          onChange={handleInputChange('measurement')}
          error={errors.measurement}
          placeholder="e.g., 75.5, 1200, 8.5"
          autoFocus={!isEditing}
          leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
          }
        />

        <Input
          label="Date"
          type="date"
          value={formData.date}
          onChange={handleInputChange('date')}
          error={errors.date}
          max={formatDateForInput(new Date())} // Don't allow future dates
          leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <Input
          label="Name / Description"
          type="text"
          value={formData.name}
          onChange={handleInputChange('name')}
          error={errors.name}
          placeholder="e.g., Morning weight, Weekly revenue"
          helperText="Brief description of this data point"
          leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
      </form>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
        >
          {isEditing ? 'Update' : 'Add'} Data Point
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// Quick add data point component for inline use
interface QuickAddDataPointProps {
  chartId: string;
  onDataPointAdded: (dataPoint: DataPoint) => void;
  className?: string;
}

const QuickAddDataPoint: React.FC<QuickAddDataPointProps> = ({
  chartId,
  onDataPointAdded,
  className,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = async (formData: DataPointFormData) => {
    const response = await fetch(`/api/charts/${chartId}/data-points`, {
      method: 'POST',
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
      throw new Error(errorData.error || 'Failed to add data point');
    }

    const { dataPoint } = await response.json();
    onDataPointAdded(dataPoint);
  };

  return (
    <>
      <Button
        onClick={() => setIsFormOpen(true)}
        className={className}
      >
        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Data Point
      </Button>

      <DataPointForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        chartId={chartId}
      />
    </>
  );
};

export { DataPointForm, QuickAddDataPoint };