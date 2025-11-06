import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { batches, groundTruthMetricsHistory, groundTruthColumnMetrics } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

/**
 * GET /api/batches/[id]/ground-truth/trends
 * Returns time-series accuracy data for charting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params

    // Get all historical metrics for this batch
    const history = await db.query.groundTruthMetricsHistory.findMany({
      where: eq(groundTruthMetricsHistory.batchId, batchId),
      orderBy: [desc(groundTruthMetricsHistory.createdAt)],
      with: {
        execution: true,
        instructionVersion: true,
      },
    })

    // Calculate summary statistics
    const accuracies = history.map(h => h.overallAccuracy).filter(a => a !== null)

    const summary = {
      firstRecorded: history.length > 0 ? history[history.length - 1].createdAt.toISOString() : null,
      latestRecorded: history.length > 0 ? history[0].createdAt.toISOString() : null,
      averageAccuracy: accuracies.length > 0
        ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
        : 0,
      bestAccuracy: accuracies.length > 0 ? Math.max(...accuracies) : 0,
      worstAccuracy: accuracies.length > 0 ? Math.min(...accuracies) : 0,
      trend: calculateTrend(accuracies),
      improvementRate: calculateImprovementRate(history),
    }

    // Format data points for chart
    const dataPoints = history.reverse().map(h => ({
      timestamp: h.createdAt.toISOString(),
      executionId: h.executionId,
      overallAccuracy: h.overallAccuracy,
      columnMetrics: h.columnMetrics || [],
      instructionVersion: h.instructionVersion?.versionNumber,
      notes: h.notes,
    }))

    return NextResponse.json({
      dataPoints,
      summary,
    })
  } catch (error: any) {
    console.error('Get trends error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get trends' },
      { status: 500 }
    )
  }
}

/**
 * Calculate trend direction based on linear regression
 */
function calculateTrend(accuracies: number[]): 'improving' | 'declining' | 'stable' {
  if (accuracies.length < 2) return 'stable'

  // Simple linear regression
  const n = accuracies.length
  const sumX = (n * (n - 1)) / 2
  const sumY = accuracies.reduce((sum, y) => sum + y, 0)
  const sumXY = accuracies.reduce((sum, y, i) => sum + i * y, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  if (slope > 0.5) return 'improving'
  if (slope < -0.5) return 'declining'
  return 'stable'
}

/**
 * Calculate improvement rate (percentage points per day)
 */
function calculateImprovementRate(history: any[]): number {
  if (history.length < 2) return 0

  const first = history[history.length - 1]
  const last = history[0]

  const accDelta = last.overallAccuracy - first.overallAccuracy
  const timeDelta = (new Date(last.createdAt).getTime() - new Date(first.createdAt).getTime()) / (1000 * 60 * 60 * 24)

  if (timeDelta === 0) return 0

  return accDelta / timeDelta
}
