'use client'

/**
 * Live Agents Inline Component
 * Shows real-time progress of running jobs in an expandable section
 * Uses fintech UI design system
 */

import { useState, useEffect } from 'react'
import { ChevronDown, Zap, Clock } from 'lucide-react'

interface RunningJob {
  id: string
  siteUrl: string
  progress: number
  currentStep: string
  elapsedTime: number
  lastActivityAt?: Date
}

export interface LiveAgentsInlineProps {
  batchId: string
}

export function LiveAgentsInline({ batchId }: LiveAgentsInlineProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [runningJobs, setRunningJobs] = useState<RunningJob[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch running jobs
  useEffect(() => {
    const fetchRunningJobs = async () => {
      try {
        const response = await fetch(`/api/batches/${batchId}/jobs?status=running`)
        if (response.ok) {
          const data = await response.json()
          const jobs = data.jobs
            .filter((job: any) => job.status === 'running')
            .map((job: any) => ({
              id: job.id,
              siteUrl: job.siteUrl,
              progress: job.progressPercentage || 0,
              currentStep: job.currentStep || 'Processing...',
              elapsedTime: job.executionDurationMs || 0,
              lastActivityAt: job.lastActivityAt ? new Date(job.lastActivityAt) : undefined,
            }))
          setRunningJobs(jobs)
        }
      } catch (error) {
        console.error('Error fetching running jobs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRunningJobs()

    // Poll every 2 seconds while expanded
    let interval: NodeJS.Timeout | null = null
    if (isExpanded) {
      interval = setInterval(fetchRunningJobs, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [batchId, isExpanded])

  // Auto-expand when jobs are running
  useEffect(() => {
    if (runningJobs.length > 0 && !isExpanded) {
      setIsExpanded(true)
    }
  }, [runningJobs.length])

  // Don't render if no running jobs
  if (!isLoading && runningJobs.length === 0) {
    return null
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Check if job is stalled (no activity for >90s)
  const isStalled = (job: RunningJob) => {
    if (!job.lastActivityAt) return false
    const timeSinceActivity = Date.now() - job.lastActivityAt.getTime()
    return timeSinceActivity > 90000
  }

  return (
    <div className="bg-white border border-blue-200 rounded-lg shadow-fintech-sm">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="h-5 w-5 text-blue-500 animate-pulse-subtle" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-ping" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-gray-900">
              {runningJobs.length} {runningJobs.length === 1 ? 'agent' : 'agents'} running
            </span>
            {!isExpanded && (
              <p className="text-xs text-gray-500 mt-0.5">
                Click to expand and see live progress
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-3 border-t border-blue-100">
          <div className="pt-4 space-y-2">
            {runningJobs.map((job) => {
              const stalled = isStalled(job)

              return (
                <div
                  key={job.id}
                  className={`
                    p-4 rounded-lg border transition-all
                    ${stalled ? 'border-amber-200 bg-amber-50' : 'border-blue-100 bg-blue-50/50'}
                  `}
                >
                  {/* URL and Progress */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Zap className={`h-4 w-4 flex-shrink-0 ${stalled ? 'text-amber-500' : 'text-blue-500'}`} />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {job.siteUrl}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-blue-600 ml-2">
                      {job.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        stalled ? 'bg-amber-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>

                  {/* Status and Time */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={stalled ? 'text-amber-700 font-medium' : 'text-gray-600'}>
                      {stalled ? '⚠️ Taking longer than expected' : job.currentStep}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(job.elapsedTime)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Auto-refresh indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span>Auto-refreshing every 2 seconds</span>
          </div>
        </div>
      )}
    </div>
  )
}
