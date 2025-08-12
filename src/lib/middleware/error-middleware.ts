/**
 * API Error Middleware
 * Provides standardized error handling for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { 
  AppError, 
  createAppError, 
  createApiErrorResponse, 
  handleError,
  ERROR_CODES 
} from '../error-handler';

export type ApiHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wrap API handler with error handling
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error, request);
    }
  };
}

/**
 * Handle API errors and return standardized responses
 */
export function handleApiError(error: unknown, request?: NextRequest): NextResponse {
  const requestId = generateRequestId();
  let appError: AppError;

  // Handle different error types
  if (error instanceof ZodError) {
    appError = createAppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      {
        validationErrors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      },
      400,
      'API Validation'
    );
  } else if (error instanceof Error) {
    // Handle specific error types by message or name
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      appError = createAppError(
        ERROR_CODES.ALREADY_EXISTS,
        'Resource already exists',
        { originalError: error.message },
        409,
        'Database Constraint'
      );
    } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
      appError = createAppError(
        ERROR_CODES.NOT_FOUND,
        'Resource not found',
        { originalError: error.message },
        404,
        'Database Query'
      );
    } else if (error.message.includes('connection') || error.message.includes('timeout')) {
      appError = createAppError(
        ERROR_CODES.DATABASE_ERROR,
        'Database connection error',
        { originalError: error.message },
        503,
        'Database Connection'
      );
    } else if (error.name === 'StripeError') {
      appError = createAppError(
        ERROR_CODES.STRIPE_ERROR,
        'Payment processing error',
        { originalError: error.message },
        402,
        'Stripe Integration'
      );
    } else {
      appError = handleError(error, 'API Handler');
    }
  } else {
    appError = handleError(error, 'API Handler');
  }

  // Log error for monitoring
  console.error(`[API Error] ${requestId}:`, {
    error: appError,
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers.get('user-agent'),
  });

  // Create standardized error response
  const errorResponse = createApiErrorResponse(appError, requestId);
  
  return NextResponse.json(
    errorResponse,
    { status: appError.statusCode || 500 }
  );
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw createAppError(
      ERROR_CODES.INVALID_INPUT,
      'Invalid request body',
      { originalError: String(error) },
      400,
      'Request Validation'
    );
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): T {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw createAppError(
      ERROR_CODES.INVALID_INPUT,
      'Invalid query parameters',
      { originalError: String(error) },
      400,
      'Query Validation'
    );
  }
}

/**
 * Create success response with consistent format
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Handle database transaction errors
 */
export function handleDatabaseError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message.includes('connection')) {
      throw createAppError(
        ERROR_CODES.CONNECTION_ERROR,
        'Database connection failed',
        { originalError: error.message },
        503,
        'Database Connection'
      );
    } else if (error.message.includes('timeout')) {
      throw createAppError(
        ERROR_CODES.TIMEOUT_ERROR,
        'Database operation timed out',
        { originalError: error.message },
        504,
        'Database Timeout'
      );
    } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
      throw createAppError(
        ERROR_CODES.ALREADY_EXISTS,
        'Resource already exists',
        { originalError: error.message },
        409,
        'Database Constraint'
      );
    }
  }
  
  throw createAppError(
    ERROR_CODES.DATABASE_ERROR,
    'Database operation failed',
    { originalError: String(error) },
    500,
    'Database Operation'
  );
}