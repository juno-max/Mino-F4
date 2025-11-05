import { NextRequest, NextResponse } from 'next/server'
import { db, executions } from '@/db'
import { eq } from 'drizzle-orm'
import { publishExecutionStopped } from '@/lib/execution-events'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST /api/executions/[id]/stop - Stop a running or paused execution
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = params.id
    const body = await request.json().catch(() => ({}))
    const { reason = 'User stopped execution' } = body

    // Get execution to check current status
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })

    if (!execution) {
      return NextResponse.json(
        { message: 'Execution not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    if (execution.status === 'completed' || execution.status === 'stopped') {
      return NextResponse.json(
        { message: `Cannot stop execution with status: ${execution.status}` },
        { status: 400, headers: corsHeaders }
      )
    }

    // Update execution status to stopped
    const now = new Date()
    const [updatedExecution] = await db
      .update(executions)
      .set({
        status: 'stopped',
        stoppedAt: now,
        stopReason: reason,
        completedAt: now,
        lastActivityAt: now,
      })
      .where(eq(executions.id, executionId))
      .returning()

    // Publish stop event to WebSocket clients
    publishExecutionStopped({
      executionId: updatedExecution.id,
      reason,
    })

    console.log(`[API] Execution ${executionId} stopped: ${reason}`)

    return NextResponse.json(
      {
        success: true,
        execution: updatedExecution,
      },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Error stopping execution:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to stop execution' },
      { status: 500, headers: corsHeaders }
    )
  }
}
