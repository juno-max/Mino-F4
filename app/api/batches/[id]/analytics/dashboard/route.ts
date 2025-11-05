import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { batches, jobs, groundTruthColumnMetrics, groundTruthMetricsHistory } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

/**
 * GET /api/batches/[id]/analytics/dashboard
 * Single endpoint that returns all dashboard data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params

    // Get batch info
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, batchId),
    })

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Get all jobs for this batch
    const allJobs = await db.query.jobs.findMany({
      where: eq(jobs.batchId, batchId),
      with: {
        sessions: {
          orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
          limit: 1,
        },
      },
    })

    // Get column metrics
    const columnMetrics = await db.query.groundTruthColumnMetrics.findMany({
      where: eq(groundTruthColumnMetrics.batchId, batchId),
    })

    // Get recent history for trend
    const recentHistory = await db.query.groundTruthMetricsHistory.findMany({
      where: eq(groundTruthMetricsHistory.batchId, batchId),
      orderBy: [desc(groundTruthMetricsHistory.createdAt)],
      limit: 7, // Last 7 snapshots
    })

    // Calculate overview stats
    const jobsWithGT = allJobs.filter(j => j.hasGroundTruth).length
    const evaluatedJobs = allJobs.filter(j => j.isEvaluated).length
    const passedJobs = allJobs.filter(j => j.evaluationResult === 'pass').length
    const failedJobs = allJobs.filter(j => j.evaluationResult === 'fail').length

    const overallAccuracy = batch.overallAccuracy || 0

    // Calculate delta from last run
    let deltaFromLast: number | null = null
    if (recentHistory.length >= 2) {
      const latest = recentHistory[0].overallAccuracy
      const previous = recentHistory[1].overallAccuracy
      deltaFromLast = latest - previous
    }

    // Determine status health
    const statusHealth =
      overallAccuracy >= 90 ? 'excellent' :
      overallAccuracy >= 75 ? 'good' :
      overallAccuracy >= 60 ? 'needs_attention' :
      'critical'

    const overview = {
      overallAccuracy,
      totalJobs: allJobs.length,
      jobsWithGroundTruth: jobsWithGT,
      statusHealth,
      deltaFromLast,
    }

    // Calculate accuracy distribution
    const distributionRanges = [
      { label: '90-100%', min: 90, max: 100 },
      { label: '70-89%', min: 70, max: 89 },
      { label: '50-69%', min: 50, max: 69 },
      { label: '<50%', min: 0, max: 49 },
    ]

    const distribution = distributionRanges.map(range => {
      const jobsInRange = allJobs.filter(job => {
        if (!job.isEvaluated || !job.hasGroundTruth) return false

        // Calculate job-level accuracy
        const latestSession = job.sessions[0]
        if (!latestSession?.extractedData || !job.groundTruthData) return false

        const extractedData = latestSession.extractedData as Record<string, any>
        const gtData = job.groundTruthData as Record<string, any>

        const gtFields = Object.keys(gtData)
        if (gtFields.length === 0) return false

        const matches = gtFields.filter(field => {
          const extracted = String(extractedData[field] || '').toLowerCase().trim()
          const expected = String(gtData[field] || '').toLowerCase().trim()
          return extracted === expected
        }).length

        const accuracy = (matches / gtFields.length) * 100
        return accuracy >= range.min && accuracy <= range.max
      })

      return {
        label: range.label,
        count: jobsInRange.length,
        percentage: allJobs.length > 0 ? (jobsInRange.length / allJobs.length) * 100 : 0,
        jobIds: jobsInRange.map(j => j.id),
      }
    })

    // Calculate column performance with trends
    const columnPerformance = columnMetrics.map(col => {
      const accuracy = col.accuracyPercentage || 0
      const status =
        accuracy >= 90 ? 'excellent' :
        accuracy >= 75 ? 'good' :
        accuracy >= 60 ? 'needs_attention' :
        'critical'

      // Check trend from history
      let trend: 'up' | 'down' | 'stable' | null = null
      if (recentHistory.length >= 2) {
        const latest = recentHistory[0].columnMetrics?.find(c => c.columnName === col.columnName)
        const previous = recentHistory[1].columnMetrics?.find(c => c.columnName === col.columnName)

        if (latest && previous) {
          const delta = latest.accuracy - previous.accuracy
          if (delta > 2) trend = 'up'
          else if (delta < -2) trend = 'down'
          else trend = 'stable'
        }
      }

      return {
        columnName: col.columnName,
        accuracy,
        status,
        exactMatches: col.exactMatches,
        mismatches: col.mismatches,
        trend,
      }
    }).sort((a, b) => a.accuracy - b.accuracy) // Sort by accuracy (worst first)

    // Extract common errors
    const commonErrors: Array<{
      errorType: string
      count: number
      affectedColumns: string[]
      exampleJobIds: string[]
    }> = []

    const errorMap = new Map<string, {
      count: number
      columns: Set<string>
      examples: Set<string>
    }>()

    columnMetrics.forEach(col => {
      if (col.commonErrors) {
        const errors = col.commonErrors as Array<{
          errorType: string
          count: number
          examples: string[]
        }>

        errors.forEach(err => {
          if (!errorMap.has(err.errorType)) {
            errorMap.set(err.errorType, {
              count: 0,
              columns: new Set(),
              examples: new Set(),
            })
          }

          const existing = errorMap.get(err.errorType)!
          existing.count += err.count
          existing.columns.add(col.columnName)
          err.examples.forEach(ex => existing.examples.add(ex))
        })
      }
    })

    errorMap.forEach((data, errorType) => {
      commonErrors.push({
        errorType,
        count: data.count,
        affectedColumns: Array.from(data.columns),
        exampleJobIds: Array.from(data.examples).slice(0, 3),
      })
    })

    // Sort errors by count
    commonErrors.sort((a, b) => b.count - a.count)

    // Format recent trend
    const recentTrend = {
      dataPoints: recentHistory.reverse().map(h => ({
        date: new Date(h.createdAt).toLocaleDateString(),
        accuracy: h.overallAccuracy,
      })),
      trendDirection:
        recentHistory.length >= 2
          ? recentHistory[recentHistory.length - 1].overallAccuracy > recentHistory[0].overallAccuracy
            ? 'improving'
            : recentHistory[recentHistory.length - 1].overallAccuracy < recentHistory[0].overallAccuracy
            ? 'declining'
            : 'stable'
          : 'stable',
    }

    return NextResponse.json({
      overview,
      distribution,
      columnPerformance,
      commonErrors,
      recentTrend,
    })
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get dashboard data' },
      { status: 500 }
    )
  }
}
