import { NextRequest, NextResponse } from 'next/server'
import { db, jobs, sessions } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { validateRequest, validateParams, handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { updateJobSchema, jobIdSchema } from '@/lib/validation-schemas'

// GET /api/jobs/[id] - Get job details with all sessions
export async function GET(
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

    // Get all sessions for this job
    const jobSessions = await db.query.sessions.findMany({
      where: eq(sessions.jobId, id),
      orderBy: [desc(sessions.sessionNumber)],
    })

    return NextResponse.json({
      job,
      sessions: jobSessions,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/jobs/[id] - Update job status
export async function PATCH(
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

    // Validate request body
    const bodyValidation = await validateRequest(request, updateJobSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    const {
      status,
      groundTruthData,
      hasGroundTruth,
      isEvaluated,
      evaluationResult,
    } = bodyValidation.data

    const updateData: any = {}

    if (status) {
      updateData.status = status
      if (status === 'running') {
        updateData.lastRunAt = new Date()
      }
    }
    if (groundTruthData !== undefined) updateData.groundTruthData = groundTruthData
    if (hasGroundTruth !== undefined) updateData.hasGroundTruth = hasGroundTruth
    if (isEvaluated !== undefined) updateData.isEvaluated = isEvaluated
    if (evaluationResult !== undefined) updateData.evaluationResult = evaluationResult

    const [updatedJob] = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, id))
      .returning()

    if (!updatedJob) {
      return notFoundResponse('Job')
    }

    return NextResponse.json(updatedJob)
  } catch (error) {
    return handleApiError(error)
  }
}
