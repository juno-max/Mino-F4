/**
 * API Helper Functions
 * Validation, error handling, and response utilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { formatZodError } from './validation-schemas'
import { ErrorCodes, ApiError } from './error-codes'

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

/**
 * Validate request body against Zod schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          formatZodError(result.error),
          { status: 400 }
        ),
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid JSON in request body', code: ErrorCodes.INVALID_JSON },
          { status: 400 }
        ),
      }
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: 'Failed to parse request', code: ErrorCodes.VALIDATION_ERROR },
        { status: 400 }
      ),
    }
  }
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}

    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const result = schema.safeParse(params)

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          formatZodError(result.error),
          { status: 400 }
        ),
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Failed to parse query parameters', code: ErrorCodes.VALIDATION_ERROR },
        { status: 400 }
      ),
    }
  }
}

/**
 * Validate route parameters against Zod schema
 */
export async function validateParams<T>(
  params: Promise<any> | any,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const result = schema.safeParse(resolvedParams)

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          formatZodError(result.error),
          { status: 400 }
        ),
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid route parameters', code: ErrorCodes.VALIDATION_ERROR },
        { status: 400 }
      ),
    }
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  // ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    )
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      formatZodError(error),
      { status: 400 }
    )
  }

  // Standard Error objects
  if (error instanceof Error) {
    console.error('Unexpected error:', error)

    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development'

    return NextResponse.json(
      {
        error: isDevelopment ? error.message : 'Internal server error',
        code: ErrorCodes.INTERNAL_ERROR,
        ...(isDevelopment && { stack: error.stack }),
      },
      { status: 500 }
    )
  }

  // Unknown error type
  console.error('Unknown error type:', error)
  return NextResponse.json(
    { error: 'Unknown error occurred', code: ErrorCodes.UNKNOWN_ERROR },
    { status: 500 }
  )
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Create error response
 */
export function errorResponse(
  message: string,
  code: string = ErrorCodes.INTERNAL_ERROR,
  status: number = 500,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details && { details }),
    },
    { status }
  )
}

/**
 * Create not found response
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse {
  return errorResponse(
    `${resource} not found`,
    ErrorCodes.NOT_FOUND,
    404
  )
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return errorResponse(message, ErrorCodes.UNAUTHORIZED, 401)
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return errorResponse(message, ErrorCodes.FORBIDDEN, 403)
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  cursor?: string
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    nextCursor: string | null
    hasMore: boolean
    total?: number
  }
}

/**
 * Create paginated response
 */
export function paginatedResponse<T extends { id: string }>(
  items: T[],
  limit: number,
  total?: number
): PaginatedResponse<T> {
  const hasMore = items.length > limit
  const data = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? data[data.length - 1].id : null

  return {
    data,
    pagination: {
      nextCursor,
      hasMore,
      ...(total !== undefined && { total }),
    },
  }
}

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

/**
 * Execute database operations in a transaction
 * Automatically rolls back on error
 */
export async function withTransaction<T>(
  db: any,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx: any) => {
    return await callback(tx)
  })
}

// ============================================================================
// CORS HELPERS
// ============================================================================

/**
 * Add CORS headers to response
 */
export function withCors(response: NextResponse, origin: string = '*'): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

/**
 * Handle OPTIONS preflight request
 */
export function corsPreflightResponse(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  })
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

/**
 * Check if request should be rate limited
 * Returns remaining requests if allowed
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt?: Date
}

/**
 * Simple in-memory rate limiter (for development)
 * In production, use Redis-based rate limiting
 */
const rateLimitMap = new Map<string, { count: number; resetAt: Date }>()

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  // No entry or window expired
  if (!entry || entry.resetAt.getTime() < now) {
    const resetAt = new Date(now + windowMs)
    rateLimitMap.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * Check if error is a ZodError
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError
}
