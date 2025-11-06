import { NextRequest, NextResponse } from 'next/server'
import { db, jobs, sessions } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { handleApiError } from '@/lib/api-helpers'

/**
 * GET /api/jobs/[id]/details
 * Get detailed job information including logs, reasoning, and execution data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id

    // Get job details
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get the latest session for this job
    const latestSession = await db.query.sessions.findFirst({
      where: eq(sessions.jobId, jobId),
      orderBy: [desc(sessions.createdAt)],
    })

    // Parse logs to extract timeline and reasoning
    const logs: Array<{
      timestamp: string
      action: string
      details?: string
      status: 'pending' | 'success' | 'error'
    }> = []

    const reasoning: Array<{
      timestamp: string
      thinking: string
      decision: string
    }> = []

    if (latestSession?.rawOutput) {
      // Parse log lines
      const logLines = latestSession.rawOutput.split('\n')

      for (const line of logLines) {
        if (!line.trim()) continue

        const timestamp = new Date(latestSession.startedAt || latestSession.createdAt).toISOString()

        // Extract action logs (lines that look like actions)
        if (line.includes('Navigating to') || line.includes('Clicking') ||
            line.includes('Typing') || line.includes('Waiting') ||
            line.includes('Extracting') || line.includes('Found') ||
            line.includes('Completed') || line.includes('Error')) {
          logs.push({
            timestamp,
            action: line.trim(),
            status: line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')
              ? 'error'
              : line.toLowerCase().includes('completed') || line.toLowerCase().includes('success')
              ? 'success'
              : 'pending'
          })
        }

        // Extract reasoning/thinking (lines that suggest agent reasoning)
        if (line.includes('Thinking:') || line.includes('Decision:') ||
            line.includes('Reasoning:') || line.includes('Strategy:')) {
          const parts = line.split(/Thinking:|Decision:|Reasoning:|Strategy:/i)
          if (parts.length > 1) {
            reasoning.push({
              timestamp,
              thinking: parts[1]?.trim() || line,
              decision: parts[2]?.trim() || 'Continuing execution'
            })
          }
        }
      }

      // If no structured logs found, create basic timeline from progress steps
      if (logs.length === 0) {
        // Add basic execution steps based on job status
        const jobStartTime = job.startedAt || job.createdAt
        logs.push({
          timestamp: jobStartTime.toISOString(),
          action: 'Job started',
          details: `Navigating to ${job.siteUrl}`,
          status: 'success'
        })

        if (job.currentStep) {
          logs.push({
            timestamp: new Date().toISOString(),
            action: job.currentStep,
            status: job.status === 'error' ? 'error' : 'pending'
          })
        }

        if (job.status === 'completed') {
          logs.push({
            timestamp: job.completedAt?.toISOString() || new Date().toISOString(),
            action: 'Job completed successfully',
            details: `Extracted ${Object.keys(latestSession?.extractedData || {}).length} fields`,
            status: 'success'
          })
        } else if (job.status === 'error') {
          logs.push({
            timestamp: job.completedAt?.toISOString() || new Date().toISOString(),
            action: 'Job failed',
            details: latestSession?.errorMessage || 'Unknown error',
            status: 'error'
          })
        }
      }
    }

    // Return combined data
    return NextResponse.json({
      job: {
        id: job.id,
        siteName: job.siteName,
        siteUrl: job.siteUrl,
        goal: job.goal,
        status: job.status,
        progressPercentage: job.progressPercentage,
        currentStep: job.currentStep,
        currentUrl: job.currentUrl,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        executionDurationMs: job.executionDurationMs,
        evaluationResult: job.evaluationResult,
      },
      session: latestSession ? {
        id: latestSession.id,
        sessionNumber: latestSession.sessionNumber,
        status: latestSession.status,
        streamingUrl: latestSession.streamingUrl,
        screenshotUrl: latestSession.screenshotUrl,
        errorMessage: latestSession.errorMessage,
        executionTimeMs: latestSession.executionTimeMs,
      } : null,
      logs,
      reasoning,
      extractedData: latestSession?.extractedData || null,
      screenshots: latestSession?.screenshots || [],
    })
  } catch (error) {
    console.error('[JobDetails] Error:', error)
    return handleApiError(error)
  }
}
