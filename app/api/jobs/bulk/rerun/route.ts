import { NextRequest, NextResponse } from 'next/server'
import { db, jobs, executions, projects, batches } from '@/db'
import { inArray, eq } from 'drizzle-orm'
import { validateRequest, handleApiError } from '@/lib/api-helpers'
import { bulkRerunJobsSchema } from '@/lib/validation-schemas'
import { ErrorCodes } from '@/lib/error-codes'
import { executeEvaWorkflow } from '@/lib/eva-executor'
import { createConcurrencyController } from '@/lib/concurrency-control'
import { withRetry, RetryPresets } from '@/lib/retry-logic'
import { publishExecutionStarted, publishExecutionCompleted } from '@/lib/execution-events'

/**
 * POST /api/jobs/bulk/rerun
 * Bulk rerun jobs - resets status and creates new execution
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, bulkRerunJobsSchema)
    if (!validation.success) {
      return validation.response
    }

    const { jobIds, executionType, useAgentQL } = validation.data

    // Fetch all jobs with their batch and project info
    const jobsToRerun = await db.query.jobs.findMany({
      where: inArray(jobs.id, jobIds),
      with: {
        batch: true,
        project: true,
      },
    })

    if (jobsToRerun.length === 0) {
      return NextResponse.json(
        {
          error: 'No jobs found with the provided IDs',
          code: ErrorCodes.NOT_FOUND,
        },
        { status: 404 }
      )
    }

    // Verify all jobs belong to the same batch and project
    const firstJob = jobsToRerun[0]
    const batchId = firstJob.batchId
    const projectId = firstJob.projectId

    const allSameBatch = jobsToRerun.every(job => job.batchId === batchId)
    if (!allSameBatch) {
      return NextResponse.json(
        {
          error: 'All jobs must belong to the same batch for bulk rerun',
          code: ErrorCodes.VALIDATION_ERROR,
        },
        { status: 400 }
      )
    }

    // Get batch to retrieve column schema
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, batchId),
    })

    if (!batch) {
      return NextResponse.json(
        {
          error: 'Batch not found',
          code: ErrorCodes.BATCH_NOT_FOUND,
        },
        { status: 404 }
      )
    }

    // Get project for instructions
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) {
      return NextResponse.json(
        {
          error: 'Project not found',
          code: ErrorCodes.PROJECT_NOT_FOUND,
        },
        { status: 404 }
      )
    }

    // Reset all jobs to queued status
    await db
      .update(jobs)
      .set({
        status: 'queued',
        lastRunAt: null,
        startedAt: null,
        completedAt: null,
        executionDurationMs: null,
        progressPercentage: 0,
      })
      .where(inArray(jobs.id, jobIds))

    // Create execution record
    const [execution] = await db.insert(executions).values({
      batchId,
      projectId,
      status: 'running',
      executionType,
      totalJobs: jobsToRerun.length,
      completedJobs: 0,
      runningJobs: 0,
      queuedJobs: jobsToRerun.length,
      errorJobs: 0,
      startedAt: new Date(),
      concurrency: 5,
    }).returning()

    // Publish execution started event
    publishExecutionStarted({
      executionId: execution.id,
      batchId,
      projectId,
      totalJobs: jobsToRerun.length,
      concurrency: 5,
      executionType: executionType || 'test',
    })

    console.log(`[BulkRerun] Created execution ${execution.id} for ${jobsToRerun.length} jobs`)

    // Start background execution
    if (useAgentQL) {
      console.log('[BulkRerun] Starting EVA agent execution for', jobsToRerun.length, 'jobs')
      // Start execution in background - don't await to avoid blocking response
      const { executeEvaJobs } = await import('@/lib/job-executor')
      executeEvaJobs(
        execution.id,
        jobsToRerun.map(job => ({
          id: job.id,
          organizationId: job.organizationId,
          batchId: job.batchId,
          projectId: job.projectId,
          inputId: job.inputId,
          siteUrl: job.siteUrl,
          goal: job.goal,
          groundTruthData: job.groundTruthData,
        })),
        project.instructions,
        batch.columnSchema as any[]
      ).catch(err => console.error('[BulkRerun] Background execution error:', err))
    }

    return NextResponse.json({
      success: true,
      execution,
      rerunCount: jobsToRerun.length,
      rerunJobIds: jobIds,
      message: `Successfully queued ${jobsToRerun.length} job(s) for rerun`,
    }, { status: 201 })
  } catch (error) {
    console.error('[BulkRerun] Error:', error)
    return handleApiError(error)
  }
}
