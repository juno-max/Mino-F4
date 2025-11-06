/**
 * Structured Logger using Pino
 * Production-grade logging with correlation IDs and structured output
 */

import pino from 'pino'
import { AsyncLocalStorage } from 'async_hooks'

// ============================================================================
// ASYNC LOCAL STORAGE FOR REQUEST CONTEXT
// ============================================================================

interface RequestContext {
  requestId?: string
  userId?: string
  organizationId?: string
  path?: string
  method?: string
}

export const requestContext = new AsyncLocalStorage<RequestContext>()

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Create Pino logger instance with appropriate configuration
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Pretty print in development, JSON in production
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),

  // Base configuration
  base: {
    env: process.env.NODE_ENV,
    service: 'mino-ux',
  },

  // Formatters for production
  formatters: {
    level: (label) => {
      return { level: label }
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        host: bindings.hostname,
      }
    },
  },

  // Add timestamps
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'apiKey',
      'token',
      'authorization',
      'cookie',
      'secret',
      '*.password',
      '*.apiKey',
      '*.token',
      '*.authorization',
    ],
    remove: true,
  },
})

// ============================================================================
// LOGGER WITH CONTEXT
// ============================================================================

/**
 * Get logger with current request context
 */
export function getContextLogger() {
  const context = requestContext.getStore()

  if (context) {
    return logger.child(context)
  }

  return logger
}

/**
 * Create child logger with additional context
 */
export function createLogger(context: Record<string, any>) {
  const existingContext = requestContext.getStore() || {}
  return logger.child({ ...existingContext, ...context })
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Extract request context for logging
 */
export function extractRequestContext(request: Request): RequestContext {
  const url = new URL(request.url)

  return {
    requestId: generateRequestId(),
    path: url.pathname,
    method: request.method,
  }
}

/**
 * Log request start
 */
export function logRequestStart(context: RequestContext) {
  const log = logger.child(context)
  log.info({
    msg: 'Request started',
    method: context.method,
    path: context.path,
  })
}

/**
 * Log request completion
 */
export function logRequestComplete(
  context: RequestContext,
  statusCode: number,
  durationMs: number
) {
  const log = logger.child(context)
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

  log[level]({
    msg: 'Request completed',
    method: context.method,
    path: context.path,
    statusCode,
    durationMs,
  })
}

// ============================================================================
// SPECIALIZED LOGGERS
// ============================================================================

/**
 * Log database query
 */
export function logQuery(query: string, params?: any, durationMs?: number) {
  const log = getContextLogger()
  log.debug({
    msg: 'Database query',
    query: query.substring(0, 200), // Truncate long queries
    params,
    durationMs,
  })
}

/**
 * Log external API call
 */
export function logExternalRequest(
  url: string,
  method: string,
  statusCode?: number,
  durationMs?: number,
  error?: any
) {
  const log = getContextLogger()

  if (error) {
    log.error({
      msg: 'External API request failed',
      url,
      method,
      error: error.message,
      stack: error.stack,
      durationMs,
    })
  } else {
    log.info({
      msg: 'External API request',
      url,
      method,
      statusCode,
      durationMs,
    })
  }
}

/**
 * Log job execution
 */
export function logJobExecution(
  jobId: string,
  status: 'started' | 'completed' | 'failed',
  details?: any
) {
  const log = getContextLogger()

  if (status === 'failed') {
    log.error({
      msg: 'Job execution failed',
      jobId,
      ...details,
    })
  } else {
    log.info({
      msg: `Job execution ${status}`,
      jobId,
      ...details,
    })
  }
}

/**
 * Log WebSocket event
 */
export function logWebSocketEvent(
  event: string,
  connectionId?: string,
  details?: any
) {
  const log = getContextLogger()
  log.debug({
    msg: 'WebSocket event',
    event,
    connectionId,
    ...details,
  })
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'signup' | 'failed_login',
  userId?: string,
  details?: any
) {
  const log = getContextLogger()
  const level = event === 'failed_login' ? 'warn' : 'info'

  log[level]({
    msg: `Auth event: ${event}`,
    userId,
    ...details,
  })
}

/**
 * Log notification delivery
 */
export function logNotification(
  type: string,
  userId: string,
  channel: 'email' | 'slack' | 'in_app',
  success: boolean,
  error?: any
) {
  const log = getContextLogger()

  if (success) {
    log.info({
      msg: 'Notification delivered',
      type,
      userId,
      channel,
    })
  } else {
    log.error({
      msg: 'Notification delivery failed',
      type,
      userId,
      channel,
      error: error?.message,
    })
  }
}

/**
 * Log performance metric
 */
export function logMetric(
  metric: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count',
  tags?: Record<string, string>
) {
  const log = getContextLogger()
  log.info({
    msg: 'Performance metric',
    metric,
    value,
    unit,
    ...tags,
  })
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Log error with full context
 */
export function logError(
  error: Error | unknown,
  context?: Record<string, any>
) {
  const log = getContextLogger()

  if (error instanceof Error) {
    log.error({
      msg: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    })
  } else {
    log.error({
      msg: 'Unknown error',
      error,
      ...context,
    })
  }
}

/**
 * Log fatal error (crashes the application)
 */
export function logFatal(
  error: Error | unknown,
  context?: Record<string, any>
) {
  const log = getContextLogger()

  if (error instanceof Error) {
    log.fatal({
      msg: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    })
  } else {
    log.fatal({
      msg: 'Fatal error',
      error,
      ...context,
    })
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default logger
