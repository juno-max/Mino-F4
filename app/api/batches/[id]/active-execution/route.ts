import { NextRequest, NextResponse } from 'next/server'
import { db, executions, jobs } from '@/db'
import { eq, and, inArray } from 'drizzle-orm'
import { handleApiError } from '@/lib/api-helpers'

/**
 * GET /api/batches/[id]/active-execution
 * Check if there's an active execution for this batch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = params.id

    // Find running or paused execution for this batch
    const activeExecution = await db.query.executions.findFirst({
      where: and(
        eq(executions.batchId, batchId),
        inArray(executions.status, ['running', 'paused'])
      ),
    })

    if (!activeExecution) {
      return NextResponse.json({ execution: null })
    }

    // Get running jobs for this execution
    const runningJobs = await db.query.jobs.findMany({
      where: and(
        eq(jobs.batchId, batchId),
        eq(jobs.status, 'running')
      ),
    })

    // Format running jobs
    const formattedRunningJobs = runningJobs.map(job => ({
      id: job.id,
      siteUrl: job.siteUrl,
      siteName: job.siteName,
      currentStep: job.currentStep,
      currentUrl: job.currentUrl,
      progressPercentage: job.progressPercentage,
      startedAt: job.startedAt,
      createdAt: job.createdAt,
      lastActivityAt: job.updatedAt,
    }))

    return NextResponse.json({
      execution: {
        id: activeExecution.id,
        status: activeExecution.status,
        startedAt: activeExecution.startedAt?.toISOString(),
        completedAt: activeExecution.completedAt?.toISOString(),
      },
      stats: {
        totalJobs: activeExecution.totalJobs,
        completedJobs: activeExecution.completedJobs,
        runningJobs: activeExecution.runningJobs,
        queuedJobs: activeExecution.queuedJobs,
        errorJobs: activeExecution.errorJobs,
        passedJobs: activeExecution.passedJobs,
        failedJobs: activeExecution.failedJobs,
        passRate: activeExecution.passRate,
      },
      runningJobs: formattedRunningJobs,
    })
  } catch (error) {
    console.error('[ActiveExecution] Error:', error)
    return handleApiError(error)
  }
}
