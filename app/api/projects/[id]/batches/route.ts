import { NextRequest, NextResponse } from 'next/server'
import { createBatchFromCSV } from '@/app/(authenticated)/projects/[id]/batches/actions'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { csvContent, batchName, batchDescription } = body

    if (!csvContent || !batchName) {
      return NextResponse.json(
        { message: 'CSV content and batch name are required' },
        { status: 400 }
      )
    }

    const batch = await createBatchFromCSV(
      params.id,
      csvContent,
      batchName,
      batchDescription
    )

    return NextResponse.json(batch)
  } catch (error: any) {
    console.error('Batch creation error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to create batch' },
      { status: 500 }
    )
  }
}
