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

// In-memory store for broadcast function
// This will be set by the server when it initializes
let broadcastFn: ((event: ExecutionEvent) => number) | null = null

/**
 * Initialize the execution event publisher with the WebSocket broadcast function
 */
export function initializeExecutionEvents(broadcast: (message: any) => number) {
  broadcastFn = broadcast
  console.log('[ExecutionEvents] Initialized with WebSocket broadcast function')
}

/**
 * Publish an execution event to all connected WebSocket clients
 */
function publishEvent(type: ExecutionEventType, data: any): number {
  const event: ExecutionEvent = {
    type,
    timestamp: new Date().toISOString(),
    data,
  }

  if (broadcastFn) {
    return broadcastFn(event)
  } else {
    console.warn('[ExecutionEvents] Broadcast function not initialized, event not sent:', type)
    return 0
  }
}

// Public API for publishing execution events

export function publishExecutionStarted(data: ExecutionStartedData) {
  return publishEvent('execution_started', data)
}

export function publishExecutionPaused(data: ExecutionPausedData) {
  return publishEvent('execution_paused', data)
}

export function publishExecutionResumed(data: ExecutionResumedData) {
  return publishEvent('execution_resumed', data)
}

export function publishExecutionStopped(data: ExecutionStoppedData) {
  return publishEvent('execution_stopped', data)
}

export function publishExecutionCompleted(data: ExecutionCompletedData) {
  return publishEvent('execution_completed', data)
}

export function publishExecutionStatsUpdated(data: ExecutionStatsData) {
  return publishEvent('execution_stats_updated', data)
}

export function publishJobStarted(data: JobStartedData) {
  return publishEvent('job_started', data)
}

export function publishJobProgress(data: JobProgressData) {
  return publishEvent('job_progress', data)
}

export function publishJobCompleted(data: JobCompletedData) {
  return publishEvent('job_completed', data)
}

export function publishJobFailed(data: JobFailedData) {
  return publishEvent('job_failed', data)
}

export function publishJobRetry(data: JobRetryData) {
  return publishEvent('job_retry', data)
}

export function publishConcurrencyChanged(data: ConcurrencyChangedData) {
  return publishEvent('concurrency_changed', data)
}

// Helper function to check if events can be published
export function isPublisherReady(): boolean {
  return broadcastFn !== null
}
