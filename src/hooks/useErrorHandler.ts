/**
 * Error Handler Hook
 * Provides centralized error handling with user feedback
 */

"use client";

import { useState, useCallback } from 'react';
import { AppError, handleError, requiresAuth, requiresUpgrade } from '../lib/error-handler';
import { useRouter } from 'next/navigation';

export interface ErrorState {
  error: AppError | null;
  isLoading: boolean;
  hasError: boolean;
}

export interface UseErrorHandlerReturn {
  error: AppError | null;
  isLoading: boolean;
  hasError: boolean;
  handleError: (error: unknown, context?: string) => AppError;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    context?: string,
    onSuccess?: (result: T) => void
  ) => Promise<T | null>;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [state, setState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    hasError: false,
  });
  
  const router = useRouter();

  const handleErrorCallback = useCallback((error: unknown, context?: string): AppError => {
    const appError = handleError(error, context);
    
    setState(prev => ({
      ...prev,
      error: appError,
      hasError: true,
      isLoading: false,
    }));

    // Handle specific error types
    if (requiresAuth(appError)) {
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } else if (requiresUpgrade(appError)) {
      // Could show upgrade modal or redirect
      console.log('Upgrade required:', appError.message);
    }

    return appError;
  }, [router]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      hasError: false,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string,
    onSuccess?: (result: T) => void
  ): Promise<T | null> => {
    try {
      setLoading(true);
      clearError();
      
      const result = await operation();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      handleErrorCallback(error, context);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleErrorCallback, setLoading, clearError]);

  return {
    error: state.error,
    isLoading: state.isLoading,
    hasError: state.hasError,
    handleError: handleErrorCallback,
    clearError,
    setLoading,
    executeWithErrorHandling,
  };
}

/**
 * Hook for handling API errors specifically
 */
export function useApiErrorHandler() {
  const errorHandler = useErrorHandler();

  const handleApiError = useCallback((response: Response, context?: string) => {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode = 'NETWORK_ERROR';

    switch (response.status) {
      case 400:
        errorCode = 'VALIDATION_ERROR';
        errorMessage = 'Invalid request data';
        break;
      case 401:
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Authentication required';
        break;
      case 403:
        errorCode = 'FORBIDDEN';
        errorMessage = 'Access denied';
        break;
      case 404:
        errorCode = 'NOT_FOUND';
        errorMessage = 'Resource not found';
        break;
      case 409:
        errorCode = 'ALREADY_EXISTS';
        errorMessage = 'Resource already exists';
        break;
      case 429:
        errorCode = 'RESOURCE_LIMIT_EXCEEDED';
        errorMessage = 'Too many requests';
        break;
      case 500:
        errorCode = 'INTERNAL_ERROR';
        errorMessage = 'Internal server error';
        break;
      case 503:
        errorCode = 'CONNECTION_ERROR';
        errorMessage = 'Service unavailable';
        break;
    }

    const appError: AppError = {
      code: errorCode,
      message: errorMessage,
      statusCode: response.status,
      timestamp: new Date().toISOString(),
      context,
    };

    return errorHandler.handleError(appError, context);
  }, [errorHandler]);

  return {
    ...errorHandler,
    handleApiError,
  };
}