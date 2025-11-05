/**
 * Bulk Operations API
 * Handles bulk delete, rerun, and update operations on multiple jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, jobs, executions, sessions } from '@/db'
import { eq, inArray, and } from 'drizzle-orm'
import { validateRequest, handleApiError, withTransaction } from '@/lib/api-helpers'
import { bulkDeleteJobsSchema, bulkRerunJobsSchema, bulkUpdateJobsSchema } from '@/lib/validation-schemas'
import { ErrorCodes, ApiError } from '@/lib/error-codes'
import { executeEvaJobs } from '@/lib/job-executor'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * POST /api/jobs/bulk - Bulk rerun jobs
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, bulkRerunJobsSchema)
    if (!validation.success) return validation.response

    const { jobIds, executionType, useAgentQL } = validation.data

    // Verify all jobs exist and get their details
    const jobsToRerun = await db.query.jobs.findMany({
      where: inArray(jobs.id, jobIds),
      with: {
        project: true,
        batch: true,
      },
    })

    if (jobsToRerun.length === 0) {
      throw new ApiError(
        'No jobs found with the provided IDs',
        ErrorCodes.NOT_FOUND,
        404
      )
    }

    if (jobsToRerun.length !== jobIds.length) {
      throw new ApiError(
        `Only found ${jobsToRerun.length} of ${jobIds.length} requested jobs`,
        ErrorCodes.NOT_FOUND,
        404,
        {
          found: jobsToRerun.length,
          requested: jobIds.length,
        }
      )
    }

    // Group jobs by batch (should all be same batch, but validate)
    const batchIds = new Set(jobsToRerun.map(j => j.batchId))
    if (batchIds.size > 1) {
      throw new ApiError(
        'All jobs must belong to the same batch',
        ErrorCodes.VALIDATION_ERROR,
        400
      )
    }

    const batchId = Array.from(batchIds)[0]
    const projectId = jobsToRerun[0].projectId
    const project = jobsToRerun[0].project
    const batch = jobsToRerun[0].batch

    // Reset jobs to queued status in transaction
    await withTransaction(db, async (tx) => {
      await tx.update(jobs)
        .set({
          status: 'queued',
          lastRunAt: null,
          completedAt: null,
          progressPercentage: 0,
          executionDurationMs: null,
        })
        .where(inArray(jobs.id, jobIds))
    })

    // Create new execution
    const [execution] = await db.insert(executions).values({
      batchId,
      projectId,
      status: 'running',
      executionType: executionType || 'test',
      totalJobs: jobsToRerun.length,
      completedJobs: 0,
      runningJobs: 0,
      queuedJobs: jobsToRerun.length,
      errorJobs: 0,
      startedAt: new Date(),
      concurrency: 5,
    }).returning()

    // Get column schema
    const columnSchema = (batch.columnSchema as any[]) || []

    // Start execution in background
    if (useAgentQL) {
      executeEvaJobs(execution.id, jobsToRerun, project.instructions, columnSchema)
        .catch(err => console.error('[Bulk Rerun] Execution error:', err))
    }

    return NextResponse.json(
      {
        success: true,
        execution,
        rerunJobs: jobsToRerun.length,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/jobs/bulk - Bulk delete jobs
 */
export async function DELETE(request: NextRequest) {
  try {
    const validation = await validateRequest(request, bulkDeleteJobsSchema)
    if (!validation.success) return validation.response

    const { jobIds } = validation.data

    // Check if any jobs are currently running
    const runningJobs = await db.query.jobs.findMany({
      where: and(
        inArray(jobs.id, jobIds),
        eq(jobs.status, 'running')
      ),
    })

    if (runningJobs.length > 0) {
      throw new ApiError(
        `Cannot delete ${runningJobs.length} job(s) that are currently running`,
        ErrorCodes.INVALID_STATUS_TRANSITION,
        400,
        {
          runningJobIds: runningJobs.map(j => j.id),
        }
      )
    }

    // Delete in transaction (will cascade to sessions)
    let deletedCount = 0
    await withTransaction(db, async (tx) => {
      const result = await tx.delete(jobs)
        .where(inArray(jobs.id, jobIds))
        .returning()

      deletedCount = result.length
    })

    return NextResponse.json(
      {
        success: true,
        deleted: deletedCount,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/jobs/bulk - Bulk update jobs
 */
export async function PATCH(request: NextRequest) {
  try {
    const validation = await validateRequest(request, bulkUpdateJobsSchema)
    if (!validation.success) return validation.response

    const { jobIds, updates } = validation.data

    // Validate at least one update field provided
    if (Object.keys(updates).length === 0) {
      throw new ApiError(
        'No update fields provided',
        ErrorCodes.VALIDATION_ERROR,
        400
      )
    }

    // Update in transaction
    let updatedCount = 0
    await withTransaction(db, async (tx) => {
      const result = await tx.update(jobs)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(inArray(jobs.id, jobIds))
        .returning()

      updatedCount = result.length
    })

    return NextResponse.json(
      {
        success: true,
        updated: updatedCount,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
