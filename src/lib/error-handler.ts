/**
 * Comprehensive Error Handling System
 * Provides standardized error handling, logging, and user feedback
 */

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
  timestamp: string;
  userId?: string;
  context?: string;
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

// Standard error codes
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  
  // Subscription errors
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  
  // External service errors
  STRIPE_ERROR: 'STRIPE_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  
  // File/CSV errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  CSV_PARSE_ERROR: 'CSV_PARSE_ERROR',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  OFFLINE_ERROR: 'OFFLINE_ERROR',
  
  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// User-friendly error messages
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.UNAUTHORIZED]: 'Please sign in to continue',
  [ERROR_CODES.FORBIDDEN]: 'You don\'t have permission to perform this action',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password',
  
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again',
  [ERROR_CODES.INVALID_INPUT]: 'The information provided is not valid',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields',
  
  [ERROR_CODES.NOT_FOUND]: 'The requested item could not be found',
  [ERROR_CODES.ALREADY_EXISTS]: 'This item already exists',
  [ERROR_CODES.RESOURCE_LIMIT_EXCEEDED]: 'You\'ve reached the limit for this resource',
  
  [ERROR_CODES.SUBSCRIPTION_REQUIRED]: 'This feature requires a subscription',
  [ERROR_CODES.SUBSCRIPTION_EXPIRED]: 'Your subscription has expired',
  [ERROR_CODES.PAYMENT_REQUIRED]: 'Payment is required to continue',
  
  [ERROR_CODES.DATABASE_ERROR]: 'A database error occurred. Please try again',
  [ERROR_CODES.CONNECTION_ERROR]: 'Connection error. Please check your internet connection',
  [ERROR_CODES.TRANSACTION_FAILED]: 'The operation could not be completed. Please try again',
  
  [ERROR_CODES.STRIPE_ERROR]: 'Payment processing error. Please try again',
  [ERROR_CODES.EMAIL_SERVICE_ERROR]: 'Email could not be sent. Please try again later',
  
  [ERROR_CODES.FILE_TOO_LARGE]: 'File is too large. Please choose a smaller file',
  [ERROR_CODES.INVALID_FILE_FORMAT]: 'Invalid file format. Please use a supported format',
  [ERROR_CODES.CSV_PARSE_ERROR]: 'Could not parse CSV file. Please check the format',
  
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again',
  [ERROR_CODES.OFFLINE_ERROR]: 'You\'re offline. Changes will be synced when you\'re back online',
  
  [ERROR_CODES.INTERNAL_ERROR]: 'An internal error occurred. Please try again',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again',
};

/**
 * Create a standardized application error
 */
export function createAppError(
  code: string,
  message?: string,
  details?: Record<string, unknown>,
  statusCode?: number,
  context?: string
): AppError {
  return {
    code,
    message: message || ERROR_MESSAGES[code] || 'An error occurred',
    details,
    statusCode,
    timestamp: new Date().toISOString(),
    context,
  };
}

/**
 * Create a standardized API error response
 */
export function createApiErrorResponse(
  error: AppError,
  requestId?: string
): ApiErrorResponse {
  return {
    error: 'Request failed',
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: error.timestamp,
    requestId,
  };
}

/**
 * Log error with context
 */
export function logError(error: AppError | Error, context?: string): void {
  const timestamp = new Date().toISOString();
  
  if (error instanceof Error) {
    console.error(`[${timestamp}] ${context || 'Error'}:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  } else {
    console.error(`[${timestamp}] ${context || 'AppError'}:`, error);
  }
  
  // In production, you would send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to logging service
    // sendToLoggingService(error, context);
  }
}

/**
 * Handle and format different types of errors
 */
export function handleError(error: unknown, context?: string): AppError {
  let appError: AppError;
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      appError = createAppError(
        ERROR_CODES.VALIDATION_ERROR,
        error.message,
        { originalError: error.name },
        400,
        context
      );
    } else if (error.name === 'NotFoundError') {
      appError = createAppError(
        ERROR_CODES.NOT_FOUND,
        error.message,
        { originalError: error.name },
        404,
        context
      );
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      appError = createAppError(
        ERROR_CODES.NETWORK_ERROR,
        error.message,
        { originalError: error.name },
        503,
        context
      );
    } else {
      appError = createAppError(
        ERROR_CODES.INTERNAL_ERROR,
        error.message,
        { originalError: error.name, stack: error.stack },
        500,
        context
      );
    }
  } else if (typeof error === 'object' && error !== null && 'code' in error) {
    // Already an AppError-like object
    appError = error as AppError;
  } else {
    // Unknown error type
    appError = createAppError(
      ERROR_CODES.UNKNOWN_ERROR,
      String(error),
      { originalError: typeof error },
      500,
      context
    );
  }
  
  logError(appError, context);
  return appError;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError | string): string {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }
  
  return error.message || ERROR_MESSAGES[error.code] || 'An error occurred';
}

/**
 * Check if error should be retried
 */
export function isRetryableError(error: AppError): boolean {
  const retryableCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
    ERROR_CODES.CONNECTION_ERROR,
    ERROR_CODES.DATABASE_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
  ];
  
  return retryableCodes.includes(error.code as keyof typeof ERROR_CODES);
}

/**
 * Check if error requires authentication
 */
export function requiresAuth(error: AppError): boolean {
  const authCodes = [
    ERROR_CODES.UNAUTHORIZED,
    ERROR_CODES.TOKEN_EXPIRED,
  ];
  
  return authCodes.includes(error.code as keyof typeof ERROR_CODES);
}

/**
 * Check if error requires subscription upgrade
 */
export function requiresUpgrade(error: AppError): boolean {
  const upgradeCodes = [
    ERROR_CODES.SUBSCRIPTION_REQUIRED,
    ERROR_CODES.SUBSCRIPTION_EXPIRED,
    ERROR_CODES.RESOURCE_LIMIT_EXCEEDED,
  ];
  
  return upgradeCodes.includes(error.code as keyof typeof ERROR_CODES);
}