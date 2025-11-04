import { NextRequest, NextResponse } from 'next/server'
import { db, sessions, jobs } from '@/db'
import { eq } from 'drizzle-orm'

// GET /api/runs/{id} - Get a single session (run)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, params.id),
      with: {
        job: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { message: 'Run not found' },
        { status: 404 }
      )
    }

    // Transform to match mino-v2 expected format
    const transformed = {
      id: session.id,
      job_id: session.jobId,
      status: session.status.toUpperCase(),
      type: 'NORMAL', // Default type
      started_at: session.startedAt?.toISOString() || null,
      finished_at: session.completedAt?.toISOString() || null,
      input_json: {},
      steps: session.rawOutput || '',
      result_json: session.extractedData || null,
      expected_json: (session.job as any)?.groundTruthData || null,
      validation_passed: session.status === 'completed',
      error_message: session.errorMessage,
      screenshots: session.screenshots || null,
      friday_result: null,
      streaming_url: session.streamingUrl,
      created_at: session.createdAt?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json(transformed)
  } catch (error: any) {
    console.error('Error fetching run:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch run' },
      { status: 500 }
    )
  }
}
