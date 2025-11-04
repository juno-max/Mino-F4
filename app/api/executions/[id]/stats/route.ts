import { NextRequest, NextResponse } from 'next/server'
import { db, executions, jobs } from '@/db'
import { eq, and, sql } from 'drizzle-orm'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/executions/[id]/stats - Get live execution statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = params.id

    // Get execution details
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })

    if (!execution) {
      return NextResponse.json(
        { message: 'Execution not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Get job statistics for this execution
    const jobStats = await db
      .select({
        totalJobs: sql<number>`count(*)::int`,
        completedJobs: sql<number>`count(*) filter (where ${jobs.status} = 'completed')::int`,
        runningJobs: sql<number>`count(*) filter (where ${jobs.status} = 'running')::int`,
        queuedJobs: sql<number>`count(*) filter (where ${jobs.status} = 'queued')::int`,
        errorJobs: sql<number>`count(*) filter (where ${jobs.status} = 'error')::int`,
        evaluatedJobs: sql<number>`count(*) filter (where ${jobs.isEvaluated} = true)::int`,
        passedJobs: sql<number>`count(*) filter (where ${jobs.evaluationResult} = 'pass')::int`,
        failedJobs: sql<number>`count(*) filter (where ${jobs.evaluationResult} = 'fail')::int`,
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.projectId, execution.projectId),
          eq(jobs.batchId, execution.batchId)
        )
      )

    const stats = jobStats[0] || {
      totalJobs: 0,
      completedJobs: 0,
      runningJobs: 0,
      queuedJobs: 0,
      errorJobs: 0,
      evaluatedJobs: 0,
      passedJobs: 0,
      failedJobs: 0,
    }

    // Calculate pass rate if we have evaluated jobs
    let passRate = null
    if (stats.evaluatedJobs > 0) {
      passRate = Number(((stats.passedJobs / stats.evaluatedJobs) * 100).toFixed(2))
    }

    // Calculate progress percentage
    const progressPercentage = stats.totalJobs > 0
      ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
      : 0

    // Calculate estimated time remaining
    let estimatedTimeRemaining = null
    if (execution.startedAt && stats.completedJobs > 0 && stats.completedJobs < stats.totalJobs) {
      const elapsedMs = Date.now() - execution.startedAt.getTime()
      const avgTimePerJob = elapsedMs / stats.completedJobs
      const remainingJobs = stats.totalJobs - stats.completedJobs
      estimatedTimeRemaining = Math.round((avgTimePerJob * remainingJobs) / 1000) // in seconds
    }

    // Get currently running jobs with progress
    const runningJobsList = await db.query.jobs.findMany({
      where: and(
        eq(jobs.projectId, execution.projectId),
        eq(jobs.batchId, execution.batchId),
        eq(jobs.status, 'running')
      ),
      orderBy: (jobs, { desc }) => [desc(jobs.startedAt)],
      limit: 10, // Get up to 10 currently running jobs
    })

    return NextResponse.json(
      {
        executionId: execution.id,
        status: execution.status,
        concurrency: execution.concurrency,
        startedAt: execution.startedAt,
        pausedAt: execution.pausedAt,
        resumedAt: execution.resumedAt,
        stoppedAt: execution.stoppedAt,
        completedAt: execution.completedAt,
        lastActivityAt: execution.lastActivityAt,
        stats: {
          ...stats,
          passRate,
          progressPercentage,
          estimatedTimeRemaining,
        },
        runningJobs: runningJobsList.map(job => ({
          id: job.id,
          siteUrl: job.siteUrl,
          siteName: job.siteName,
          currentStep: job.currentStep,
          currentUrl: job.currentUrl,
          progressPercentage: job.progressPercentage,
          startedAt: job.startedAt,
        })),
      },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Error fetching execution stats:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch execution stats' },
      { status: 500, headers: corsHeaders }
    )
  }
}
