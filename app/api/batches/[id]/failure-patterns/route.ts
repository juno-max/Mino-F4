/**
 * Failure Pattern Analysis API
 * Analyzes error patterns across jobs to help identify common issues
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, jobs, sessions } from '@/db'
import { eq, and, isNotNull } from 'drizzle-orm'
import { validateParams, handleApiError } from '@/lib/api-helpers'
import { batchIdSchema } from '@/lib/validation-schemas'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

interface FailurePattern {
  pattern: string
  count: number
  percentage: number
  examples: Array<{
    jobId: string
    siteUrl: string
    errorMessage: string
  }>
  suggestedFix?: string
}

/**
 * GET /api/batches/[id]/failure-patterns - Get failure pattern analysis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateParams(params, batchIdSchema)
    if (!validation.success) return validation.response

    const { id: batchId } = validation.data

    // Get all failed jobs with their sessions
    const failedJobs = await db.query.jobs.findMany({
      where: eq(jobs.batchId, batchId),
      with: {
        sessions: {
          where: and(
            eq(sessions.status, 'failed'),
            isNotNull(sessions.errorMessage)
          ),
          orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
          limit: 1, // Get most recent failed session per job
        },
      },
    })

    // Filter to only jobs with failed sessions
    const jobsWithErrors = failedJobs.filter(job =>
      job.sessions.length > 0 && job.sessions[0].errorMessage
    )

    if (jobsWithErrors.length === 0) {
      return NextResponse.json(
        {
          patterns: [],
          totalFailures: 0,
          summary: 'No failure patterns found',
        },
        { headers: corsHeaders }
      )
    }

    // Analyze error patterns
    const errorPatterns = new Map<string, {
      count: number
      examples: Array<{ jobId: string; siteUrl: string; errorMessage: string }>
      suggestedFix: string
    }>()

    for (const job of jobsWithErrors) {
      const session = job.sessions[0]
      const errorMessage = session.errorMessage || 'Unknown error'

      // Classify error into pattern
      const pattern = classifyError(errorMessage)

      if (!errorPatterns.has(pattern.name)) {
        errorPatterns.set(pattern.name, {
          count: 0,
          examples: [],
          suggestedFix: pattern.suggestedFix,
        })
      }

      const patternData = errorPatterns.get(pattern.name)!
      patternData.count++

      // Store up to 3 examples per pattern
      if (patternData.examples.length < 3) {
        patternData.examples.push({
          jobId: job.id,
          siteUrl: job.siteUrl,
          errorMessage: errorMessage.substring(0, 200), // Truncate long errors
        })
      }
    }

    // Convert to array and calculate percentages
    const totalFailures = jobsWithErrors.length
    const patterns: FailurePattern[] = Array.from(errorPatterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        percentage: Math.round((data.count / totalFailures) * 100),
        examples: data.examples,
        suggestedFix: data.suggestedFix,
      }))
      .sort((a, b) => b.count - a.count) // Sort by frequency

    // Generate summary
    const topPattern = patterns[0]
    const summary = patterns.length === 1
      ? `All failures are due to: ${topPattern.pattern}`
      : `Most common: ${topPattern.pattern} (${topPattern.percentage}%)`

    return NextResponse.json(
      {
        patterns,
        totalFailures,
        summary,
        affectedJobs: jobsWithErrors.length,
        totalJobs: failedJobs.length,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Classify error messages into patterns
 */
function classifyError(errorMessage: string): { name: string; suggestedFix: string } {
  const message = errorMessage.toLowerCase()

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      name: 'Timeout',
      suggestedFix: 'Increase timeout duration or optimize selectors for faster execution',
    }
  }

  // Selector/element not found
  if (message.includes('selector') || message.includes('element not found') || message.includes('could not find')) {
    return {
      name: 'Selector Not Found',
      suggestedFix: 'Verify selectors are correct and elements exist on the page',
    }
  }

  // Network errors
  if (message.includes('network') || message.includes('connection') || message.includes('econnrefused')) {
    return {
      name: 'Network Error',
      suggestedFix: 'Check URL accessibility and network connectivity',
    }
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
    return {
      name: 'Rate Limited',
      suggestedFix: 'Reduce concurrency or add delays between requests',
    }
  }

  // Auth/permission errors
  if (message.includes('unauthorized') || message.includes('403') || message.includes('401') || message.includes('forbidden')) {
    return {
      name: 'Authorization Error',
      suggestedFix: 'Check authentication credentials and permissions',
    }
  }

  // Page load errors
  if (message.includes('page') && (message.includes('load') || message.includes('navigation'))) {
    return {
      name: 'Page Load Failure',
      suggestedFix: 'Verify URL is correct and page loads successfully in browser',
    }
  }

  // JavaScript errors
  if (message.includes('javascript') || message.includes('js error') || message.includes('script error')) {
    return {
      name: 'JavaScript Error',
      suggestedFix: 'Check browser console for errors; may need to wait for page to fully load',
    }
  }

  // CAPTCHA / Bot detection
  if (message.includes('captcha') || message.includes('bot') || message.includes('verification')) {
    return {
      name: 'CAPTCHA / Bot Detection',
      suggestedFix: 'Site has bot protection; may need different approach or API access',
    }
  }

  // Invalid data format
  if (message.includes('parse') || message.includes('invalid') || message.includes('format')) {
    return {
      name: 'Data Format Error',
      suggestedFix: 'Check data extraction logic and expected format',
    }
  }

  // Default: Unknown error
  return {
    name: 'Unknown Error',
    suggestedFix: 'Review error details and check browser console logs',
  }
}
