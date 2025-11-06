import { NextRequest, NextResponse } from 'next/server'
import { db, jobs, sessions } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { validateParams, handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { jobIdSchema } from '@/lib/validation-schemas'

// POST /api/jobs/[id]/retry - Retry a job by creating a new session and queuing it
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate params
    const paramsValidation = await validateParams(params, jobIdSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id } = paramsValidation.data

    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, id),
    })

    if (!job) {
      return notFoundResponse('Job')
    }

    // Get the highest session number
    const latestSession = await db.query.sessions.findFirst({
      where: eq(sessions.jobId, id),
      orderBy: [desc(sessions.sessionNumber)],
    })

    const nextSessionNumber = (latestSession?.sessionNumber || 0) + 1

    // Create a new session for retry
    const [newSession] = await db
      .insert(sessions)
      .values({
        jobId: id,
        sessionNumber: nextSessionNumber,
        status: 'pending',
        detailedStatus: null,
        blockedReason: null,
        extractedData: null,
        fieldsExtracted: [],
        fieldsMissing: [],
        completionPercentage: 0,
        rawOutput: null,
        errorMessage: null,
        screenshots: null,
        streamingUrl: null,
        failureReason: null,
        executionTimeMs: null,
        startedAt: null,
        completedAt: null,
      })
      .returning()

    // Update job status to queued
    await db
      .update(jobs)
      .set({
        status: 'queued',
        retryCount: (job.retryCount || 0) + 1,
      })
      .where(eq(jobs.id, id))

    return NextResponse.json({
      success: true,
      session: newSession,
      message: `Job ${id} queued for retry (Session #${nextSessionNumber})`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
