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
import { createMetricsSnapshot } from '@/lib/metrics-snapshot'
import { validateRequest, validateParams, handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { executeSchema, projectBatchParamsSchema } from '@/lib/validation-schemas'
import { createConcurrencyController, type ConcurrencyController } from '@/lib/concurrency-control'
import { withRetry, RetryPresets } from '@/lib/retry-logic'

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
  { params }: { params: Promise<{ id: string; batchId: string }> }
) {
  try {
    // Validate route parameters
    const paramsValidation = await validateParams(params, projectBatchParamsSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id: projectId, batchId } = paramsValidation.data

    // Validate request body
    const bodyValidation = await validateRequest(request, executeSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    const { executionType, sampleSize, useAgentQL, concurrency = 5 } = bodyValidation.data

    // Get batch and project
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, batchId),
    })

    if (!batch) {
      return notFoundResponse('Batch')
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) {
      return notFoundResponse('Project')
    }

    const columnSchema = batch.columnSchema as any[]
    const csvData = batch.csvData as any[]

    // Check if there are existing jobs for this batch
    const existingJobs = await db.query.jobs.findMany({
      where: eq(jobs.batchId, batchId),
    })

    // If jobs already exist, reset them for re-execution
    if (existingJobs.length > 0) {
      console.log('[Execute] Jobs already exist for this batch, resetting for re-execution')

      // Reset all jobs to queued status
      await db.update(jobs)
        .set({ status: 'queued', lastRunAt: null })
        .where(eq(jobs.batchId, batchId))

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
          organizationId: batch.organizationId,
          batchId,
          projectId,
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
      batchId,
      projectId,
      status: 'running',
      executionType,
      totalJobs: jobsToExecute.length,
      completedJobs: 0,
      runningJobs: 0,
      queuedJobs: jobsToExecute.length,
      errorJobs: 0,
      startedAt: new Date(),
      concurrency,
    }).returning()

    // Publish execution started event
    publishExecutionStarted({
      executionId: execution.id,
      batchId,
      projectId,
      totalJobs: jobsToExecute.length,
      concurrency,
      executionType,
    })

    // Run execution asynchronously with EVA agent
    console.log('[Execute] Starting EVA agent execution for', jobsToExecute.length, 'jobs')
    // Start execution in background - don't await to avoid blocking response
    executeEvaJobs(execution.id, jobsToExecute, project.instructions, columnSchema)
      .catch(err => console.error('[Execute] Background execution error:', err))

    return NextResponse.json({
      execution,
      jobs: jobsToExecute,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Execution error:', error)
    return handleApiError(error)
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
    // Get execution record to retrieve concurrency setting
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })

    if (!execution) {
      throw new Error('Execution record not found')
    }

    // Create concurrency controller with execution's concurrency setting
    const concurrency = execution.concurrency || 5
    const controller = createConcurrencyController(concurrency)
    console.log(`[executeEvaJobs] Concurrency controller created with limit: ${concurrency}`)

    // Shared state for tracking execution progress
    let completedCount = 0
    let errorCount = 0
    const statsLock = { updating: false }

    // Helper function to update execution stats atomically
    const updateExecutionStats = async () => {
      if (statsLock.updating) return
      statsLock.updating = true

      try {
        const activeCount = controller.getActiveCount()
        const pendingCount = controller.getPendingCount()

        await db.update(executions).set({
          completedJobs: completedCount,
          errorJobs: errorCount,
          runningJobs: activeCount,
          queuedJobs: pendingCount,
          lastActivityAt: new Date(),
        }).where(eq(executions.id, executionId))

        // Publish stats update event
        publishExecutionStatsUpdated({
          executionId,
          stats: {
            totalJobs: jobsList.length,
            completedJobs: completedCount,
            runningJobs: activeCount,
            queuedJobs: pendingCount,
            errorJobs: errorCount,
          },
        })
      } finally {
        statsLock.updating = false
      }
    }

    // Process each job concurrently with retry logic
    const jobPromises = jobsList.map((job, index) =>
      controller.run(async () => {
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
        await updateExecutionStats()

        // Create session
        const sessionNumber = 1 // First attempt
        const [session] = await db.insert(sessions).values({
          jobId: job.id,
          sessionNumber,
          status: 'running',
          startedAt: new Date(),
        }).returning()

        // Execute with EVA using retry logic
        try {
          console.log('[executeEvaJobs] Calling executeEvaWorkflow for job:', job.id)

          // Wrap EVA workflow execution with retry logic
          const retryResult = await withRetry(
            async () => {
              return await executeEvaWorkflow(
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
            },
            {
              ...RetryPresets.PATIENT,
              onRetry: (error, attempt) => {
                console.log(`[executeEvaJobs] Job ${job.id} retry attempt ${attempt}:`, error.message)
                // Update session to track retry attempts
                db.update(sessions).set({
                  errorMessage: `Retry attempt ${attempt}: ${error.message}`,
                }).where(eq(sessions.id, session.id))
              },
            }
          )

          const executionTimeMs = Date.now() - startTime

          // Check if retry was successful
          if (retryResult.success && retryResult.data) {
            const result = retryResult.data
            console.log('[executeEvaJobs] EVA workflow completed for job:', job.id, 'Attempts:', retryResult.attempts, 'Error:', result.error || 'none')

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

            // Update counters
            completedCount++
            if (result.error) {
              errorCount++
            }

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
            await updateExecutionStats()
          } else {
            // All retries failed
            throw retryResult.error || new Error('Execution failed after retries')
          }

        } catch (error: any) {
          console.error(`Job ${job.id} EVA execution error after retries:`, error)

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

          // Update counters
          completedCount++
          errorCount++

          // Publish job failed event
          publishJobFailed({
            executionId,
            jobId: job.id,
            status: 'error',
            errorMessage: error.message,
            failureReason: 'EVA execution error',
          })

          // Update execution stats
          await updateExecutionStats()
        }
      })
    )

    // Wait for all jobs to complete
    console.log('[executeEvaJobs] Waiting for all jobs to complete...')
    await Promise.allSettled(jobPromises)
    console.log('[executeEvaJobs] All jobs completed')

    // Mark execution as completed
    await db.update(executions).set({
      status: 'completed',
      completedAt: new Date(),
      completedJobs: completedCount,
      errorJobs: errorCount,
      runningJobs: 0,
      queuedJobs: 0,
    }).where(eq(executions.id, executionId))

    // Auto-create metrics snapshot for tracking accuracy over time
    await createMetricsSnapshot(executionId)

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
