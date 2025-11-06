/**
 * Execution Event Publisher
 *
 * Centralized module for publishing real-time execution events via WebSocket.
 * All execution-related events are broadcast to connected clients for live monitoring.
 */

// Event types for live execution monitoring
export type ExecutionEventType =
  | 'execution_started'
  | 'execution_paused'
  | 'execution_resumed'
  | 'execution_stopped'
  | 'execution_completed'
  | 'execution_stats_updated'
  | 'job_started'
  | 'job_progress'
  | 'job_completed'
  | 'job_failed'
  | 'job_retry'
  | 'concurrency_changed'

export interface ExecutionEvent {
  type: ExecutionEventType
  timestamp: string
  data: any
}

// Event data interfaces
export interface ExecutionStartedData {
  executionId: string
  batchId: string
  projectId: string
  totalJobs: number
  concurrency: number
  executionType: 'test' | 'production'
}

export interface ExecutionPausedData {
  executionId: string
  reason?: string
}

export interface ExecutionResumedData {
  executionId: string
}

export interface ExecutionStoppedData {
  executionId: string
  reason: string
}

export interface ExecutionCompletedData {
  executionId: string
  completedJobs: number
  totalJobs: number
  passRate?: number
  duration: number
}

export interface ExecutionStatsData {
  executionId: string
  stats: {
    totalJobs: number
    completedJobs: number
    runningJobs: number
    queuedJobs: number
    errorJobs: number
    evaluatedJobs?: number
    passedJobs?: number
    failedJobs?: number
    passRate?: number
  }
}

export interface JobStartedData {
  executionId: string
  jobId: string
  batchId: string
  siteUrl: string
  siteName?: string
  goal: string
}

export interface JobProgressData {
  executionId: string
  jobId: string
  currentStep: string
  currentUrl: string
  progressPercentage: number
}

export interface JobCompletedData {
  executionId: string
  jobId: string
  status: 'completed'
  duration: number
  extractedData?: any
  isEvaluated?: boolean
  evaluationResult?: 'pass' | 'fail'
}

export interface JobFailedData {
  executionId: string
  jobId: string
  status: 'error'
  errorMessage: string
  failureReason?: string
}

export interface JobRetryData {
  executionId: string
  jobId: string
  retryCount: number
  retryReason: string
}

export interface ConcurrencyChangedData {
  executionId: string
  oldConcurrency: number
  newConcurrency: number
}

// Store broadcast function in global to survive webpack hot reloads
// This will be set by the server when it initializes
declare global {
  var __wsbroadcast: ((event: ExecutionEvent) => number) | undefined
}

/**
 * Initialize the execution event publisher with the WebSocket broadcast function
 */
export function initializeExecutionEvents(broadcast: (message: any) => number) {
  global.__wsbroadcast = broadcast
  console.log('[ExecutionEvents] Initialized with WebSocket broadcast function')
}

// Get broadcast function from global
function getBroadcastFn(): ((event: ExecutionEvent) => number) | null {
  return global.__wsbroadcast || null
}

/**
 * Publish an execution event to all connected WebSocket clients and persist to database
 */
async function publishEvent(type: ExecutionEventType, data: any): Promise<number> {
  const event: ExecutionEvent = {
    type,
    timestamp: new Date().toISOString(),
    data,
  }

  // Persist event to database (fire and forget - don't block WebSocket broadcast)
  persistEvent(event).catch(err => {
    console.error('[ExecutionEvents] Failed to persist event to database:', err)
  })

  // Publish to Redis for multi-server scaling (fire and forget)
  publishToRedis(event).catch(err => {
    console.error('[ExecutionEvents] Failed to publish to Redis:', err)
  })

  const broadcast = getBroadcastFn()
  if (broadcast) {
    return broadcast(event)
  } else {
    console.warn('[ExecutionEvents] Broadcast function not initialized, event not sent:', type)
    return 0
  }
}

/**
 * Publish event to Redis for other servers
 */
async function publishToRedis(event: ExecutionEvent): Promise<void> {
  try {
    const { publishToRedis: redisPublish } = await import('./redis-pubsub')
    await redisPublish(event)
  } catch (error) {
    // Silently fail - Redis is optional
  }
}

/**
 * Persist event to database for replay and history
 */
async function persistEvent(event: ExecutionEvent): Promise<void> {
  try {
    // Dynamic import to avoid circular dependencies
    const { db, executionEvents } = await import('@/db')

    // Extract filtering fields from event data
    const executionId = event.data.executionId || null
    const batchId = event.data.batchId || null
    const jobId = event.data.jobId || null
    const organizationId = event.data.organizationId || null

    // Calculate expiry (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await db.insert(executionEvents).values({
      type: event.type,
      timestamp: new Date(event.timestamp),
      data: event.data,
      executionId,
      batchId,
      jobId,
      organizationId,
      expiresAt,
    })
  } catch (error) {
    // Don't throw - we don't want to break WebSocket broadcast if DB fails
    console.error('[ExecutionEvents] Error persisting event:', error)
  }
}

// Public API for publishing execution events

export function publishExecutionStarted(data: ExecutionStartedData) {
  publishEvent('execution_started', data)
}

export function publishExecutionPaused(data: ExecutionPausedData) {
  publishEvent('execution_paused', data)
}

export function publishExecutionResumed(data: ExecutionResumedData) {
  publishEvent('execution_resumed', data)
}

export function publishExecutionStopped(data: ExecutionStoppedData) {
  publishEvent('execution_stopped', data)
}

export function publishExecutionCompleted(data: ExecutionCompletedData) {
  publishEvent('execution_completed', data)
}

export function publishExecutionStatsUpdated(data: ExecutionStatsData) {
  publishEvent('execution_stats_updated', data)
}

export function publishJobStarted(data: JobStartedData) {
  publishEvent('job_started', data)
}

export function publishJobProgress(data: JobProgressData) {
  publishEvent('job_progress', data)
}

export function publishJobCompleted(data: JobCompletedData) {
  publishEvent('job_completed', data)
}

export function publishJobFailed(data: JobFailedData) {
  publishEvent('job_failed', data)
}

export function publishJobRetry(data: JobRetryData) {
  publishEvent('job_retry', data)
}

export function publishConcurrencyChanged(data: ConcurrencyChangedData) {
  publishEvent('concurrency_changed', data)
}

// Helper function to check if events can be published
export function isPublisherReady(): boolean {
  return getBroadcastFn() !== null
}
