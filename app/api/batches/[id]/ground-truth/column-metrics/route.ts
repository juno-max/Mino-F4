import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { batches, jobs, groundTruthColumnMetrics } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Calculate column-level ground truth metrics for a batch
 */
async function calculateColumnMetrics(batchId: string) {
  // Get batch with all jobs
  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, batchId),
    with: {
      jobs: {
        with: {
          sessions: {
            orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
            limit: 1,
          },
        },
      },
    },
  })

  if (!batch) {
    throw new Error('Batch not found')
  }

  // Get ground truth columns from batch
  const gtColumns = batch.groundTruthColumns || []

  // Also check column schema for ground truth columns
  const schemaGtColumns = (batch.columnSchema || [])
    .filter((col: any) => col.isGroundTruth)
    .map((col: any) => col.name)

  // Merge both sources of GT column names
  const allGtColumns = [...new Set([...gtColumns, ...schemaGtColumns])]

  if (allGtColumns.length === 0) {
    return {
      batchId,
      columns: [],
      overallAccuracy: null,
    }
  }

  // Calculate metrics for each column
  const columnMetrics = allGtColumns.map((columnName) => {
    let totalJobs = 0
    let jobsWithGroundTruth = 0
    let exactMatches = 0
    let partialMatches = 0
    let mismatches = 0
    let missingExtractions = 0
    const errorExamples: Array<{ expected: any; actual: any }> = []

    for (const job of batch.jobs) {
      totalJobs++

      const gtData = job.groundTruthData as Record<string, any> | null
      const latestSession = job.sessions[0]
      const extractedData = latestSession?.extractedData as Record<string, any> | null

      // Check if this job has ground truth for this column
      if (gtData && gtData[columnName] !== undefined && gtData[columnName] !== null) {
        jobsWithGroundTruth++

        const expectedValue = gtData[columnName]
        const actualValue = extractedData?.[columnName]

        if (actualValue === undefined || actualValue === null) {
          missingExtractions++
          errorExamples.push({ expected: expectedValue, actual: null })
        } else {
          // Normalize values for comparison
          const normalizedExpected = normalizeValue(expectedValue)
          const normalizedActual = normalizeValue(actualValue)

          if (normalizedExpected === normalizedActual) {
            exactMatches++
          } else {
            // Check for partial match (fuzzy)
            const similarity = calculateSimilarity(normalizedExpected, normalizedActual)
            if (similarity > 0.8) {
              partialMatches++
            } else {
              mismatches++
              if (errorExamples.length < 5) {
                errorExamples.push({ expected: expectedValue, actual: actualValue })
              }
            }
          }
        }
      }
    }

    const accuracyPercentage = jobsWithGroundTruth > 0
      ? ((exactMatches + partialMatches * 0.5) / jobsWithGroundTruth) * 100
      : null

    return {
      columnName,
      totalJobs,
      jobsWithGroundTruth,
      exactMatches,
      partialMatches,
      mismatches,
      missingExtractions,
      accuracyPercentage,
      errorExamples,
    }
  })

  // Calculate overall accuracy
  const totalGtJobs = columnMetrics.reduce((sum, col) => sum + col.jobsWithGroundTruth, 0)
  const totalMatches = columnMetrics.reduce((sum, col) => sum + col.exactMatches + col.partialMatches * 0.5, 0)
  const overallAccuracy = totalGtJobs > 0 ? (totalMatches / totalGtJobs) * 100 : null

  return {
    batchId,
    columns: columnMetrics,
    overallAccuracy,
  }
}

/**
 * Normalize a value for comparison
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined) return ''

  const str = String(value).trim().toLowerCase()

  // Remove extra whitespace
  return str.replace(/\s+/g, ' ')
}

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1

  // Simple Levenshtein-based similarity
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params

    // Calculate fresh metrics
    const metrics = await calculateColumnMetrics(batchId)

    return NextResponse.json(metrics)
  } catch (error: any) {
    console.error('Get column metrics error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get column metrics' },
      { status: 500 }
    )
  }
}
