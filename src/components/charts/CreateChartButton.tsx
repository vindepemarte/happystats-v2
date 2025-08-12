// Create chart button with subscription limit checking

"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { UpgradePrompt } from '../subscription/UpgradePrompt';
import { ErrorMessage } from '../ui/ErrorBoundary';

import { z } from 'zod';

interface CreateChartButtonProps {
  onChartCreated?: (chart: any) => void;
  disabled?: boolean;
  className?: string;
}

const createChartSchema = z.object({
  name: z.string().min(1, 'Chart name is required').max(255, 'Chart name too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long'),
});

const CreateChartButton: React.FC<CreateChartButtonProps> = ({
  onChartCreated,
  disabled = false,
  className,
}) => {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    category?: string;
  }>({});

  // Common categories for suggestions
  const commonCategories = [
    'Health & Fitness',
    'Finance',
    'Productivity',
    'Habits',
    'Business',
    'Personal',
    'Sports',
    'Learning',
  ];

  const resetForm = () => {
    setFormData({ name: '', category: '' });
    setFormErrors({});
    setError(null);
  };

  const handleOpenModal = () => {
    if (!session) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login';
      return;
    }

    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const result = createChartSchema.safeParse(formData);

    if (!result.success) {
      const errors: any = {};
      result.error.issues.forEach((error) => {
        if (error.path[0]) {
          errors[error.path[0]] = error.message;
        }
      });
      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleInputChange = (field: 'name' | 'category') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));

    // Clear field-specific error
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Clear general error
    if (error) {
      setError(null);
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category,
    }));

    if (formErrors.category) {
      setFormErrors(prev => ({
        ...prev,
        category: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/charts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.upgradeRequired) {
          // User hit chart limit
          setLimitInfo({
            currentCount: data.currentCount,
            limit: data.limit,
          });
          setIsModalOpen(false);
          setIsUpgradeModalOpen(true);
          return;
        }

        if (data.details) {
          // Handle validation errors from server
          const serverErrors: any = {};
          data.details.forEach((error: any) => {
            if (error.path[0]) {
              serverErrors[error.path[0]] = error.message;
            }
          });
          setFormErrors(serverErrors);
        } else {
          setError(data.error || 'Failed to create chart');
        }
        return;
      }

      // Success
      setIsModalOpen(false);
      resetForm();

      if (onChartCreated) {
        onChartCreated(data.chart);
      }

    } catch (error) {
      console.error('Chart creation error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        disabled={disabled}
        className={className}
      >
        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Chart
      </Button>

      {/* Create Chart Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create New Chart"
        description="Start tracking your data with a new chart"
      >
        {error && (
          <div className="mb-6">
            <ErrorMessage
              title="Creation Failed"
              message={error}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Chart Name"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={formErrors.name}
            placeholder="e.g., Daily Weight, Monthly Revenue"
            autoFocus
          />

          <div className="space-y-2">
            <Input
              label="Category"
              value={formData.category}
              onChange={handleInputChange('category')}
              error={formErrors.category}
              placeholder="e.g., Health & Fitness, Finance"
            />

            {/* Category suggestions */}
            <div className="flex flex-wrap gap-2">
              {commonCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </form>

        <ModalFooter>
          <Button variant="outline" onClick={handleCloseModal} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
          >
            Create Chart
          </Button>
        </ModalFooter>
      </Modal>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Chart Limit Reached"
        message="You've reached the maximum number of charts for your current plan. Upgrade to create unlimited charts."
        currentCount={limitInfo?.currentCount}
        limit={limitInfo?.limit}
        feature="charts"
      />
    </>
  );
};

export { CreateChartButton };