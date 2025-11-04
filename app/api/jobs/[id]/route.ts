import { NextRequest, NextResponse } from 'next/server'
import { db, jobs, sessions } from '@/db'
import { eq, desc } from 'drizzle-orm'

// GET /api/jobs/[id] - Get job details with all sessions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, params.id),
    })

    if (!job) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 })
    }

    // Get all sessions for this job
    const jobSessions = await db.query.sessions.findMany({
      where: eq(sessions.jobId, params.id),
      orderBy: [desc(sessions.createdAt)],
    })

    return NextResponse.json({
      ...job,
      sessions: jobSessions,
    })
  } catch (error: any) {
    console.error('Get job error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to get job' },
      { status: 500 }
    )
  }
}

// PATCH /api/jobs/[id] - Update job status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      status,
      groundTruthData,
      isEvaluated,
      evaluationResult,
    } = body

    const updateData: any = {}

    if (status) {
      updateData.status = status
      if (status === 'running') {
        updateData.lastRunAt = new Date()
      }
    }
    if (groundTruthData !== undefined) updateData.groundTruthData = groundTruthData
    if (isEvaluated !== undefined) updateData.isEvaluated = isEvaluated
    if (evaluationResult !== undefined) updateData.evaluationResult = evaluationResult

    const [updatedJob] = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, params.id))
      .returning()

    if (!updatedJob) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(updatedJob)
  } catch (error: any) {
    console.error('Update job error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to update job' },
      { status: 500 }
    )
  }
}
