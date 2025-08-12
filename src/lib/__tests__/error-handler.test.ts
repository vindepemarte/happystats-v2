/**
 * Error Handler Unit Tests
 * Tests for error handling utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createAppError,
  handleError,
  getUserFriendlyMessage,
  isRetryableError,
  requiresAuth,
  requiresUpgrade,
  ERROR_CODES,
} from '../error-handler';

describe('Error Handler', () => {
  describe('createAppError', () => {
    it('should create app error with all properties', () => {
      const error = createAppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Test error',
        { field: 'email' },
        400,
        'Test Context'
      );

      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.details).toEqual({ field: 'email' });
      expect(error.statusCode).toBe(400);
      expect(error.context).toBe('Test Context');
      expect(error.timestamp).toBeDefined();
    });

    it('should use default message if none provided', () => {
      const error = createAppError(ERROR_CODES.UNAUTHORIZED);

      expect(error.message).toBe('Please sign in to continue');
    });
  });

  describe('handleError', () => {
    it('should handle JavaScript Error objects', () => {
      const jsError = new Error('Test JS error');
      const appError = handleError(jsError, 'Test Context');

      expect(appError.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(appError.message).toBe('Test JS error');
      expect(appError.context).toBe('Test Context');
    });

    it('should handle ValidationError', () => {
      const validationError = { name: 'ValidationError', message: 'Invalid input' };
      const appError = handleError(validationError, 'Validation');

      expect(appError.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should handle network errors', () => {
      const networkError = new Error('Failed to fetch');
      const appError = handleError(networkError);

      expect(appError.code).toBe(ERROR_CODES.NETWORK_ERROR);
    });

    it('should handle string errors', () => {
      const appError = handleError('Something went wrong');

      expect(appError.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
      expect(appError.message).toBe('Something went wrong');
    });

    it('should handle unknown error types', () => {
      const appError = handleError(123);

      expect(appError.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return message from AppError', () => {
      const error = createAppError(ERROR_CODES.UNAUTHORIZED, 'Custom message');
      expect(getUserFriendlyMessage(error)).toBe('Custom message');
    });

    it('should return default message for error code', () => {
      expect(getUserFriendlyMessage(ERROR_CODES.UNAUTHORIZED)).toBe('Please sign in to continue');
    });

    it('should return the string if not a known error code', () => {
      expect(getUserFriendlyMessage('Custom error')).toBe('Custom error');
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const networkError = createAppError(ERROR_CODES.NETWORK_ERROR);
      const timeoutError = createAppError(ERROR_CODES.TIMEOUT_ERROR);
      const dbError = createAppError(ERROR_CODES.DATABASE_ERROR);

      expect(isRetryableError(networkError)).toBe(true);
      expect(isRetryableError(timeoutError)).toBe(true);
      expect(isRetryableError(dbError)).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      const authError = createAppError(ERROR_CODES.UNAUTHORIZED);
      const validationError = createAppError(ERROR_CODES.VALIDATION_ERROR);

      expect(isRetryableError(authError)).toBe(false);
      expect(isRetryableError(validationError)).toBe(false);
    });
  });

  describe('requiresAuth', () => {
    it('should identify auth-required errors', () => {
      const unauthorizedError = createAppError(ERROR_CODES.UNAUTHORIZED);
      const expiredError = createAppError(ERROR_CODES.TOKEN_EXPIRED);

      expect(requiresAuth(unauthorizedError)).toBe(true);
      expect(requiresAuth(expiredError)).toBe(true);
    });

    it('should identify non-auth errors', () => {
      const validationError = createAppError(ERROR_CODES.VALIDATION_ERROR);

      expect(requiresAuth(validationError)).toBe(false);
    });
  });

  describe('requiresUpgrade', () => {
    it('should identify upgrade-required errors', () => {
      const subscriptionError = createAppError(ERROR_CODES.SUBSCRIPTION_REQUIRED);
      const limitError = createAppError(ERROR_CODES.RESOURCE_LIMIT_EXCEEDED);

      expect(requiresUpgrade(subscriptionError)).toBe(true);
      expect(requiresUpgrade(limitError)).toBe(true);
    });

    it('should identify non-upgrade errors', () => {
      const validationError = createAppError(ERROR_CODES.VALIDATION_ERROR);

      expect(requiresUpgrade(validationError)).toBe(false);
    });
  });
});