/**
 * Structured Error Codes for API Responses
 * Provides consistent error codes across all endpoints
 */

export const ErrorCodes = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_PARAMS: 'INVALID_PARAMS',
  INVALID_QUERY: 'INVALID_QUERY',

  // Authentication & Authorization errors (401, 403)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Resource errors (404)
  NOT_FOUND: 'NOT_FOUND',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  BATCH_NOT_FOUND: 'BATCH_NOT_FOUND',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  EXECUTION_NOT_FOUND: 'EXECUTION_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors (500+)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',

  // Business logic errors
  EXECUTION_FAILED: 'EXECUTION_FAILED',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Custom API Error class with structured error codes
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'ApiError'
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

/**
 * Helper functions to create common API errors
 */
export const createError = {
  validation: (message: string, details?: any) =>
    new ApiError(message, ErrorCodes.VALIDATION_ERROR, 400, details),

  notFound: (resource: string = 'Resource') =>
    new ApiError(`${resource} not found`, ErrorCodes.NOT_FOUND, 404),

  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(message, ErrorCodes.UNAUTHORIZED, 401),

  forbidden: (message: string = 'Forbidden') =>
    new ApiError(message, ErrorCodes.FORBIDDEN, 403),

  conflict: (message: string, details?: any) =>
    new ApiError(message, ErrorCodes.CONFLICT, 409, details),

  rateLimit: (message: string = 'Rate limit exceeded') =>
    new ApiError(message, ErrorCodes.RATE_LIMIT_EXCEEDED, 429),

  internal: (message: string = 'Internal server error', details?: any) =>
    new ApiError(message, ErrorCodes.INTERNAL_ERROR, 500, details),
}
