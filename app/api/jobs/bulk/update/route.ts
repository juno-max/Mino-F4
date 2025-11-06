import { NextRequest, NextResponse } from 'next/server'
import { db, jobs } from '@/db'
import { inArray } from 'drizzle-orm'
import { validateRequest, handleApiError } from '@/lib/api-helpers'
import { bulkUpdateJobsSchema } from '@/lib/validation-schemas'
import { ErrorCodes } from '@/lib/error-codes'

/**
 * POST /api/jobs/bulk/update
 * Bulk update jobs - update status or ground truth data for multiple jobs
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, bulkUpdateJobsSchema)
    if (!validation.success) {
      return validation.response
    }

    const { jobIds, updates } = validation.data

    // Verify at least one update field is provided
    if (!updates.status && !updates.groundTruthData) {
      return NextResponse.json(
        {
          error: 'At least one update field (status or groundTruthData) must be provided',
          code: ErrorCodes.VALIDATION_ERROR,
        },
        { status: 400 }
      )
    }

    // Verify all jobs exist
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

    const foundJobIds = existingJobs.map(job => job.id)
    const notFoundJobIds = jobIds.filter(id => !foundJobIds.includes(id))

    // Build update object
    const updateData: any = {}

    if (updates.status) {
      updateData.status = updates.status

      // Set completion time if marking as completed
      if (updates.status === 'completed') {
        updateData.completedAt = new Date()
      }

      // Set start time if marking as running
      if (updates.status === 'running') {
        updateData.startedAt = new Date()
        updateData.lastRunAt = new Date()
      }
    }

    if (updates.groundTruthData) {
      updateData.groundTruthData = updates.groundTruthData
      updateData.hasGroundTruth = Object.keys(updates.groundTruthData).length > 0
    }

    // Perform bulk update
    await db
      .update(jobs)
      .set(updateData)
      .where(inArray(jobs.id, foundJobIds))

    console.log(`[BulkUpdate] Updated ${foundJobIds.length} jobs`)

    return NextResponse.json({
      success: true,
      updatedCount: foundJobIds.length,
      updatedJobIds: foundJobIds,
      notFoundJobIds: notFoundJobIds.length > 0 ? notFoundJobIds : undefined,
      updates: updateData,
      message: `Successfully updated ${foundJobIds.length} job(s)`,
    })
  } catch (error) {
    console.error('[BulkUpdate] Error:', error)
    return handleApiError(error)
  }
}
