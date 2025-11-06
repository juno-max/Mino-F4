/**
 * Readiness Probe API
 * Checks if application is ready to receive traffic
 * Used by Kubernetes/Docker for readiness checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * GET - Readiness check
 * Returns 200 if application is ready to handle requests
 */
export async function GET(request: NextRequest) {
  const checks = {
    database: false,
    evaAgent: false,
    redis: false,
  }

  const errors: string[] = []

  try {
    // 1. Check database connection
    try {
      await db.execute(sql`SELECT 1`)
      checks.database = true
    } catch (error) {
      errors.push(`Database: ${error instanceof Error ? error.message : 'Connection failed'}`)
    }

    // 2. Check EVA Agent API
    try {
      const evaApiUrl = process.env.EVA_AGENT_API_URL
      if (evaApiUrl) {
        const response = await fetch(`${evaApiUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5s timeout
        })

        if (response.ok) {
          checks.evaAgent = true
        } else {
          errors.push(`EVA Agent: HTTP ${response.status}`)
        }
      } else {
        // EVA Agent not configured - skip check
        checks.evaAgent = true
      }
    } catch (error) {
      errors.push(`EVA Agent: ${error instanceof Error ? error.message : 'Connection failed'}`)
    }

    // 3. Check Redis (if configured)
    try {
      if (process.env.UPSTASH_REDIS_REST_URL) {
        const { Redis } = await import('@upstash/redis')
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })

        await redis.ping()
        checks.redis = true
      } else {
        // Redis not configured - skip check
        checks.redis = true
      }
    } catch (error) {
      errors.push(`Redis: ${error instanceof Error ? error.message : 'Connection failed'}`)
    }

    // Determine overall readiness
    const isReady = checks.database && checks.evaAgent && checks.redis

    if (isReady) {
      return NextResponse.json(
        {
          status: 'ready',
          timestamp: new Date().toISOString(),
          checks,
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          checks,
          errors,
        },
        { status: 503 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
