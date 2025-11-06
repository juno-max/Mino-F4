import { NextRequest, NextResponse } from 'next/server'
import { db, batches, jobs } from '@/db'
import { inArray } from 'drizzle-orm'
import { getUserWithOrganization } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()
    const body = await request.json()
    const { batchIds } = body

    if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
      return NextResponse.json(
        { error: { message: 'batchIds array is required' } },
        { status: 400 }
      )
    }

    // Verify all batches belong to user's organization
    const batchesToDelete = await db.query.batches.findMany({
      where: inArray(batches.id, batchIds),
      with: {
        project: {
          columns: {
            organizationId: true,
          },
        },
      },
    })

    // Check if all batches exist
    if (batchesToDelete.length !== batchIds.length) {
      return NextResponse.json(
        { error: { message: 'Some batches not found' } },
        { status: 404 }
      )
    }

    // Check if all batches belong to user's organization
    const unauthorizedBatch = batchesToDelete.find(
      (batch) => batch.project.organizationId !== user.organizationId
    )

    if (unauthorizedBatch) {
      return NextResponse.json(
        { error: { message: 'Unauthorized: Cannot delete batches from other organizations' } },
        { status: 403 }
      )
    }

    // Delete all jobs for these batches first (cascade)
    await db.delete(jobs).where(inArray(jobs.batchId, batchIds))

    // Delete the batches
    await db.delete(batches).where(inArray(batches.id, batchIds))

    return NextResponse.json({
      success: true,
      deletedCount: batchIds.length,
      message: `Successfully deleted ${batchIds.length} batch${batchIds.length === 1 ? '' : 'es'}`,
    })
  } catch (error: any) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: { message: error.message || 'Failed to delete batches' } },
      { status: 500 }
    )
  }
}
