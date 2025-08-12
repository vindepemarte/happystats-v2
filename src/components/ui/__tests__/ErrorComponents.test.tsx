/**
 * Error Components Tests
 * Tests for error display components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { ErrorDisplay, InlineError, ErrorToast, FieldError } from '../ErrorComponents';
import { createAppError, ERROR_CODES } from '../../../lib/error-handler';

describe('Error Components', () => {
  describe('ErrorDisplay', () => {
    it('should render error message', () => {
      const error = createAppError(ERROR_CODES.VALIDATION_ERROR, 'Test error message');
      render(<ErrorDisplay error={error} />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show retry button for retryable errors', () => {
      const error = createAppError(ERROR_CODES.NETWORK_ERROR);
      const onRetry = vi.fn();
      
      render(<ErrorDisplay error={error} onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should show sign in button for auth errors', () => {
      const error = createAppError(ERROR_CODES.UNAUTHORIZED);
      render(<ErrorDisplay error={error} />);
      
      expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should show upgrade button for subscription errors', () => {
      const error = createAppError(ERROR_CODES.SUBSCRIPTION_REQUIRED);
      render(<ErrorDisplay error={error} />);
      
      expect(screen.getByRole('link', { name: 'Upgrade Subscription' })).toBeInTheDocument();
    });

    it('should show error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = createAppError(ERROR_CODES.VALIDATION_ERROR, 'Test error', { field: 'email' });
      render(<ErrorDisplay error={error} showDetails />);
      
      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle string errors', () => {
      render(<ErrorDisplay error="Simple error message" />);
      
      expect(screen.getByText('Simple error message')).toBeInTheDocument();
    });

    it('should handle JavaScript Error objects', () => {
      const jsError = new Error('JavaScript error');
      render(<ErrorDisplay error={jsError} />);
      
      expect(screen.getByText('JavaScript error')).toBeInTheDocument();
    });
  });

  describe('InlineError', () => {
    it('should render inline error message', () => {
      render(<InlineError error="Inline error message" />);
      
      expect(screen.getByText('Inline error message')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should show retry and dismiss buttons', () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();
      
      render(
        <InlineError 
          error="Test error" 
          onRetry={onRetry} 
          onDismiss={onDismiss} 
        />
      );
      
      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
      
      fireEvent.click(retryButton);
      fireEvent.click(dismissButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorToast', () => {
    it('should render toast error message', () => {
      render(<ErrorToast error="Toast error message" />);
      
      expect(screen.getByText('Toast error message')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should show dismiss button', () => {
      const onDismiss = vi.fn();
      render(<ErrorToast error="Test error" onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button');
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should have correct styling classes', () => {
      const { container } = render(<ErrorToast error="Test error" />);
      
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('fixed', 'top-4', 'right-4', 'z-50');
      expect(toast).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });
  });

  describe('FieldError', () => {
    it('should render field error message', () => {
      render(<FieldError error="Field is required" />);
      
      expect(screen.getByText('Field is required')).toBeInTheDocument();
    });

    it('should not render when no error', () => {
      const { container } = render(<FieldError />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should not render when error is empty string', () => {
      const { container } = render(<FieldError error="" />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should apply custom className', () => {
      render(<FieldError error="Test error" className="custom-class" />);
      
      const errorElement = screen.getByText('Test error');
      expect(errorElement).toHaveClass('custom-class');
    });
  });
});