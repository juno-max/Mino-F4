import { NextRequest, NextResponse } from 'next/server'
import { db, executions } from '@/db'
import { eq } from 'drizzle-orm'
import { publishConcurrencyChanged } from '@/lib/execution-events'
import { validateRequest, validateParams, handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { updateConcurrencySchema, executionIdSchema } from '@/lib/validation-schemas'

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate route parameters
    const paramsValidation = await validateParams(params, executionIdSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id: executionId } = paramsValidation.data

    // Validate request body
    const bodyValidation = await validateRequest(request, updateConcurrencySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    const { concurrency } = bodyValidation.data

    // Get execution to check current status and concurrency
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })

    if (!execution) {
      return notFoundResponse('Execution')
    }

    const oldConcurrency = execution.concurrency || 5

    // Update execution concurrency
    const [updatedExecution] = await db
      .update(executions)
      .set({
        concurrency,
        lastActivityAt: new Date(),
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
  } catch (error) {
    console.error('Error adjusting concurrency:', error)
    return handleApiError(error)
  }
}
