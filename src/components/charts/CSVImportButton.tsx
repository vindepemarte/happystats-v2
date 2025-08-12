// CSV Import Button Component

"use client";

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import CSVImportModal from './CSVImportModal';
import { Chart } from '../../types/chart';

interface CSVImportButtonProps {
  onImportSuccess: (chart: Chart) => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CSVImportButton: React.FC<CSVImportButtonProps> = ({
  onImportSuccess,
  variant = 'outline',
  size = 'md',
  className
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImportSuccess = (chart: Chart) => {
    onImportSuccess(chart);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Import CSV
      </Button>

      <CSVImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </>
  );
};

export default CSVImportButton;