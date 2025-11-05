import { db, executions, jobs, sessions, groundTruthMetricsHistory, batches } from '@/db'
import { eq } from 'drizzle-orm'

/**
 * Auto-create a metrics snapshot after execution completion
 * This tracks accuracy trends over time
 */
export async function createMetricsSnapshot(executionId: string) {
  try {
    console.log('[MetricsSnapshot] Creating snapshot for execution:', executionId)

    // Get execution details
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })

    if (!execution) {
      console.error('[MetricsSnapshot] Execution not found:', executionId)
      return
    }

    // Get batch to check if it has ground truth
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, execution.batchId),
    })

    if (!batch || !batch.hasGroundTruth) {
      console.log('[MetricsSnapshot] Batch has no ground truth, skipping snapshot')
      return
    }

    // Get all jobs for this execution
    const allJobs = await db.query.jobs.findMany({
      where: eq(jobs.batchId, execution.batchId),
      with: {
        sessions: {
          orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
          limit: 1,
        },
      },
    })

    // Filter jobs with ground truth that were evaluated
    const jobsWithGT = allJobs.filter(job => job.hasGroundTruth && job.isEvaluated)

    if (jobsWithGT.length === 0) {
      console.log('[MetricsSnapshot] No evaluated jobs with ground truth')
      return
    }

    // Calculate metrics
    let totalMatches = 0
    let totalFields = 0
    let exactMatches = 0
    const columnMetricsMap = new Map<string, { matches: number; total: number }>()

    for (const job of jobsWithGT) {
      const latestSession = job.sessions[0]
      if (!latestSession?.extractedData || !job.groundTruthData) continue

      const extractedData = latestSession.extractedData as Record<string, any>
      const gtData = job.groundTruthData as Record<string, any>
      const gtFields = Object.keys(gtData)

      if (gtFields.length === 0) continue

      let jobMatches = 0
      for (const field of gtFields) {
        const extracted = String(extractedData[field] || '').toLowerCase().trim()
        const expected = String(gtData[field] || '').toLowerCase().trim()
        const isMatch = extracted === expected

        if (isMatch) {
          jobMatches++
          totalMatches++

          // Update column metrics
          const colMetric = columnMetricsMap.get(field) || { matches: 0, total: 0 }
          colMetric.matches++
          colMetric.total++
          columnMetricsMap.set(field, colMetric)
        } else {
          const colMetric = columnMetricsMap.get(field) || { matches: 0, total: 0 }
          colMetric.total++
          columnMetricsMap.set(field, colMetric)
        }
      }

      totalFields += gtFields.length

      // Check if job is an exact match (all fields correct)
      if (jobMatches === gtFields.length) {
        exactMatches++
      }
    }

    const overallAccuracy = totalFields > 0 ? (totalMatches / totalFields) * 100 : 0
    const partialMatches = jobsWithGT.length - exactMatches

    // Build column metrics array
    const columnMetrics = Array.from(columnMetricsMap.entries()).map(([columnName, metric]) => ({
      columnName,
      accuracy: (metric.matches / metric.total) * 100,
      exactMatches: metric.matches,
      mismatches: metric.total - metric.matches,
    }))

    // Insert snapshot
    const [snapshot] = await db.insert(groundTruthMetricsHistory).values({
      batchId: execution.batchId,
      executionId: execution.id,
      overallAccuracy,
      totalJobs: jobsWithGT.length,
      jobsEvaluated: jobsWithGT.length,
      exactMatches,
      partialMatches,
      columnMetrics,
      notes: `Auto-generated snapshot for ${execution.executionType} execution`,
    }).returning()

    console.log('[MetricsSnapshot] Created snapshot:', snapshot.id, 'Accuracy:', overallAccuracy.toFixed(2) + '%')

    // Also update execution with accuracy percentage
    await db.update(executions)
      .set({ accuracyPercentage: overallAccuracy })
      .where(eq(executions.id, executionId))

    return snapshot
  } catch (error) {
    console.error('[MetricsSnapshot] Error creating snapshot:', error)
  }
}
