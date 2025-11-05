import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { batches, jobs, groundTruthMetricsHistory, groundTruthColumnMetrics } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * POST /api/batches/[id]/ground-truth/snapshot
 * Create a manual snapshot of current ground truth metrics
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params
    const body = await request.json()
    const { notes, executionId, instructionVersionId } = body

    // Get current metrics
    const columnMetrics = await db.query.groundTruthColumnMetrics.findMany({
      where: eq(groundTruthColumnMetrics.batchId, batchId),
    })

    if (columnMetrics.length === 0) {
      return NextResponse.json(
        { error: 'No ground truth metrics found for this batch' },
        { status: 400 }
      )
    }

    // Calculate overall stats
    const totalJobs = columnMetrics[0].totalJobs
    const jobsEvaluated = columnMetrics[0].jobsWithGroundTruth
    const exactMatches = columnMetrics.reduce((sum, m) => sum + m.exactMatches, 0)
    const partialMatches = columnMetrics.reduce((sum, m) => sum + m.partialMatches, 0)

    // Get overall accuracy from batch
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, batchId),
    })

    const overallAccuracy = batch?.overallAccuracy || 0

    // Create snapshot
    const [snapshot] = await db.insert(groundTruthMetricsHistory).values({
      batchId,
      executionId: executionId || null,
      overallAccuracy,
      totalJobs,
      jobsEvaluated,
      exactMatches,
      partialMatches,
      columnMetrics: columnMetrics.map(m => ({
        columnName: m.columnName,
        accuracy: m.accuracyPercentage || 0,
        exactMatches: m.exactMatches,
        mismatches: m.mismatches,
      })),
      instructionVersionId: instructionVersionId || null,
      notes: notes || null,
    }).returning()

    return NextResponse.json({
      success: true,
      snapshot,
    })
  } catch (error: any) {
    console.error('Create snapshot error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create snapshot' },
      { status: 500 }
    )
  }
}

/**
 * Auto-create snapshot after execution completes
 * Called by execution completion hook
 */
export async function createAutoSnapshot(
  batchId: string,
  executionId: string,
  instructionVersionId?: string
) {
  try {
    // Get current metrics
    const columnMetrics = await db.query.groundTruthColumnMetrics.findMany({
      where: eq(groundTruthColumnMetrics.batchId, batchId),
    })

    if (columnMetrics.length === 0) {
      return null
    }

    const totalJobs = columnMetrics[0].totalJobs
    const jobsEvaluated = columnMetrics[0].jobsWithGroundTruth
    const exactMatches = columnMetrics.reduce((sum, m) => sum + m.exactMatches, 0)
    const partialMatches = columnMetrics.reduce((sum, m) => sum + m.partialMatches, 0)

    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, batchId),
    })

    const overallAccuracy = batch?.overallAccuracy || 0

    const [snapshot] = await db.insert(groundTruthMetricsHistory).values({
      batchId,
      executionId,
      overallAccuracy,
      totalJobs,
      jobsEvaluated,
      exactMatches,
      partialMatches,
      columnMetrics: columnMetrics.map(m => ({
        columnName: m.columnName,
        accuracy: m.accuracyPercentage || 0,
        exactMatches: m.exactMatches,
        mismatches: m.mismatches,
      })),
      instructionVersionId: instructionVersionId || null,
      notes: 'Auto-snapshot after execution',
    }).returning()

    return snapshot
  } catch (error) {
    console.error('Auto-snapshot error:', error)
    return null
  }
}
