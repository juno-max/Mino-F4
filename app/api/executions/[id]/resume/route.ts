import { NextRequest, NextResponse } from 'next/server'
import { db, executions } from '@/db'
import { eq } from 'drizzle-orm'
import { publishExecutionResumed } from '@/lib/execution-events'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST /api/executions/[id]/resume - Resume a paused execution
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

    if (execution.status !== 'paused') {
      return NextResponse.json(
        { message: `Cannot resume execution with status: ${execution.status}` },
        { status: 400, headers: corsHeaders }
      )
    }

    // Update execution status to running
    const now = new Date()
    const [updatedExecution] = await db
      .update(executions)
      .set({
        status: 'running',
        resumedAt: now,
        updatedAt: now,
      })
      .where(eq(executions.id, executionId))
      .returning()

    // Publish resume event to WebSocket clients
    publishExecutionResumed({
      executionId: updatedExecution.id,
    })

    console.log(`[API] Execution ${executionId} resumed`)

    return NextResponse.json(
      {
        success: true,
        execution: updatedExecution,
      },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Error resuming execution:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to resume execution' },
      { status: 500, headers: corsHeaders }
    )
  }
}
