/**
 * Rate Limiting Service
 * Protects API endpoints from abuse using sliding window algorithm
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'
import { logger } from './logger'

// ============================================================================
// CONFIGURATION
// ============================================================================

// Initialize Redis client (if configured)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// ============================================================================
// RATE LIMITERS
// ============================================================================

/**
 * API rate limiter - 100 requests per minute per user
 */
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null

/**
 * Authentication rate limiter - 5 attempts per 15 minutes per IP
 */
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null

/**
 * API key rate limiter - 1000 requests per hour per API key
 */
export const apiKeyRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 h'),
      analytics: true,
      prefix: 'ratelimit:apikey',
    })
  : null

/**
 * Job execution rate limiter - 50 concurrent jobs per organization
 */
export const executionRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, '1 m'),
      analytics: true,
      prefix: 'ratelimit:execution',
    })
  : null

/**
 * Email sending rate limiter - 10 emails per minute per user
 */
export const emailRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'ratelimit:email',
    })
  : null

// ============================================================================
// IN-MEMORY FALLBACK (for development)
// ============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

const inMemoryStore = new Map<string, RateLimitEntry>()

/**
 * In-memory rate limiter (fallback when Redis not available)
 */
class InMemoryRateLimiter {
  constructor(
    private maxRequests: number,
    private windowMs: number,
    private prefix: string
  ) {}

  async limit(identifier: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }> {
    const key = `${this.prefix}:${identifier}`
    const now = Date.now()

    const entry = inMemoryStore.get(key)

    // No entry or window expired
    if (!entry || entry.resetAt < now) {
      const resetAt = now + this.windowMs

      inMemoryStore.set(key, {
        count: 1,
        resetAt,
      })

      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: resetAt,
      }
    }

    // Increment count
    entry.count++

    // Check if limit exceeded
    if (entry.count > this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: entry.resetAt,
      }
    }

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetAt,
    }
  }
}

// Fallback limiters
const fallbackApiLimiter = new InMemoryRateLimiter(
  100,
  60 * 1000,
  'ratelimit:api'
)
const fallbackAuthLimiter = new InMemoryRateLimiter(
  5,
  15 * 60 * 1000,
  'ratelimit:auth'
)
const fallbackApiKeyLimiter = new InMemoryRateLimiter(
  1000,
  60 * 60 * 1000,
  'ratelimit:apikey'
)

// ============================================================================
// RATE LIMIT HELPERS
// ============================================================================

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

/**
 * Check rate limit for API requests
 */
export async function checkApiRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  try {
    const limiter = apiRateLimiter || fallbackApiLimiter
    const result = await limiter.limit(identifier)

    if (!result.success) {
      logger.warn({ identifier }, 'API rate limit exceeded')
    }

    return {
      ...result,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    }
  } catch (error) {
    logger.error({ error, identifier }, 'Rate limit check failed')
    // Allow request on error (fail open)
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
    }
  }
}

/**
 * Check rate limit for authentication attempts
 */
export async function checkAuthRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  try {
    const limiter = authRateLimiter || fallbackAuthLimiter
    const result = await limiter.limit(identifier)

    if (!result.success) {
      logger.warn({ identifier }, 'Auth rate limit exceeded')
    }

    return {
      ...result,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    }
  } catch (error) {
    logger.error({ error, identifier }, 'Auth rate limit check failed')
    return {
      success: true,
      limit: 5,
      remaining: 5,
      reset: Date.now() + 15 * 60000,
    }
  }
}

/**
 * Check rate limit for API key requests
 */
export async function checkApiKeyRateLimit(
  apiKey: string
): Promise<RateLimitResult> {
  try {
    const limiter = apiKeyRateLimiter || fallbackApiKeyLimiter
    const result = await limiter.limit(apiKey)

    if (!result.success) {
      logger.warn({
        apiKey: apiKey.substring(0, 10) + '...',
      }, 'API key rate limit exceeded')
    }

    return {
      ...result,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    }
  } catch (error) {
    logger.error({ error }, 'API key rate limit check failed')
    return {
      success: true,
      limit: 1000,
      remaining: 1000,
      reset: Date.now() + 60 * 60000,
    }
  }
}

/**
 * Get identifier from request (user ID, IP, or API key)
 */
export function getRequestIdentifier(request: NextRequest): string {
  // Check for API key
  const apiKey = request.headers.get('X-API-Key')
  if (apiKey) {
    return `apikey:${apiKey}`
  }

  // Check for user ID (from auth)
  const userId = request.headers.get('X-User-ID')
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  return `ip:${ip}`
}

/**
 * Get IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  return 'unknown'
}

// ============================================================================
// MIDDLEWARE WRAPPER
// ============================================================================

/**
 * Wrap handler with rate limiting
 */
export function withRateLimit<T>(
  handler: (request: NextRequest, context?: any) => Promise<T>,
  limiterType: 'api' | 'auth' | 'apiKey' = 'api'
) {
  return async function rateLimitedHandler(
    request: NextRequest,
    context?: any
  ): Promise<T | Response> {
    let identifier: string
    let result: RateLimitResult

    switch (limiterType) {
      case 'api':
        identifier = getRequestIdentifier(request)
        result = await checkApiRateLimit(identifier)
        break

      case 'auth':
        identifier = getClientIP(request)
        result = await checkAuthRateLimit(identifier)
        break

      case 'apiKey':
        const apiKey = request.headers.get('X-API-Key')
        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error: 'API key required',
              code: 'MISSING_API_KEY',
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            }
          ) as any
        }
        result = await checkApiKeyRateLimit(apiKey)
        identifier = apiKey
        break
    }

    // Check if rate limited
    if (!result.success) {
      logger.warn({
        identifier,
        limiterType,
        limit: result.limit,
        reset: result.reset,
      }, 'Request rate limited')

      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': (result.retryAfter || 60).toString(),
          },
        }
      ) as any
    }

    // Add rate limit headers to successful response
    const response = await handler(request, context)

    // If response is a NextResponse, add headers
    if (response && typeof response === 'object' && 'headers' in response) {
      const nextResponse = response as any
      nextResponse.headers.set('X-RateLimit-Limit', result.limit.toString())
      nextResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      nextResponse.headers.set('X-RateLimit-Reset', result.reset.toString())
    }

    return response
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up expired in-memory rate limit entries
 */
export function cleanupExpiredEntries() {
  const now = Date.now()
  let removed = 0

  inMemoryStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      inMemoryStore.delete(key)
      removed++
    }
  })

  if (removed > 0) {
    logger.info({ removed }, 'Cleaned up expired rate limit entries')
  }
}

// Schedule cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredEntries()
  }, 5 * 60 * 1000)
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  checkApiRateLimit,
  checkAuthRateLimit,
  checkApiKeyRateLimit,
  getRequestIdentifier,
  getClientIP,
  withRateLimit,
}
