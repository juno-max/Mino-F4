import { NextRequest, NextResponse } from 'next/server'
import { db, sessions } from '@/db'
import { eq } from 'drizzle-orm'

// GET /api/runs?job_id={id} - List sessions for a job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json(
        { message: 'job_id query parameter is required' },
        { status: 400 }
      )
    }

    const jobSessions = await db.query.sessions.findMany({
      where: eq(sessions.jobId, jobId),
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
    })

    // Transform to match mino-v2 expected format
    const transformedSessions = jobSessions.map(session => ({
      id: session.id,
      job_id: session.jobId,
      status: session.status.toUpperCase(),
      type: 'NORMAL', // Default type
      started_at: session.startedAt?.toISOString() || null,
      finished_at: session.completedAt?.toISOString() || null,
      input_json: {},
      steps: '',
      result_json: session.extractedData || null,
      expected_json: null,
      validation_passed: session.status === 'completed',
      error_message: session.errorMessage,
      screenshots: session.screenshots || null,
      friday_result: null,
      streaming_url: session.streamingUrl,
      created_at: session.createdAt?.toISOString() || new Date().toISOString(),
    }))

    return NextResponse.json(transformedSessions)
  } catch (error: any) {
    console.error('Error fetching runs:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch runs' },
      { status: 500 }
    )
  }
}
