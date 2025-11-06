import { NextRequest, NextResponse } from 'next/server'
import { db, executions } from '@/db'
import { eq } from 'drizzle-orm'
import { publishExecutionResumed } from '@/lib/execution-events'
import { resumeExecution } from '@/lib/job-executor'
import { handleApiError } from '@/lib/api-helpers'
import { ErrorCodes } from '@/lib/error-codes'

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

    // Use the centralized resume function that actually restarts job processing
    const result = await resumeExecution(executionId)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: result.error?.includes('not found') ? ErrorCodes.NOT_FOUND : ErrorCodes.VALIDATION_ERROR,
        },
        { status: result.error?.includes('not found') ? 404 : 400, headers: corsHeaders }
      )
    }

    // Get updated execution to return
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })

    // Publish resume event to WebSocket clients
    publishExecutionResumed({
      executionId,
    })

    console.log(`[API] Execution ${executionId} resumed with ${result.resumedJobs} jobs`)

    return NextResponse.json(
      {
        success: true,
        execution,
        resumedJobs: result.resumedJobs,
      },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Error resuming execution:', error)
    return handleApiError(error)
  }
}
