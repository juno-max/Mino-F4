/**
 * Retry Logic with Exponential Backoff
 * Handles transient failures with intelligent retry strategies
 */

export interface RetryConfig {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
  onRetry?: (error: Error, attempt: number) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalDuration: number
}

/**
 * Error classification for retry decisions
 */
export enum ErrorCategory {
  TRANSIENT = 'transient',
  PERMANENT = 'permanent',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  NETWORK = 'network',
}

/**
 * Classify error to determine if retry is appropriate
 */
export function classifyError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase()

  // Rate limiting errors
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return ErrorCategory.RATE_LIMIT
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return ErrorCategory.TIMEOUT
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('socket hang up')
  ) {
    return ErrorCategory.NETWORK
  }

  // Permanent errors (validation, not found, etc.)
  if (
    message.includes('not found') ||
    message.includes('invalid') ||
    message.includes('forbidden') ||
    message.includes('unauthorized')
  ) {
    return ErrorCategory.PERMANENT
  }

  // Default to transient for unknown errors
  return ErrorCategory.TRANSIENT
}

/**
 * Determine if error is retryable
 */
export function isRetryable(error: Error): boolean {
  const category = classifyError(error)
  return category !== ErrorCategory.PERMANENT
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number
): number {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt - 1)

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs)

  // Add jitter (random 0-25% of delay) to prevent thundering herd
  const jitter = Math.random() * 0.25 * cappedDelay

  return Math.floor(cappedDelay + jitter)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    onRetry,
  } = config

  let lastError: Error | undefined
  let attempts = 0
  const startTime = Date.now()

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    attempts = attempt

    try {
      const result = await fn()
      return {
        success: true,
        data: result,
        attempts,
        totalDuration: Date.now() - startTime,
      }
    } catch (error) {
      lastError = error as Error

      // If last attempt, don't retry
      if (attempt > maxRetries) {
        break
      }

      // Check if error is retryable
      if (!isRetryable(lastError)) {
        console.log(`[Retry] Non-retryable error on attempt ${attempt}:`, lastError.message)
        break
      }

      // Calculate delay
      const category = classifyError(lastError)
      let delay = calculateDelay(attempt, baseDelayMs, maxDelayMs, backoffMultiplier)

      // Special handling for rate limits - longer delay
      if (category === ErrorCategory.RATE_LIMIT) {
        delay = Math.max(delay, 5000) // At least 5 seconds for rate limits
      }

      console.log(
        `[Retry] Attempt ${attempt}/${maxRetries} failed (${category}). Retrying in ${delay}ms...`,
        lastError.message
      )

      // Call retry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt)
      }

      // Wait before retrying
      await sleep(delay)
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    totalDuration: Date.now() - startTime,
  }
}

/**
 * Retry configuration presets for common scenarios
 */
export const RetryPresets = {
  // Quick retries for fast operations (API calls, etc.)
  FAST: {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
  },

  // Standard retries for normal operations
  STANDARD: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  },

  // Patient retries for slow/heavy operations
  PATIENT: {
    maxRetries: 5,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },

  // Aggressive retries for critical operations
  AGGRESSIVE: {
    maxRetries: 10,
    baseDelayMs: 500,
    maxDelayMs: 60000,
    backoffMultiplier: 1.5,
  },
} as const

/**
 * Create a retry wrapper for a function
 */
export function createRetryable<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  config: RetryConfig = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const result = await withRetry(() => fn(...args), config)

    if (!result.success) {
      throw result.error || new Error('Retry failed')
    }

    return result.data as TReturn
  }
}

/**
 * Batch retry handler for multiple operations
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  config: RetryConfig = {}
): Promise<Array<RetryResult<T>>> {
  return Promise.all(
    operations.map(op => withRetry(op, config))
  )
}
