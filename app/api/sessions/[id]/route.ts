import { NextRequest, NextResponse } from 'next/server'
import { db, sessions, jobs } from '@/db'
import { eq } from 'drizzle-orm'

// GET /api/sessions/[id] - Get session details
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
      return NextResponse.json({ message: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error: any) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to get session' },
      { status: 500 }
    )
  }
}

// PATCH /api/sessions/[id] - Update session (status, data, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      status,
      extractedData,
      rawOutput,
      errorMessage,
      failureReason,
      executionTimeMs,
      screenshots,
    } = body

    const updateData: any = {}

    if (status) updateData.status = status
    if (extractedData !== undefined) updateData.extractedData = extractedData
    if (rawOutput !== undefined) updateData.rawOutput = rawOutput
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage
    if (failureReason !== undefined) updateData.failureReason = failureReason
    if (executionTimeMs !== undefined) updateData.executionTimeMs = executionTimeMs
    if (screenshots !== undefined) updateData.screenshots = screenshots

    if (status === 'running' && !updateData.startedAt) {
      updateData.startedAt = new Date()
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date()
    }

    const [updatedSession] = await db
      .update(sessions)
      .set(updateData)
      .where(eq(sessions.id, params.id))
      .returning()

    if (!updatedSession) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(updatedSession)
  } catch (error: any) {
    console.error('Update session error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to update session' },
      { status: 500 }
    )
  }
}
