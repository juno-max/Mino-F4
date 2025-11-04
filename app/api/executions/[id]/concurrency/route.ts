import { NextRequest, NextResponse } from 'next/server'
import { db, executions } from '@/db'
import { eq } from 'drizzle-orm'
import { publishConcurrencyChanged } from '@/lib/execution-events'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST /api/executions/[id]/concurrency - Adjust execution concurrency
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = params.id
    const body = await request.json()
    const { concurrency } = body

    if (typeof concurrency !== 'number' || concurrency < 1 || concurrency > 20) {
      return NextResponse.json(
        { message: 'Concurrency must be a number between 1 and 20' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get execution to check current status and concurrency
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })

    if (!execution) {
      return NextResponse.json(
        { message: 'Execution not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const oldConcurrency = execution.concurrency || 5

    // Update execution concurrency
    const now = new Date()
    const [updatedExecution] = await db
      .update(executions)
      .set({
        concurrency,
        updatedAt: now,
      })
      .where(eq(executions.id, executionId))
      .returning()

    // Publish concurrency change event to WebSocket clients
    publishConcurrencyChanged({
      executionId: updatedExecution.id,
      oldConcurrency,
      newConcurrency: concurrency,
    })

    console.log(`[API] Execution ${executionId} concurrency changed: ${oldConcurrency} → ${concurrency}`)

    return NextResponse.json(
      {
        success: true,
        execution: updatedExecution,
        message: `Concurrency updated from ${oldConcurrency} to ${concurrency}`,
      },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Error adjusting concurrency:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to adjust concurrency' },
      { status: 500, headers: corsHeaders }
    )
  }
}
