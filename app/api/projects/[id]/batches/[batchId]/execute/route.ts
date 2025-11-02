import { NextRequest, NextResponse } from 'next/server'
import { db, batches, executions, executionResults, accuracyMetrics } from '@/db'
import { eq } from 'drizzle-orm'
import { executeBatchMock } from '@/lib/mock-executor'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; batchId: string } }
) {
  try {
    const body = await request.json()
    const { executionType = 'test', sampleSize = 10 } = body

    // Get batch
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, params.batchId),
    })

    if (!batch) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 })
    }

    const columnSchema = batch.columnSchema as any[]
    const csvData = batch.csvData as any[]

    // Sample sites
    const sitesToTest = csvData.slice(0, Math.min(sampleSize, csvData.length))

    // Create execution record
    const [execution] = await db.insert(executions).values({
      batchId: params.batchId,
      projectId: params.id,
      status: 'running',
      executionType,
      totalSites: sitesToTest.length,
      completedSites: 0,
      successfulSites: 0,
      failedSites: 0,
      startedAt: new Date(),
    }).returning()

    // Run mock execution asynchronously
    executeMockTests(execution.id, sitesToTest, columnSchema)

    return NextResponse.json(execution)
  } catch (error: any) {
    console.error('Execution error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to start execution' },
      { status: 500 }
    )
  }
}

async function executeMockTests(
  executionId: string,
  sites: any[],
  columnSchema: any[]
) {
  try {
    const results = await executeBatchMock(
      sites.map(site => ({ url: site.url || site.website, data: site })),
      columnSchema,
      async (completed, total) => {
        // Update progress
        await db.update(executions)
          .set({ completedSites: completed })
          .where(eq(executions.id, executionId))
      }
    )

    // Store results
    for (const result of results) {
      await db.insert(executionResults).values({
        executionId,
        siteUrl: result.siteUrl,
        siteName: result.siteName,
        extractedData: result.extractedData,
        groundTruthData: result.groundTruthData,
        isAccurate: result.isAccurate,
        matchPercentage: result.matchPercentage ? result.matchPercentage.toString() : null,
        failureReason: result.failureReason,
        failureCategory: result.failureCategory,
        executionTimeMs: result.executionTimeMs,
      })
    }

    // Calculate overall accuracy
    const accurateCount = results.filter(r => r.isAccurate === true).length
    const totalWithGT = results.filter(r => r.isAccurate !== null).length
    const overallAccuracy = totalWithGT > 0 ? (accurateCount / totalWithGT) * 100 : null

    // Calculate per-column accuracy
    const dataColumns = columnSchema.filter(col => !col.isGroundTruth && !col.isUrl)
    const columnAccuracies: Record<string, any> = {}

    for (const column of dataColumns) {
      const resultsWithGT = results.filter(r => r.groundTruthData && column.name in r.groundTruthData)
      if (resultsWithGT.length > 0) {
        let accurate = 0
        for (const result of resultsWithGT) {
          const extracted = result.extractedData[column.name]
          const gt = result.groundTruthData![column.name]
          if (extracted != null && String(extracted).toLowerCase() === String(gt).toLowerCase()) {
            accurate++
          }
        }
        columnAccuracies[column.name] = {
          total: resultsWithGT.length,
          accurate,
          accuracyPercentage: Math.round((accurate / resultsWithGT.length) * 100),
        }
      }
    }

    // Store accuracy metrics
    if (overallAccuracy !== null) {
      await db.insert(accuracyMetrics).values({
        executionId,
        columnAccuracies,
        overallAccuracy: overallAccuracy.toFixed(2),
      })
    }

    // Update execution status
    const successful = results.filter(r => r.failureReason === null).length
    const failed = results.filter(r => r.failureReason !== null).length

    await db.update(executions)
      .set({
        status: 'completed',
        completedSites: results.length,
        successfulSites: successful,
        failedSites: failed,
        accuracyPercentage: overallAccuracy ? overallAccuracy.toFixed(2) : null,
        completedAt: new Date(),
      })
      .where(eq(executions.id, executionId))

  } catch (error) {
    console.error('Mock execution error:', error)
    await db.update(executions)
      .set({ status: 'failed' })
      .where(eq(executions.id, executionId))
  }
}
