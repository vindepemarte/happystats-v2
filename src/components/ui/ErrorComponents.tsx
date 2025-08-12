/**
 * Enhanced Error UI Components
 * Provides various error display components with actions
 */

"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { AppError, getUserFriendlyMessage, isRetryableError, requiresAuth, requiresUpgrade } from '../../lib/error-handler';

interface ErrorDisplayProps {
  error: AppError | Error | string;
  title?: string;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Main error display component with smart actions
 */
export function ErrorDisplay({ 
  error, 
  title, 
  showDetails = false, 
  onRetry, 
  onDismiss,
  className = '' 
}: ErrorDisplayProps) {
  const appError = typeof error === 'string' 
    ? { code: 'UNKNOWN_ERROR', message: error, timestamp: new Date().toISOString() } as AppError
    : error instanceof Error 
    ? { code: 'INTERNAL_ERROR', message: error.message, timestamp: new Date().toISOString() } as AppError
    : error;

  const message = getUserFriendlyMessage(appError);
  const canRetry = isRetryableError(appError);
  const needsAuth = requiresAuth(appError);
  const needsUpgrade = requiresUpgrade(appError);

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
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
          <CardTitle className="text-destructive">
            {title || 'Something went wrong'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {message}
          </p>
          
          {showDetails && process.env.NODE_ENV === 'development' && (
            <details className="text-xs bg-muted p-3 rounded-lg">
              <summary className="cursor-pointer font-medium mb-2">
                Error Details (Development)
              </summary>
              <pre className="whitespace-pre-wrap text-destructive">
                Code: {appError.code}
                {appError.details && `\nDetails: ${JSON.stringify(appError.details, null, 2)}`}
                {error instanceof Error && error.stack && `\nStack: ${error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col gap-3">
            {needsAuth && (
              <Link href="/auth/login">
                <Button className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
            
            {needsUpgrade && (
              <Link href="/subscription">
                <Button className="w-full">
                  Upgrade Subscription
                </Button>
              </Link>
            )}
            
            {canRetry && onRetry && (
              <Button onClick={onRetry} className="w-full">
                Try Again
              </Button>
            )}
            
            {onDismiss && (
              <Button variant="outline" onClick={onDismiss} className="w-full">
                Dismiss
              </Button>
            )}
            
            {!needsAuth && !needsUpgrade && (
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Page
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Inline error message component
 */
export function InlineError({ 
  error, 
  onRetry, 
  onDismiss,
  className = '' 
}: ErrorDisplayProps) {
  const message = typeof error === 'string' 
    ? error 
    : error instanceof Error 
    ? error.message 
    : getUserFriendlyMessage(error);

  return (
    <div className={`rounded-lg border border-destructive/20 bg-destructive/5 p-4 ${className}`}>
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
          <p className="text-sm text-destructive font-medium">Error</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  Try Again
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Toast-style error notification
 */
export function ErrorToast({ 
  error, 
  onDismiss,
  className = '' 
}: ErrorDisplayProps) {
  const message = typeof error === 'string' 
    ? error 
    : error instanceof Error 
    ? error.message 
    : getUserFriendlyMessage(error);

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      bg-destructive text-destructive-foreground
      rounded-lg shadow-lg p-4
      animate-in slide-in-from-top-2 duration-300
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <svg
            className="h-5 w-5 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm opacity-90">{message}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-4 text-destructive-foreground/70 hover:text-destructive-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state with error message
 */
export function ErrorEmptyState({ 
  error, 
  title = 'Something went wrong',
  onRetry,
  className = '' 
}: ErrorDisplayProps) {
  const message = typeof error === 'string' 
    ? error 
    : error instanceof Error 
    ? error.message 
    : getUserFriendlyMessage(error);

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="mx-auto h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <svg
          className="h-12 w-12 text-destructive"
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
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <Button onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Form field error component
 */
interface FieldErrorProps {
  error?: string;
  className?: string;
}

export function FieldError({ error, className = '' }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p className={`text-sm text-destructive mt-1 ${className}`}>
      {error}
    </p>
  );
}