/**
 * Liveness Probe API
 * Checks if application is alive and should not be restarted
 * Used by Kubernetes/Docker for liveness checks
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET - Liveness check
 * Returns 200 if application process is alive
 * This is a simple check - if the server can respond, it's alive
 */
export async function GET(request: NextRequest) {
  try {
    // Check if event loop is responsive
    const startTime = Date.now()
    await new Promise((resolve) => setImmediate(resolve))
    const eventLoopDelay = Date.now() - startTime

    // Check memory usage
    const memoryUsage = process.memoryUsage()
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    }

    // Check if memory usage is critical (> 90% of heap)
    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    const isCritical = heapUsagePercent > 90

    if (isCritical) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          eventLoopDelay,
          memory: memoryUsageMB,
          heapUsagePercent: heapUsagePercent.toFixed(2),
          warning: 'Critical memory usage detected',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        eventLoopDelay,
        memory: memoryUsageMB,
        heapUsagePercent: heapUsagePercent.toFixed(2),
        pid: process.pid,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
