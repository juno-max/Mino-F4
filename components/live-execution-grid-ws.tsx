'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWebSocket } from '@/lib/useWebSocket'
import type { ExecutionEvent, JobProgressData, JobStartedData, JobCompletedData, JobFailedData } from '@/lib/execution-events'
import { LiveExecutionGrid, RunningJob } from './live-execution-grid'

interface LiveExecutionGridWSProps {
  batchId: string
  /** Fallback polling interval in ms (default: 5000). Set to 0 to disable polling */
  pollingInterval?: number
  maxDisplay?: number
}

/**
 * WebSocket-powered Live Execution Grid
 *
 * Features:
 * - Real-time updates via WebSocket
 * - Automatic fallback to polling if WebSocket fails
 * - Connection status indicator
 * - Event-driven updates (no unnecessary API calls)
 */
export function LiveExecutionGridWS({
  batchId,
  pollingInterval = 5000,
  maxDisplay = 6
}: LiveExecutionGridWSProps) {
  const { status, subscribe } = useWebSocket()
  const [runningJobs, setRunningJobs] = useState<Map<string, RunningJob>>(new Map())
  const [isPollingFallback, setIsPollingFallback] = useState(false)

  // Fetch jobs from API (used for initial load and polling fallback)
  const fetchRunningJobs = useCallback(async () => {
    try {
      const response = await fetch(`/api/batches/${batchId}/jobs?status=running`)
      if (!response.ok) throw new Error('Failed to fetch running jobs')

      const data = await response.json()
      const jobs = data.data || []

      // Update running jobs map
      setRunningJobs(prev => {
        const newMap = new Map(prev)

        // Update existing jobs
        jobs.forEach((job: any) => {
          newMap.set(job.id, {
            id: job.id,
            siteUrl: job.siteUrl,
            siteName: job.siteName,
            currentStep: job.currentStep,
            currentUrl: job.currentUrl,
            progressPercentage: job.progressPercentage,
            startedAt: job.lastRunAt,
            createdAt: job.createdAt,
            lastActivityAt: job.lastActivityAt,
          })
        })

        // Remove jobs that are no longer running
        const runningJobIds = new Set(jobs.map((j: any) => j.id))
        Array.from(newMap.keys()).forEach(jobId => {
          if (!runningJobIds.has(jobId)) {
            newMap.delete(jobId)
          }
        })

        return newMap
      })
    } catch (error) {
      console.error('[LiveExecutionGridWS] Error fetching jobs:', error)
    }
  }, [batchId])

  // Handle WebSocket events
  useEffect(() => {
    const handleEvent = (event: ExecutionEvent) => {
      // Only process events for this batch
      if ('batchId' in event.data && event.data.batchId !== batchId) {
        return
      }

      switch (event.type) {
        case 'job_started': {
          const data = event.data as JobStartedData
          setRunningJobs(prev => {
            const newMap = new Map(prev)
            newMap.set(data.jobId, {
              id: data.jobId,
              siteUrl: data.siteUrl,
              siteName: data.siteName,
              currentStep: 'Starting...',
              currentUrl: data.siteUrl,
              progressPercentage: 0,
              startedAt: new Date(),
              createdAt: new Date(),
              lastActivityAt: new Date(),
            })
            return newMap
          })
          break
        }

        case 'job_progress': {
          const data = event.data as JobProgressData
          setRunningJobs(prev => {
            const existing = prev.get(data.jobId)
            if (!existing) return prev

            const newMap = new Map(prev)
            newMap.set(data.jobId, {
              ...existing,
              currentStep: data.currentStep,
              currentUrl: data.currentUrl,
              progressPercentage: data.progressPercentage,
              lastActivityAt: new Date(),
            })
            return newMap
          })
          break
        }

        case 'job_completed':
        case 'job_failed': {
          const data = event.data as JobCompletedData | JobFailedData
          setRunningJobs(prev => {
            const newMap = new Map(prev)
            newMap.delete(data.jobId)
            return newMap
          })
          break
        }
      }
    }

    // Subscribe to WebSocket events
    const unsubscribe = subscribe(handleEvent)
    return unsubscribe
  }, [batchId, subscribe])

  // Initial load
  useEffect(() => {
    fetchRunningJobs()
  }, [fetchRunningJobs])

  // Polling fallback when WebSocket is disconnected
  useEffect(() => {
    if (!status.connected && pollingInterval > 0) {
      setIsPollingFallback(true)
      const interval = setInterval(fetchRunningJobs, pollingInterval)
      return () => {
        clearInterval(interval)
        setIsPollingFallback(false)
      }
    } else {
      setIsPollingFallback(false)
    }
  }, [status.connected, pollingInterval, fetchRunningJobs])

  // Debug info
  useEffect(() => {
    if (status.connected) {
      console.log('[LiveExecutionGridWS] Connected via WebSocket ✅')
    } else if (isPollingFallback) {
      console.log('[LiveExecutionGridWS] Using polling fallback 🔄')
    }
  }, [status.connected, isPollingFallback])

  return (
    <div className="relative">
      {/* WebSocket status indicator (optional - can be removed) */}
      {!status.connected && (
        <div className="mb-2 text-xs text-amber-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Live updates temporarily unavailable, using fallback mode
        </div>
      )}

      <LiveExecutionGrid
        runningJobs={Array.from(runningJobs.values())}
        maxDisplay={maxDisplay}
      />
    </div>
  )
}
