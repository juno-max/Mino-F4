import { NextRequest, NextResponse } from 'next/server'
import { db, executions } from '@/db'
import { eq } from 'drizzle-orm'
import { publishExecutionPaused } from '@/lib/execution-events'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST /api/executions/[id]/pause - Pause a running execution
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = params.id

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

    if (execution.status !== 'running') {
      return NextResponse.json(
        { message: `Cannot pause execution with status: ${execution.status}` },
        { status: 400, headers: corsHeaders }
      )
    }

    // Update execution status to paused
    const now = new Date()
    const [updatedExecution] = await db
      .update(executions)
      .set({
        status: 'paused',
        pausedAt: now,
        updatedAt: now,
      })
      .where(eq(executions.id, executionId))
      .returning()

    // Publish pause event to WebSocket clients
    publishExecutionPaused({
      executionId: updatedExecution.id,
    })

    console.log(`[API] Execution ${executionId} paused`)

    return NextResponse.json(
      {
        success: true,
        execution: updatedExecution,
      },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Error pausing execution:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to pause execution' },
      { status: 500, headers: corsHeaders }
    )
  }
}
