import { NextRequest, NextResponse } from 'next/server'
import { db, jobs, sessions } from '@/db'
import { inArray, eq } from 'drizzle-orm'
import { validateRequest, handleApiError } from '@/lib/api-helpers'
import { bulkDeleteJobsSchema } from '@/lib/validation-schemas'
import { ErrorCodes } from '@/lib/error-codes'

/**
 * POST /api/jobs/bulk/delete
 * Bulk delete jobs and their associated sessions
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, bulkDeleteJobsSchema)
    if (!validation.success) {
      return validation.response
    }

    const { jobIds, batchId } = validation.data

    // Verify all jobs exist (and optionally belong to the specified batch)
    const conditions = [inArray(jobs.id, jobIds)]
    if (batchId) {
      conditions.push(eq(jobs.batchId, batchId))
    }

    const existingJobs = await db.query.jobs.findMany({
      where: inArray(jobs.id, jobIds),
    })

    if (existingJobs.length === 0) {
      return NextResponse.json(
        {
          error: 'No jobs found with the provided IDs',
          code: ErrorCodes.NOT_FOUND,
        },
        { status: 404 }
      )
    }

    // Filter jobs that belong to the specified batch if batchId is provided
    const jobsToDelete = batchId
      ? existingJobs.filter(job => job.batchId === batchId)
      : existingJobs

    if (jobsToDelete.length === 0) {
      return NextResponse.json(
        {
          error: 'No jobs found in the specified batch',
          code: ErrorCodes.NOT_FOUND,
        },
        { status: 404 }
      )
    }

    const jobIdsToDelete = jobsToDelete.map(job => job.id)

    // Use a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Delete all associated sessions first (foreign key constraint)
      await tx.delete(sessions).where(inArray(sessions.jobId, jobIdsToDelete))

      // Delete the jobs
      await tx.delete(jobs).where(inArray(jobs.id, jobIdsToDelete))
    })

    console.log(`[BulkDelete] Deleted ${jobIdsToDelete.length} jobs and their sessions`)

    return NextResponse.json({
      success: true,
      deletedCount: jobIdsToDelete.length,
      deletedJobIds: jobIdsToDelete,
      message: `Successfully deleted ${jobIdsToDelete.length} job(s)`,
    })
  } catch (error) {
    console.error('[BulkDelete] Error:', error)
    return handleApiError(error)
  }
}
