/**
 * Job Executor - Centralized execution logic for both initial runs and resuming
 * This module handles EVA workflow execution with retry logic and progress tracking
 */

import { db, jobs, sessions, executions } from '@/db'
import { eq } from 'drizzle-orm'
import { executeEvaWorkflow } from './eva-executor'
import { withRetry, RetryPresets } from './retry-logic'
import {
  publishJobStarted,
  publishJobProgress,
  publishJobCompleted,
  publishJobFailed,
  publishExecutionStatsUpdated,
  publishExecutionCompleted,
} from './execution-events'
import { createMetricsSnapshot } from './metrics-snapshot'
import { createConcurrencyController } from './concurrency-control'

interface JobToExecute {
  id: string
  siteUrl: string
  groundTruthData?: Record<string, any> | null
  goal?: string | null
  [key: string]: any
}

/**
 * Execute EVA jobs with concurrency control and retry logic
 */
export async function executeEvaJobs(
  executionId: string,
  jobsList: JobToExecute[],
  projectInstructions: string,
  columnSchema: any[]
): Promise<void> {
  try {
    console.log(`[executeEvaJobs] Starting execution ${executionId} with ${jobsList.length} jobs`)

    // Get execution to check concurrency settings
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`)
    }

    // Check if execution is paused/stopped
    if (execution.status === 'paused' || execution.status === 'stopped') {
      console.log(`[executeEvaJobs] Execution ${executionId} is ${execution.status}, not starting jobs`)
      return
    }

    // Create concurrency controller
    const concurrency = execution.concurrency || 5
    const controller = createConcurrencyController(concurrency)

    // Track completion stats
    let completedCount = 0
    let errorCount = 0

    // Function to update execution stats
    const updateExecutionStats = async () => {
      await db.update(executions).set({
        completedJobs: completedCount,
        errorJobs: errorCount,
        runningJobs: jobsList.length - completedCount,
        lastActivityAt: new Date(),
      }).where(eq(executions.id, executionId))

      // Publish stats update event
      publishExecutionStatsUpdated({
        executionId,
        stats: {
          totalJobs: jobsList.length,
          completedJobs: completedCount,
          errorJobs: errorCount,
          runningJobs: jobsList.length - completedCount,
          queuedJobs: Math.max(0, jobsList.length - completedCount),
        },
      })
    }

    // Process all jobs with concurrency control
    const jobPromises = jobsList.map(job =>
      controller.run(async () => {
        const startTime = Date.now()

        try {
          console.log(`[executeEvaJobs] Starting job ${job.id}`)

          // Check execution status before starting job
          const currentExecution = await db.query.executions.findFirst({
            where: eq(executions.id, executionId),
          })

          if (!currentExecution || currentExecution.status === 'paused' || currentExecution.status === 'stopped') {
            console.log(`[executeEvaJobs] Execution ${executionId} is ${currentExecution?.status || 'not found'}, skipping job ${job.id}`)
            return
          }

          // Update job status to running
          await db.update(jobs).set({
            status: 'running',
            lastRunAt: new Date(),
            progressPercentage: 0,
          }).where(eq(jobs.id, job.id))

          // Create session for this job execution
          const [session] = await db.insert(sessions).values({
            jobId: job.id,
            status: 'running',
            startedAt: new Date(),
          }).returning()

          // Publish job started event
          publishJobStarted({
            executionId,
            jobId: job.id,
            batchId: execution.batchId,
            siteUrl: job.siteUrl,
            siteName: job.siteName || undefined,
            goal: job.goal || '',
          })

          // Execute EVA workflow with retry logic
          const retryResult = await withRetry(
            async () => {
              return await executeEvaWorkflow(
                job.siteUrl,
                projectInstructions,
                columnSchema,
                job.groundTruthData,
                async (url) => {
                  // Store streaming URL for live browser view
                  console.log(`[executeEvaJobs] Job ${job.id}: Stream available at ${url}`)
                  await db.update(sessions).set({
                    streamingUrl: url
                  }).where(eq(sessions.id, session.id))
                },
                async (progress, step) => {
                  // Update job progress in real-time
                  await db.update(jobs).set({
                    progressPercentage: progress,
                    currentStep: step,
                  }).where(eq(jobs.id, job.id))

                  // Publish progress event
                  publishJobProgress({
                    executionId,
                    jobId: job.id,
                    currentStep: step,
                    currentUrl: job.siteUrl,
                    progressPercentage: progress,
                  })
                }
              )
            },
            {
              ...RetryPresets.PATIENT,
              onRetry: (error, attempt) => {
                console.log(`[executeEvaJobs] Job ${job.id} retry attempt ${attempt}:`, error.message)
                db.update(sessions).set({
                  errorMessage: `Retry attempt ${attempt}: ${error.message}`,
                }).where(eq(sessions.id, session.id))
              },
            }
          )

          const executionTimeMs = Date.now() - startTime

          // Handle successful execution
          if (retryResult.success && retryResult.data) {
            const result = retryResult.data

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

            // Calculate accuracy
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

            // Publish completion event
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

            await updateExecutionStats()
          } else {
            // All retries failed
            throw retryResult.error || new Error('Execution failed after retries')
          }

        } catch (error: any) {
          console.error(`[executeEvaJobs] Job ${job.id} failed:`, error)

          const executionTimeMs = Date.now() - startTime

          // Update session as failed
          await db.update(sessions).set({
            status: 'failed',
            errorMessage: error.message,
            failureReason: 'EVA execution error',
            executionTimeMs,
            completedAt: new Date(),
          }).where(eq(sessions.jobId, job.id))

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

          await updateExecutionStats()
        }
      })
    )

    // Wait for all jobs to complete
    console.log(`[executeEvaJobs] Waiting for ${jobsList.length} jobs to complete...`)
    await Promise.allSettled(jobPromises)
    console.log(`[executeEvaJobs] All jobs completed`)

    // Check final execution status (might have been paused/stopped during execution)
    const finalExecution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })

    if (!finalExecution) {
      console.error(`[executeEvaJobs] Execution ${executionId} not found after completion`)
      return
    }

    // Only mark as completed if it wasn't paused/stopped
    if (finalExecution.status === 'running') {
      // Mark execution as completed
      await db.update(executions).set({
        status: 'completed',
        completedAt: new Date(),
        completedJobs: completedCount,
        errorJobs: errorCount,
      }).where(eq(executions.id, executionId))

      // Create metrics snapshot
      try {
        await createMetricsSnapshot(execution.batchId, executionId)
      } catch (error) {
        console.error('[executeEvaJobs] Error creating metrics snapshot:', error)
      }

      // Publish execution completed event
      publishExecutionCompleted({
        executionId,
        totalJobs: jobsList.length,
        completedJobs: completedCount,
        duration: Math.floor((Date.now() - (execution.startedAt?.getTime() || Date.now())) / 1000),
      })

      console.log(`[executeEvaJobs] Execution ${executionId} completed: ${completedCount} jobs, ${errorCount} errors`)
    } else {
      console.log(`[executeEvaJobs] Execution ${executionId} finished with status: ${finalExecution.status}`)
    }

  } catch (error) {
    console.error(`[executeEvaJobs] Fatal error in execution ${executionId}:`, error)

    // Mark execution as error
    await db.update(executions).set({
      status: 'error',
      completedAt: new Date(),
    }).where(eq(executions.id, executionId))

    throw error
  }
}

/**
 * Resume a paused execution
 * Finds incomplete jobs and restarts processing
 */
export async function resumeExecution(executionId: string): Promise<{
  success: boolean
  resumedJobs: number
  error?: string
}> {
  try {
    console.log(`[resumeExecution] Resuming execution ${executionId}`)

    // Get execution details
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
      with: {
        batch: true,
        project: true,
      },
    })

    if (!execution) {
      return { success: false, resumedJobs: 0, error: 'Execution not found' }
    }

    if (execution.status !== 'paused') {
      return { success: false, resumedJobs: 0, error: `Cannot resume execution with status: ${execution.status}` }
    }

    // Find all incomplete jobs for this execution
    const incompleteJobs = await db.query.jobs.findMany({
      where: eq(jobs.batchId, execution.batchId),
    })

    const jobsToResume = incompleteJobs.filter(job =>
      job.status === 'queued' || job.status === 'running'
    )

    if (jobsToResume.length === 0) {
      // No jobs to resume, just mark execution as completed
      await db.update(executions).set({
        status: 'completed',
        completedAt: new Date(),
      }).where(eq(executions.id, executionId))

      return { success: true, resumedJobs: 0 }
    }

    // Update execution status to running
    await db.update(executions).set({
      status: 'running',
      resumedAt: new Date(),
      lastActivityAt: new Date(),
    }).where(eq(executions.id, executionId))

    // Reset jobs to queued status
    await db.update(jobs)
      .set({ status: 'queued', lastRunAt: null })
      .where(eq(jobs.batchId, execution.batchId))

    console.log(`[resumeExecution] Resuming ${jobsToResume.length} jobs`)

    // Get batch column schema
    const columnSchema = (execution.batch.columnSchema as any[]) || []

    // Restart execution in background
    executeEvaJobs(executionId, jobsToResume as any[], execution.project.instructions, columnSchema)
      .catch(err => console.error('[resumeExecution] Error during resumed execution:', err))

    return { success: true, resumedJobs: jobsToResume.length }

  } catch (error: any) {
    console.error('[resumeExecution] Error:', error)
    return { success: false, resumedJobs: 0, error: error.message }
  }
}
