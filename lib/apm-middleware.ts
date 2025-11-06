/**
 * APM (Application Performance Monitoring) Middleware
 * Tracks request/response timing, latency, and slow queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger, logRequestComplete, extractRequestContext, requestContext } from './logger'
// import { addApiCallBreadcrumb } from './sentry' // Disabled - sentry.ts not available

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetrics {
  requestId: string
  method: string
  path: string
  statusCode: number
  durationMs: number
  timestamp: Date
  userId?: string
  organizationId?: string
  query?: {
    count: number
    totalDurationMs: number
    slowQueries: Array<{
      query: string
      durationMs: number
    }>
  }
}

// ============================================================================
// METRICS STORAGE (In-memory - use Redis in production)
// ============================================================================

const recentMetrics: PerformanceMetrics[] = []
const MAX_METRICS = 1000

/**
 * Store performance metrics
 */
function storeMetrics(metrics: PerformanceMetrics) {
  recentMetrics.push(metrics)

  // Keep only recent metrics
  if (recentMetrics.length > MAX_METRICS) {
    recentMetrics.shift()
  }

  // Log slow requests
  if (metrics.durationMs > 5000) {
    logger.warn({
      requestId: metrics.requestId,
      path: metrics.path,
      method: metrics.method,
      durationMs: metrics.durationMs,
    }, 'Slow request detected')
  }
}

/**
 * Get recent performance metrics
 */
export function getRecentMetrics(limit: number = 100): PerformanceMetrics[] {
  return recentMetrics.slice(-limit)
}

/**
 * Get average response time by endpoint
 */
export function getAverageResponseTime(path?: string): number {
  const filtered = path
    ? recentMetrics.filter((m) => m.path === path)
    : recentMetrics

  if (filtered.length === 0) return 0

  const total = filtered.reduce((sum, m) => sum + m.durationMs, 0)
  return total / filtered.length
}

/**
 * Get slow endpoints (avg > 2s)
 */
export function getSlowEndpoints(): Array<{
  path: string
  avgDurationMs: number
  count: number
}> {
  const byPath = new Map<string, { total: number; count: number }>()

  recentMetrics.forEach((m) => {
    const existing = byPath.get(m.path) || { total: 0, count: 0 }
    byPath.set(m.path, {
      total: existing.total + m.durationMs,
      count: existing.count + 1,
    })
  })

  const results = Array.from(byPath.entries())
    .map(([path, stats]) => ({
      path,
      avgDurationMs: stats.total / stats.count,
      count: stats.count,
    }))
    .filter((r) => r.avgDurationMs > 2000)
    .sort((a, b) => b.avgDurationMs - a.avgDurationMs)

  return results
}

/**
 * Get error rate by status code
 */
export function getErrorRate(): {
  total: number
  errors: number
  errorRate: number
  byStatusCode: Record<number, number>
} {
  const total = recentMetrics.length
  const byStatusCode: Record<number, number> = {}

  recentMetrics.forEach((m) => {
    byStatusCode[m.statusCode] = (byStatusCode[m.statusCode] || 0) + 1
  })

  const errors = recentMetrics.filter((m) => m.statusCode >= 400).length
  const errorRate = total > 0 ? (errors / total) * 100 : 0

  return {
    total,
    errors,
    errorRate,
    byStatusCode,
  }
}

// ============================================================================
// APM MIDDLEWARE
// ============================================================================

/**
 * APM middleware for API routes
 * Wraps handler function with performance tracking
 */
export function withAPM<T>(
  handler: (request: NextRequest, context?: any) => Promise<T>
) {
  return async function apmHandler(
    request: NextRequest,
    context?: any
  ): Promise<T> {
    const startTime = Date.now()
    const reqContext = extractRequestContext(request)

    // Run handler in request context
    return requestContext.run(reqContext, async () => {
      try {
        // Log request start
        logger.info({
          msg: 'Request started',
          requestId: reqContext.requestId,
          method: reqContext.method,
          path: reqContext.path,
        })

        // Execute handler
        const response = await handler(request, context)

        // Calculate duration
        const durationMs = Date.now() - startTime

        // Extract status code from response
        let statusCode = 200
        if (response && typeof response === 'object' && 'status' in response) {
          statusCode = (response as any).status || 200
        }

        // Store metrics
        const metrics: PerformanceMetrics = {
          requestId: reqContext.requestId!,
          method: reqContext.method!,
          path: reqContext.path!,
          statusCode,
          durationMs,
          timestamp: new Date(),
        }

        storeMetrics(metrics)

        // Log request completion
        logRequestComplete(reqContext, statusCode, durationMs)

        // Add Sentry breadcrumb - Disabled
        // addApiCallBreadcrumb(
        //   reqContext.method!,
        //   reqContext.path!,
        //   statusCode,
        //   durationMs
        // )

        return response
      } catch (error) {
        const durationMs = Date.now() - startTime

        // Log error
        logger.error({
          msg: 'Request failed',
          requestId: reqContext.requestId,
          method: reqContext.method,
          path: reqContext.path,
          durationMs,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        // Store error metrics
        const metrics: PerformanceMetrics = {
          requestId: reqContext.requestId!,
          method: reqContext.method!,
          path: reqContext.path!,
          statusCode: 500,
          durationMs,
          timestamp: new Date(),
        }

        storeMetrics(metrics)

        throw error
      }
    })
  }
}

// ============================================================================
// QUERY TRACKING
// ============================================================================

interface QueryMetric {
  query: string
  durationMs: number
  timestamp: Date
  requestId?: string
}

const queryMetrics: QueryMetric[] = []
const MAX_QUERY_METRICS = 1000
const SLOW_QUERY_THRESHOLD_MS = 1000

/**
 * Track database query performance
 */
export function trackQuery(
  query: string,
  durationMs: number,
  requestId?: string
) {
  const metric: QueryMetric = {
    query: query.substring(0, 200), // Truncate long queries
    durationMs,
    timestamp: new Date(),
    requestId,
  }

  queryMetrics.push(metric)

  // Keep only recent queries
  if (queryMetrics.length > MAX_QUERY_METRICS) {
    queryMetrics.shift()
  }

  // Log slow queries
  if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
    logger.warn({
      query: metric.query,
      durationMs,
      requestId,
    }, 'Slow query detected')
  }
}

/**
 * Get slow queries
 */
export function getSlowQueries(limit: number = 50): QueryMetric[] {
  return queryMetrics
    .filter((q) => q.durationMs > SLOW_QUERY_THRESHOLD_MS)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, limit)
}

/**
 * Get query statistics
 */
export function getQueryStats(): {
  total: number
  avgDurationMs: number
  slowQueries: number
  slowestQuery?: QueryMetric
} {
  if (queryMetrics.length === 0) {
    return {
      total: 0,
      avgDurationMs: 0,
      slowQueries: 0,
    }
  }

  const total = queryMetrics.length
  const totalDuration = queryMetrics.reduce((sum, q) => sum + q.durationMs, 0)
  const avgDurationMs = totalDuration / total
  const slowQueries = queryMetrics.filter(
    (q) => q.durationMs > SLOW_QUERY_THRESHOLD_MS
  ).length

  const slowestQuery = queryMetrics.reduce((slowest, current) =>
    current.durationMs > (slowest?.durationMs || 0) ? current : slowest
  )

  return {
    total,
    avgDurationMs,
    slowQueries,
    slowestQuery,
  }
}

// ============================================================================
// PERFORMANCE SUMMARY
// ============================================================================

/**
 * Get performance summary for monitoring dashboard
 */
export function getPerformanceSummary() {
  const now = Date.now()
  const last5Min = recentMetrics.filter(
    (m) => now - m.timestamp.getTime() < 5 * 60 * 1000
  )

  const avgResponseTime =
    last5Min.length > 0
      ? last5Min.reduce((sum, m) => sum + m.durationMs, 0) / last5Min.length
      : 0

  const requestsPerMinute = last5Min.length / 5

  const errorRate = getErrorRate()
  const queryStats = getQueryStats()

  return {
    requests: {
      total: recentMetrics.length,
      last5Min: last5Min.length,
      requestsPerMinute,
    },
    performance: {
      avgResponseTimeMs: avgResponseTime,
      slowEndpoints: getSlowEndpoints().slice(0, 5),
    },
    errors: {
      errorRate: errorRate.errorRate,
      totalErrors: errorRate.errors,
      byStatusCode: errorRate.byStatusCode,
    },
    database: {
      totalQueries: queryStats.total,
      avgQueryTimeMs: queryStats.avgDurationMs,
      slowQueries: queryStats.slowQueries,
      slowestQuery: queryStats.slowestQuery,
    },
  }
}

// ============================================================================
// METRICS EXPORT
// ============================================================================

/**
 * Export metrics in Prometheus format
 */
export function exportPrometheusMetrics(): string {
  const lines: string[] = []

  // Request duration histogram
  lines.push('# HELP http_request_duration_ms HTTP request duration in milliseconds')
  lines.push('# TYPE http_request_duration_ms histogram')

  const buckets = [50, 100, 200, 500, 1000, 2000, 5000, 10000]
  const pathMetrics = new Map<string, number[]>()

  recentMetrics.forEach((m) => {
    if (!pathMetrics.has(m.path)) {
      pathMetrics.set(m.path, [])
    }
    pathMetrics.get(m.path)!.push(m.durationMs)
  })

  pathMetrics.forEach((durations, path) => {
    buckets.forEach((bucket) => {
      const count = durations.filter((d) => d <= bucket).length
      lines.push(
        `http_request_duration_ms_bucket{path="${path}",le="${bucket}"} ${count}`
      )
    })

    const total = durations.reduce((sum, d) => sum + d, 0)
    lines.push(`http_request_duration_ms_sum{path="${path}"} ${total}`)
    lines.push(`http_request_duration_ms_count{path="${path}"} ${durations.length}`)
  })

  // Request count by status code
  lines.push('# HELP http_requests_total Total HTTP requests')
  lines.push('# TYPE http_requests_total counter')

  const statusCounts = new Map<number, number>()
  recentMetrics.forEach((m) => {
    statusCounts.set(m.statusCode, (statusCounts.get(m.statusCode) || 0) + 1)
  })

  statusCounts.forEach((count, status) => {
    lines.push(`http_requests_total{status="${status}"} ${count}`)
  })

  // Database queries
  lines.push('# HELP db_query_duration_ms Database query duration in milliseconds')
  lines.push('# TYPE db_query_duration_ms histogram')

  queryMetrics.forEach((q) => {
    lines.push(`db_query_duration_ms{query="${q.query.substring(0, 50)}"} ${q.durationMs}`)
  })

  return lines.join('\n')
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clear old metrics (run periodically)
 */
export function cleanupOldMetrics(maxAgeMs: number = 24 * 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs

  let removed = 0
  while (
    recentMetrics.length > 0 &&
    recentMetrics[0].timestamp.getTime() < cutoff
  ) {
    recentMetrics.shift()
    removed++
  }

  logger.info({ removed }, 'Cleaned up old metrics')
}

// Schedule cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupOldMetrics()
  }, 60 * 60 * 1000)
}
