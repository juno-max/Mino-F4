import { NextRequest, NextResponse } from 'next/server'
import { db, batches, executions, jobs, sessions, projects } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { executeEvaWorkflow } from '@/lib/eva-executor'
import {
  publishExecutionStarted,
  publishJobStarted,
  publishJobProgress,
  publishJobCompleted,
  publishJobFailed,
  publishExecutionStatsUpdated,
  publishExecutionCompleted,
} from '@/lib/execution-events'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; batchId: string } }
) {
  try {
    const body = await request.json()
    const { executionType = 'test', sampleSize = 10, useAgentQL = false } = body

    // Get batch and project
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, params.batchId),
    })

    if (!batch) {
      return NextResponse.json({ message: 'Batch not found' }, { status: 404 })
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, params.id),
    })

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 })
    }

    const columnSchema = batch.columnSchema as any[]
    const csvData = batch.csvData as any[]

    // Check if there are existing jobs for this batch
    const existingJobs = await db.query.jobs.findMany({
      where: eq(jobs.batchId, params.batchId),
    })

    // If jobs already exist, reset them for re-execution
    if (existingJobs.length > 0) {
      console.log('[Execute] Jobs already exist for this batch, resetting for re-execution')

      // Reset all jobs to queued status
      await db.update(jobs)
        .set({ status: 'queued', lastRunAt: null })
        .where(eq(jobs.batchId, params.batchId))

      console.log('[Execute] Reset', existingJobs.length, 'jobs to queued status')
      // Continue with execution using existing jobs
    }

    // Determine which jobs to execute
    let jobsToExecute = []

    if (existingJobs.length > 0) {
      // Use existing jobs (already reset to queued above)
      jobsToExecute = existingJobs
      console.log('[Execute] Using', jobsToExecute.length, 'existing jobs')
    } else {
      // Create new jobs
      console.log('[Execute] Creating new jobs')
      const sitesToTest = csvData.slice(0, Math.min(sampleSize, csvData.length))

      for (const siteData of sitesToTest) {
        const urlColumn = columnSchema.find((col: any) => col.isUrl)
        const siteUrl = urlColumn ? siteData[urlColumn.name] : (siteData.url || siteData.website)

        // Extract ground truth data
        const gtColumns = columnSchema.filter((col: any) => col.isGroundTruth)
        const groundTruthData: Record<string, any> = {}
        for (const col of gtColumns) {
          const actualColumnName = col.name.replace(/^gt_/i, '').replace(/_gt$/i, '')
          groundTruthData[actualColumnName] = siteData[col.name]
        }

        // Generate goal from project instructions and site data
        const goal = generateGoal(project.instructions, siteData, columnSchema)

        const [job] = await db.insert(jobs).values({
          batchId: params.batchId,
          projectId: params.id,
          inputId: siteData.id || siteData.name || siteUrl,
          siteUrl,
          siteName: siteData.name || null,
          goal,
          csvRowData: siteData,
          groundTruthData: Object.keys(groundTruthData).length > 0 ? groundTruthData : null,
          status: 'queued',
          hasGroundTruth: Object.keys(groundTruthData).length > 0,
        }).returning()

        jobsToExecute.push(job)
      }
    }

    // Create execution record
    const [execution] = await db.insert(executions).values({
      batchId: params.batchId,
      projectId: params.id,
      status: 'running',
      executionType,
      totalJobs: jobsToExecute.length,
      completedJobs: 0,
      runningJobs: 0,
      queuedJobs: jobsToExecute.length,
      errorJobs: 0,
      startedAt: new Date(),
    }).returning()

    // Publish execution started event
    publishExecutionStarted({
      executionId: execution.id,
      batchId: params.batchId,
      projectId: params.id,
      totalJobs: jobsToExecute.length,
      concurrency: execution.concurrency || 5,
      executionType: executionType as 'test' | 'production',
    })

    // Run execution asynchronously with EVA agent
    if (useAgentQL) {
      console.log('[Execute] Starting EVA agent execution for', jobsToExecute.length, 'jobs')
      // Start execution in background - don't await to avoid blocking response
      executeEvaJobs(execution.id, jobsToExecute, project.instructions, columnSchema)
        .catch(err => console.error('[Execute] Background execution error:', err))
    } else {
      // Use mock executor for testing
      console.log('[Execute] Starting mock execution for', jobsToExecute.length, 'jobs')
      const { executeBatchMock } = await import('@/lib/mock-executor')
      executeMockJobs(execution.id, jobsToExecute, columnSchema)
        .catch(err => console.error('[Execute] Mock execution error:', err))
    }

    return NextResponse.json({
      execution,
      jobs: jobsToExecute,
    }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Execution error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to start execution' },
      { status: 500, headers: corsHeaders }
    )
  }
}

function generateGoal(
  projectInstructions: string,
  siteData: Record<string, any>,
  columnSchema: any[]
): string {
  // Replace placeholders in instructions with actual data
  let goal = projectInstructions

  for (const col of columnSchema) {
    const placeholder = `{${col.name}}`
    if (goal.includes(placeholder) && siteData[col.name]) {
      goal = goal.replace(new RegExp(placeholder, 'g'), siteData[col.name])
    }
  }

  return goal
}

async function executeEvaJobs(
  executionId: string,
  jobsList: any[],
  projectInstructions: string,
  columnSchema: any[]
) {
  console.log('[executeEvaJobs] Starting EVA execution for', jobsList.length, 'jobs')
  console.log('[executeEvaJobs] Execution ID:', executionId)

  try {
    for (const job of jobsList) {
      console.log('[executeEvaJobs] Processing job:', job.id, 'URL:', job.siteUrl)
      const startTime = Date.now()

      // Update job status to running
      await db.update(jobs).set({
        status: 'running',
        lastRunAt: new Date(),
        startedAt: new Date(),
        progressPercentage: 0,
      }).where(eq(jobs.id, job.id))
      console.log('[executeEvaJobs] Job', job.id, 'status updated to running')

      // Publish job started event
      publishJobStarted({
        executionId,
        jobId: job.id,
        batchId: job.batchId,
        siteUrl: job.siteUrl,
        siteName: job.siteName,
        goal: job.goal,
      })

      // Update execution stats
      await db.update(executions).set({
        runningJobs: 1,
        queuedJobs: jobsList.length - jobsList.indexOf(job) - 1,
        lastActivityAt: new Date(),
      }).where(eq(executions.id, executionId))

      // Publish stats update event
      const currentStats = {
        totalJobs: jobsList.length,
        completedJobs: jobsList.indexOf(job),
        runningJobs: 1,
        queuedJobs: jobsList.length - jobsList.indexOf(job) - 1,
        errorJobs: 0,
      }
      publishExecutionStatsUpdated({
        executionId,
        stats: currentStats,
      })

      // Create session
      const sessionNumber = 1 // First attempt
      const [session] = await db.insert(sessions).values({
        jobId: job.id,
        sessionNumber,
        status: 'running',
        startedAt: new Date(),
      }).returning()

      // Execute with EVA
      try {
        console.log('[executeEvaJobs] Calling executeEvaWorkflow for job:', job.id)

        const result = await executeEvaWorkflow(
          job.siteUrl,
          projectInstructions,
          columnSchema,
          job.groundTruthData,
          async (url) => {
            // Store streaming URL in session for live browser view
            console.log(`[executeEvaJobs] Job ${job.id}: Live browser stream available at ${url}`)
            await db.update(sessions).set({
              streamingUrl: url
            }).where(eq(sessions.id, session.id))
          }
        )

        console.log('[executeEvaJobs] EVA workflow completed for job:', job.id, 'Error:', result.error || 'none')

        const executionTimeMs = Date.now() - startTime

        // Update session with results
        await db.update(sessions).set({
          status: result.error ? 'failed' : 'completed',
          extractedData: result.extractedData,
          rawOutput: result.logs.join('\n'),
          errorMessage: result.error,
          failureReason: result.error ? 'EVA execution error' : null,
          executionTimeMs,
          completedAt: new Date(),
        }).where(eq(sessions.id, session.id))

        // Calculate accuracy metrics
        let isAccurate: boolean | null = null
        if (result.accuracy) {
          isAccurate = result.accuracy.accuracyScore === 100
        }

        // Update job status
        const jobStatus = result.error ? 'error' : 'completed'
        await db.update(jobs).set({
          status: jobStatus,
          isEvaluated: isAccurate !== null,
          evaluationResult: isAccurate === true ? 'pass' : isAccurate === false ? 'fail' : null,
          completedAt: new Date(),
          progressPercentage: 100,
          executionDurationMs: executionTimeMs,
        }).where(eq(jobs.id, job.id))

        // Publish job completion event
        if (result.error) {
          publishJobFailed({
            executionId,
            jobId: job.id,
            status: 'error',
            errorMessage: result.error,
            failureReason: 'EVA execution error',
          })
        } else {
          publishJobCompleted({
            executionId,
            jobId: job.id,
            status: 'completed',
            duration: executionTimeMs,
            extractedData: result.extractedData,
            isEvaluated: isAccurate !== null,
            evaluationResult: isAccurate === true ? 'pass' : isAccurate === false ? 'fail' : undefined,
          })
        }

        // Update execution stats
        const completedJobs = jobsList.indexOf(job) + 1
        const errorJobs = result.error ? 1 : 0
        await db.update(executions).set({
          completedJobs,
          runningJobs: 0,
          errorJobs,
          lastActivityAt: new Date(),
        }).where(eq(executions.id, executionId))

        // Publish stats update
        publishExecutionStatsUpdated({
          executionId,
          stats: {
            totalJobs: jobsList.length,
            completedJobs,
            runningJobs: 0,
            queuedJobs: jobsList.length - completedJobs,
            errorJobs,
          },
        })

      } catch (error: any) {
        console.error(`Job ${job.id} EVA execution error:`, error)

        const executionTimeMs = Date.now() - startTime

        // Update session as failed
        await db.update(sessions).set({
          status: 'failed',
          errorMessage: error.message,
          failureReason: 'EVA execution error',
          executionTimeMs,
          completedAt: new Date(),
        }).where(eq(sessions.id, session.id))

        // Update job as error
        await db.update(jobs).set({
          status: 'error',
          completedAt: new Date(),
          executionDurationMs: executionTimeMs,
        }).where(eq(jobs.id, job.id))

        // Publish job failed event
        publishJobFailed({
          executionId,
          jobId: job.id,
          status: 'error',
          errorMessage: error.message,
          failureReason: 'EVA execution error',
        })

        // Update execution error count
        const completedJobs = jobsList.indexOf(job) + 1
        await db.update(executions).set({
          completedJobs,
          runningJobs: 0,
          errorJobs: completedJobs,
          lastActivityAt: new Date(),
        }).where(eq(executions.id, executionId))

        // Publish stats update
        publishExecutionStatsUpdated({
          executionId,
          stats: {
            totalJobs: jobsList.length,
            completedJobs,
            runningJobs: 0,
            queuedJobs: jobsList.length - completedJobs,
            errorJobs: completedJobs,
          },
        })
      }
    }

    // Mark execution as completed
    await db.update(executions).set({
      status: 'completed',
      completedAt: new Date(),
    }).where(eq(executions.id, executionId))

    // Publish execution completed event
    const finalExecution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })
    if (finalExecution) {
      publishExecutionCompleted({
        executionId,
        completedJobs: finalExecution.completedJobs,
        totalJobs: finalExecution.totalJobs,
        passRate: finalExecution.passRate ? Number(finalExecution.passRate) : undefined,
        duration: finalExecution.startedAt && finalExecution.completedAt
          ? finalExecution.completedAt.getTime() - finalExecution.startedAt.getTime()
          : 0,
      })
    }

  } catch (error) {
    console.error('EVA execution error:', error)
    await db.update(executions).set({
      status: 'failed',
      completedAt: new Date(),
    }).where(eq(executions.id, executionId))
  }
}

async function executeMockJobs(
  executionId: string,
  jobsList: any[],
  columnSchema: any[]
) {
  const { executeBatchMock } = await import('@/lib/mock-executor')

  try {
    for (const job of jobsList) {
      // Update job status to running
      await db.update(jobs).set({ status: 'running', lastRunAt: new Date() }).where(eq(jobs.id, job.id))

      // Create session
      const [session] = await db.insert(sessions).values({
        jobId: job.id,
        sessionNumber: 1,
        status: 'running',
        startedAt: new Date(),
      }).returning()

      // Execute mock
      const { executeMockWorkflow } = await import('@/lib/mock-executor')
      const result = await executeMockWorkflow(
        job.siteUrl,
        columnSchema,
        job.groundTruthData
      )

      // Update session with results
      await db.update(sessions).set({
        status: result.failureReason ? 'failed' : 'completed',
        extractedData: result.extractedData,
        rawOutput: JSON.stringify(result.extractedData),
        errorMessage: result.failureReason,
        failureReason: result.failureReason,
        executionTimeMs: result.executionTimeMs,
        completedAt: new Date(),
      }).where(eq(sessions.id, session.id))

      // Update job status
      const jobStatus = result.failureReason ? 'error' : 'completed'
      await db.update(jobs).set({
        status: jobStatus,
        isEvaluated: result.isAccurate !== null,
        evaluationResult: result.isAccurate ? 'pass' : 'fail',
      }).where(eq(jobs.id, job.id))

      // Update execution stats
      const completedJobs = jobsList.indexOf(job) + 1
      await db.update(executions).set({
        completedJobs,
        runningJobs: 0,
      }).where(eq(executions.id, executionId))
    }

    // Mark execution as completed
    await db.update(executions).set({
      status: 'completed',
      completedAt: new Date(),
    }).where(eq(executions.id, executionId))

  } catch (error) {
    console.error('Mock execution error:', error)
    await db.update(executions).set({
      status: 'failed',
      completedAt: new Date(),
    }).where(eq(executions.id, executionId))
  }
}
