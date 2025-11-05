/**
 * Execution Comparison API
 * Compares two executions side-by-side to show improvements or regressions
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, executions, jobs } from '@/db'
import { eq, and, inArray } from 'drizzle-orm'
import { handleApiError } from '@/lib/api-helpers'
import { ErrorCodes, ApiError } from '@/lib/error-codes'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

interface ComparisonResult {
  execution1: ExecutionSummary
  execution2: ExecutionSummary
  comparison: {
    accuracyChange: number | null
    completionRateChange: number
    errorRateChange: number
    speedChange: number | null // in seconds
    improvements: string[]
    regressions: string[]
  }
  jobComparison: {
    sameJobs: number
    onlyInExecution1: number
    onlyInExecution2: number
    improved: number
    regressed: number
    unchanged: number
  }
}

interface ExecutionSummary {
  id: string
  createdAt: Date
  status: string
  totalJobs: number
  completedJobs: number
  errorJobs: number
  accuracyPercentage: number | null
  avgDurationSeconds: number | null
}

/**
 * GET /api/executions/compare?execution1=<id>&execution2=<id>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const execution1Id = searchParams.get('execution1')
    const execution2Id = searchParams.get('execution2')

    if (!execution1Id || !execution2Id) {
      throw new ApiError(
        'Both execution1 and execution2 IDs are required',
        ErrorCodes.VALIDATION_ERROR,
        400
      )
    }

    if (execution1Id === execution2Id) {
      throw new ApiError(
        'Cannot compare an execution with itself',
        ErrorCodes.VALIDATION_ERROR,
        400
      )
    }

    // Fetch both executions
    const [exec1, exec2] = await Promise.all([
      db.query.executions.findFirst({
        where: eq(executions.id, execution1Id),
      }),
      db.query.executions.findFirst({
        where: eq(executions.id, execution2Id),
      }),
    ])

    if (!exec1) {
      throw new ApiError(
        `Execution 1 not found: ${execution1Id}`,
        ErrorCodes.NOT_FOUND,
        404
      )
    }

    if (!exec2) {
      throw new ApiError(
        `Execution 2 not found: ${execution2Id}`,
        ErrorCodes.NOT_FOUND,
        404
      )
    }

    // Verify they're from the same batch
    if (exec1.batchId !== exec2.batchId) {
      throw new ApiError(
        'Cannot compare executions from different batches',
        ErrorCodes.VALIDATION_ERROR,
        400
      )
    }

    // Get jobs for both executions
    const [jobs1, jobs2] = await Promise.all([
      db.query.jobs.findMany({
        where: eq(jobs.batchId, exec1.batchId),
      }),
      db.query.jobs.findMany({
        where: eq(jobs.batchId, exec2.batchId),
      }),
    ])

    // Calculate execution summaries
    const summary1 = calculateExecutionSummary(exec1, jobs1)
    const summary2 = calculateExecutionSummary(exec2, jobs2)

    // Compare executions
    const comparison = compareExecutions(summary1, summary2)

    // Compare individual jobs
    const jobComparison = compareJobs(jobs1, jobs2)

    const result: ComparisonResult = {
      execution1: summary1,
      execution2: summary2,
      comparison,
      jobComparison,
    }

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Calculate summary statistics for an execution
 */
function calculateExecutionSummary(execution: any, jobsList: any[]): ExecutionSummary {
  const completedJobs = jobsList.filter(j => j.status === 'completed').length
  const errorJobs = jobsList.filter(j => j.status === 'error').length

  // Calculate average duration for completed jobs
  const completedWithDuration = jobsList.filter(
    j => j.status === 'completed' && j.executionDurationMs
  )
  const avgDurationMs = completedWithDuration.length > 0
    ? completedWithDuration.reduce((sum, j) => sum + (j.executionDurationMs || 0), 0) / completedWithDuration.length
    : null

  return {
    id: execution.id,
    createdAt: execution.createdAt,
    status: execution.status,
    totalJobs: execution.totalJobs || jobsList.length,
    completedJobs,
    errorJobs,
    accuracyPercentage: execution.accuracyPercentage,
    avgDurationSeconds: avgDurationMs ? Math.round(avgDurationMs / 1000) : null,
  }
}

/**
 * Compare two executions and identify improvements/regressions
 */
function compareExecutions(exec1: ExecutionSummary, exec2: ExecutionSummary) {
  const improvements: string[] = []
  const regressions: string[] = []

  // Accuracy comparison
  const accuracyChange = exec1.accuracyPercentage && exec2.accuracyPercentage
    ? exec2.accuracyPercentage - exec1.accuracyPercentage
    : null

  if (accuracyChange !== null) {
    if (accuracyChange > 5) {
      improvements.push(`Accuracy improved by ${accuracyChange.toFixed(1)}%`)
    } else if (accuracyChange < -5) {
      regressions.push(`Accuracy decreased by ${Math.abs(accuracyChange).toFixed(1)}%`)
    }
  }

  // Completion rate comparison
  const completionRate1 = (exec1.completedJobs / exec1.totalJobs) * 100
  const completionRate2 = (exec2.completedJobs / exec2.totalJobs) * 100
  const completionRateChange = completionRate2 - completionRate1

  if (completionRateChange > 5) {
    improvements.push(`Completion rate improved by ${completionRateChange.toFixed(1)}%`)
  } else if (completionRateChange < -5) {
    regressions.push(`Completion rate decreased by ${Math.abs(completionRateChange).toFixed(1)}%`)
  }

  // Error rate comparison
  const errorRate1 = (exec1.errorJobs / exec1.totalJobs) * 100
  const errorRate2 = (exec2.errorJobs / exec2.totalJobs) * 100
  const errorRateChange = errorRate2 - errorRate1

  if (errorRateChange < -5) {
    improvements.push(`Error rate reduced by ${Math.abs(errorRateChange).toFixed(1)}%`)
  } else if (errorRateChange > 5) {
    regressions.push(`Error rate increased by ${errorRateChange.toFixed(1)}%`)
  }

  // Speed comparison
  const speedChange = exec1.avgDurationSeconds && exec2.avgDurationSeconds
    ? exec2.avgDurationSeconds - exec1.avgDurationSeconds
    : null

  if (speedChange !== null) {
    if (speedChange < -5) {
      improvements.push(`Execution ${Math.abs(speedChange)}s faster on average`)
    } else if (speedChange > 5) {
      regressions.push(`Execution ${speedChange}s slower on average`)
    }
  }

  return {
    accuracyChange,
    completionRateChange,
    errorRateChange,
    speedChange,
    improvements,
    regressions,
  }
}

/**
 * Compare individual jobs between executions
 */
function compareJobs(jobs1: any[], jobs2: any[]) {
  // Create maps keyed by siteUrl for comparison
  const jobs1Map = new Map(jobs1.map(j => [j.siteUrl, j]))
  const jobs2Map = new Map(jobs2.map(j => [j.siteUrl, j]))

  // Find common jobs
  const commonUrls = Array.from(jobs1Map.keys()).filter(url => jobs2Map.has(url))

  let improved = 0
  let regressed = 0
  let unchanged = 0

  for (const url of commonUrls) {
    const job1 = jobs1Map.get(url)!
    const job2 = jobs2Map.get(url)!

    // Compare evaluation results
    if (job1.evaluationResult && job2.evaluationResult) {
      if (job1.evaluationResult === 'fail' && job2.evaluationResult === 'pass') {
        improved++
      } else if (job1.evaluationResult === 'pass' && job2.evaluationResult === 'fail') {
        regressed++
      } else {
        unchanged++
      }
    } else if (job1.status && job2.status) {
      // Compare completion status if no evaluation
      if (job1.status === 'error' && job2.status === 'completed') {
        improved++
      } else if (job1.status === 'completed' && job2.status === 'error') {
        regressed++
      } else {
        unchanged++
      }
    }
  }

  return {
    sameJobs: commonUrls.length,
    onlyInExecution1: jobs1.length - commonUrls.length,
    onlyInExecution2: jobs2.length - commonUrls.length,
    improved,
    regressed,
    unchanged,
  }
}
