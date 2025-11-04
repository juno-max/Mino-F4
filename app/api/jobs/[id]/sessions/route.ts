import { NextRequest, NextResponse } from 'next/server'
import { db, sessions, jobs } from '@/db'
import { eq, desc } from 'drizzle-orm'

// GET /api/jobs/[id]/sessions - Get all sessions for a job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobSessions = await db.query.sessions.findMany({
      where: eq(sessions.jobId, params.id),
      orderBy: [desc(sessions.createdAt)],
    })

    return NextResponse.json(jobSessions)
  } catch (error: any) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to get sessions' },
      { status: 500 }
    )
  }
}

// POST /api/jobs/[id]/sessions - Create a new session for a job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the job
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, params.id),
    })

    if (!job) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 })
    }

    // Get existing sessions count to determine session number
    const existingSessions = await db.query.sessions.findMany({
      where: eq(sessions.jobId, params.id),
    })

    const sessionNumber = existingSessions.length + 1

    // Create new session
    const [newSession] = await db
      .insert(sessions)
      .values({
        jobId: params.id,
        sessionNumber,
        status: 'pending',
      })
      .returning()

    return NextResponse.json(newSession, { status: 201 })
  } catch (error: any) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to create session' },
      { status: 500 }
    )
  }
}
