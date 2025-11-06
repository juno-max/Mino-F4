import { NextRequest, NextResponse } from 'next/server'
import { db, batches } from '@/db'
import { eq } from 'drizzle-orm'
import { validateRequest, validateParams, handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { updateBatchSchema, batchIdSchema } from '@/lib/validation-schemas'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/batches/{id} - Get a single batch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate params
    const paramsValidation = await validateParams(params, batchIdSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id } = paramsValidation.data

    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, id),
    })

    if (!batch) {
      return notFoundResponse('Batch')
    }

    return NextResponse.json(batch, { headers: corsHeaders })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/batches/{id} - Update a batch
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate params
    const paramsValidation = await validateParams(params, batchIdSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id } = paramsValidation.data

    // Validate request body
    const bodyValidation = await validateRequest(request, updateBatchSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const [updated] = await db.update(batches)
      .set({
        ...bodyValidation.data,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, id))
      .returning()

    if (!updated) {
      return notFoundResponse('Batch')
    }

    return NextResponse.json(updated, { headers: corsHeaders })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/batches/{id} - Delete a batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate params
    const paramsValidation = await validateParams(params, batchIdSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id } = paramsValidation.data

    // Check if batch exists before deleting
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, id),
    })

    if (!batch) {
      return notFoundResponse('Batch')
    }

    await db.delete(batches).where(eq(batches.id, id))

    return NextResponse.json(
      { message: 'Batch deleted successfully' },
      { headers: corsHeaders }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
