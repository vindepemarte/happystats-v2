/**
 * Global Error Provider
 * Provides centralized error handling and user feedback
 */

"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppError, handleError } from '../../lib/error-handler';
import { ErrorToast } from '../ui/ErrorComponents';

interface ErrorContextType {
  showError: (error: unknown, context?: string) => void;
  clearError: () => void;
  currentError: AppError | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const showError = useCallback((error: unknown, context?: string) => {
    const appError = handleError(error, context);
    setCurrentError(appError);
    setToastVisible(true);

    // Auto-dismiss toast after 5 seconds
    setTimeout(() => {
      setToastVisible(false);
    }, 5000);
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
    setToastVisible(false);
  }, []);

  const contextValue: ErrorContextType = {
    showError,
    clearError,
    currentError,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      {toastVisible && currentError && (
        <ErrorToast
          error={currentError}
          onDismiss={clearError}
        />
      )}
    </ErrorContext.Provider>
  );
}

/**
 * Hook to use error context
 */
export function useError(): ErrorContextType {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

/**
 * Higher-order component to wrap components with error handling
 */
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function ErrorHandledComponent(props: P) {
    const { showError } = useError();

    // Add error handling to component props if they exist
    const enhancedProps = {
      ...props,
      onError: (error: unknown, context?: string) => {
        showError(error, context);
      },
    } as P;

    return <Component {...enhancedProps} />;
  };
}