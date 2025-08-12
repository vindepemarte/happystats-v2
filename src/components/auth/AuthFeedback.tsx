// Authentication feedback component

import React from 'react';
import { cn } from '../../lib/utils';

interface AuthFeedbackProps {
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const AuthFeedback: React.FC<AuthFeedbackProps> = ({
  type,
  title,
  message,
  action,
  className,
}) => {
  const baseClasses = 'p-4 rounded-lg border flex items-start space-x-3';
  
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  };

  const icons = {
    success: (
      <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div className={cn(baseClasses, typeClasses[type], className)}>
      <div className={iconClasses[type]}>
        {icons[type]}
      </div>
      <div className="flex-1">
        {title && (
          <h3 className="text-sm font-medium mb-1">{title}</h3>
        )}
        <p className="text-sm">{message}</p>
        {action && (
          <div className="mt-3">
            <button
              onClick={action.onClick}
              className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { AuthFeedback };