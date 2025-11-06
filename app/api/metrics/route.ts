/**
 * Prometheus Metrics Export API
 * Exports application and business metrics in Prometheus format
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { executions, jobs, batches } from '@/db/schema'
import { sql, gte } from 'drizzle-orm'
import { exportPrometheusMetrics } from '@/lib/apm-middleware'

export const dynamic = 'force-dynamic'

/**
 * GET - Export metrics in Prometheus format
 */
export async function GET(request: NextRequest) {
  try {
    const metrics: string[] = []

    // Get APM metrics
    const apmMetrics = exportPrometheusMetrics()
    metrics.push(apmMetrics)

    // ========================================================================
    // BUSINESS METRICS
    // ========================================================================

    // Get stats from last 24 hours
    const last24Hours = new Date()
    last24Hours.setHours(last24Hours.getHours() - 24)

    // Total jobs by status
    const jobsByStatus = await db
      .select({
        status: jobs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(jobs)
      .where(gte(jobs.createdAt, last24Hours))
      .groupBy(jobs.status)

    metrics.push('# HELP mino_jobs_total Total jobs by status (last 24h)')
    metrics.push('# TYPE mino_jobs_total gauge')
    jobsByStatus.forEach((row) => {
      metrics.push(`mino_jobs_total{status="${row.status}"} ${row.count}`)
    })

    // Total executions by status
    const executionsByStatus = await db
      .select({
        status: executions.status,
        count: sql<number>`count(*)::int`,
      })
      .from(executions)
      .where(gte(executions.createdAt, last24Hours))
      .groupBy(executions.status)

    metrics.push('# HELP mino_executions_total Total executions by status (last 24h)')
    metrics.push('# TYPE mino_executions_total gauge')
    executionsByStatus.forEach((row) => {
      metrics.push(`mino_executions_total{status="${row.status}"} ${row.count}`)
    })

    // Average accuracy
    const avgAccuracy = await db
      .select({
        avgAccuracy: sql<number>`AVG(CAST(accuracy_percentage AS FLOAT))`,
      })
      .from(executions)
      .where(gte(executions.createdAt, last24Hours))

    if (avgAccuracy[0]?.avgAccuracy !== null) {
      metrics.push('# HELP mino_avg_accuracy_percentage Average accuracy percentage (last 24h)')
      metrics.push('# TYPE mino_avg_accuracy_percentage gauge')
      metrics.push(`mino_avg_accuracy_percentage ${avgAccuracy[0].avgAccuracy.toFixed(2)}`)
    }

    // Total batches
    const totalBatches = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(batches)
      .where(gte(batches.createdAt, last24Hours))

    metrics.push('# HELP mino_batches_created_total Total batches created (last 24h)')
    metrics.push('# TYPE mino_batches_created_total gauge')
    metrics.push(`mino_batches_created_total ${totalBatches[0].count}`)

    // Average execution duration
    const avgDuration = await db
      .select({
        avgDurationMs: sql<number>`AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)`,
      })
      .from(executions)
      .where(
        sql`${executions.createdAt} >= ${last24Hours} AND ${executions.completedAt} IS NOT NULL`
      )

    if (avgDuration[0]?.avgDurationMs !== null) {
      metrics.push('# HELP mino_avg_execution_duration_ms Average execution duration in ms (last 24h)')
      metrics.push('# TYPE mino_avg_execution_duration_ms gauge')
      metrics.push(`mino_avg_execution_duration_ms ${avgDuration[0].avgDurationMs.toFixed(2)}`)
    }

    // Jobs processed per hour
    const jobsPerHour = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(jobs)
      .where(sql`${jobs.completedAt} >= NOW() - INTERVAL '1 hour'`)

    metrics.push('# HELP mino_jobs_per_hour Jobs processed in last hour')
    metrics.push('# TYPE mino_jobs_per_hour gauge')
    metrics.push(`mino_jobs_per_hour ${jobsPerHour[0].count}`)

    // Error rate
    const errorStats = await db
      .select({
        total: sql<number>`count(*)::int`,
        errors: sql<number>`count(*) FILTER (WHERE status = 'error')::int`,
      })
      .from(jobs)
      .where(gte(jobs.createdAt, last24Hours))

    const errorRate = errorStats[0].total > 0
      ? (errorStats[0].errors / errorStats[0].total) * 100
      : 0

    metrics.push('# HELP mino_error_rate_percentage Error rate percentage (last 24h)')
    metrics.push('# TYPE mino_error_rate_percentage gauge')
    metrics.push(`mino_error_rate_percentage ${errorRate.toFixed(2)}`)

    // ========================================================================
    // SYSTEM METRICS
    // ========================================================================

    // Memory usage
    const memoryUsage = process.memoryUsage()
    metrics.push('# HELP nodejs_memory_usage_bytes Node.js memory usage in bytes')
    metrics.push('# TYPE nodejs_memory_usage_bytes gauge')
    metrics.push(`nodejs_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`)
    metrics.push(`nodejs_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}`)
    metrics.push(`nodejs_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}`)
    metrics.push(`nodejs_memory_usage_bytes{type="external"} ${memoryUsage.external}`)

    // Process uptime
    metrics.push('# HELP nodejs_process_uptime_seconds Process uptime in seconds')
    metrics.push('# TYPE nodejs_process_uptime_seconds gauge')
    metrics.push(`nodejs_process_uptime_seconds ${process.uptime()}`)

    // Event loop lag (simple check)
    const startTime = Date.now()
    await new Promise((resolve) => setImmediate(resolve))
    const eventLoopLag = Date.now() - startTime

    metrics.push('# HELP nodejs_eventloop_lag_ms Event loop lag in milliseconds')
    metrics.push('# TYPE nodejs_eventloop_lag_ms gauge')
    metrics.push(`nodejs_eventloop_lag_ms ${eventLoopLag}`)

    // Return metrics in Prometheus text format
    return new NextResponse(metrics.join('\n') + '\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Failed to export metrics:', error)
    return new NextResponse('Error exporting metrics', { status: 500 })
  }
}
