import { NextRequest, NextResponse } from 'next/server'
import { db, batches } from '@/db'
import { eq } from 'drizzle-orm'

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
  { params }: { params: { id: string } }
) {
  try {
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, params.id),
    })

    if (!batch) {
      return NextResponse.json(
        { message: 'Batch not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json(batch, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error fetching batch:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch batch' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// PUT /api/batches/{id} - Update a batch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const [updated] = await db.update(batches)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, params.id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { message: 'Batch not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json(updated, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error updating batch:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to update batch' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// DELETE /api/batches/{id} - Delete a batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(batches).where(eq(batches.id, params.id))
    return NextResponse.json(
      { message: 'Batch deleted successfully' },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Error deleting batch:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to delete batch' },
      { status: 500, headers: corsHeaders }
    )
  }
}
