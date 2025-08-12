// Enhanced Error boundary component for React error handling

"use client";

import React from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { handleError, AppError } from '../../lib/error-handler';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  appError?: AppError;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; appError?: AppError; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo, appError: AppError) => void;
  level?: 'page' | 'component' | 'section';
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const appError = handleError(error, 'React Error Boundary');
    
    return { 
      hasError: true, 
      error,
      appError,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = handleError(error, 'React Error Boundary');
    
    console.error('Error caught by boundary:', {
      error,
      errorInfo,
      appError,
      errorId: this.state.errorId,
      level: this.props.level || 'component',
    });
    
    this.setState({ error, errorInfo, appError });
    
    // Call custom error handler if provided
    if (this.props.onError && appError) {
      this.props.onError(error, errorInfo, appError);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      appError: undefined,
      errorId: undefined
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            appError={this.state.appError}
            retry={this.handleRetry} 
          />
        );
      }

      return (
        <DefaultErrorFallback 
          error={this.state.error!} 
          appError={this.state.appError}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          level={this.props.level}
          retry={this.handleRetry} 
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
interface ErrorFallbackProps {
  error: Error;
  appError?: AppError;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  level?: 'page' | 'component' | 'section';
  retry: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  appError, 
  errorInfo, 
  errorId,
  level = 'component',
  retry 
}) => {
  const minHeight = level === 'page' ? 'min-h-screen' : level === 'section' ? 'min-h-[300px]' : 'min-h-[200px]';
  const message = appError?.message || error.message || 'An unexpected error occurred';

  return (
    <div className={`flex items-center justify-center ${minHeight} p-4`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {message}
          </p>
          
          {errorId && (
            <p className="text-xs text-muted-foreground text-center">
              Error ID: {errorId}
            </p>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs bg-muted p-3 rounded-lg">
              <summary className="cursor-pointer font-medium mb-2">
                Error Details (Development)
              </summary>
              <pre className="whitespace-pre-wrap text-destructive">
                {appError ? `Code: ${appError.code}\n` : ''}
                Message: {error.message}
                {error.stack && `\n\nStack Trace:\n${error.stack}`}
                {errorInfo && `\n\nComponent Stack:\n${errorInfo.componentStack}`}
                {appError?.details && `\n\nDetails:\n${JSON.stringify(appError.details, null, 2)}`}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={retry} className="flex-1">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              {level === 'page' ? 'Reload Page' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Simple error message component
interface ErrorMessageProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title = 'Error', 
  message, 
  action 
}) => {
  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-destructive"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
              {action && (
                <div className="mt-3">
                  <Button size="sm" onClick={action.onClick}>
                    {action.label}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { ErrorBoundary, DefaultErrorFallback, ErrorMessage };