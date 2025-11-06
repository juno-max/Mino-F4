'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Loader2, Globe, Clock } from 'lucide-react'
import { formatDistance } from 'date-fns'

interface RunningJob {
  id: string
  siteUrl: string
  siteName: string | null
  currentStep: string | null
  progressPercentage: number
  createdAt: string
  lastActivityAt: string | null
}

interface RunningAgentsProps {
  batchId: string
}

export function RunningAgents({ batchId }: RunningAgentsProps) {
  const [runningJobs, setRunningJobs] = useState<RunningJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRunningJobs = async () => {
      try {
        const response = await fetch(`/api/batches/${batchId}/jobs?status=running`)
        if (response.ok) {
          const result = await response.json()
          const jobs = Array.isArray(result.data) ? result.data : []
          setRunningJobs(jobs)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching running jobs:', error)
        setLoading(false)
      }
    }

    fetchRunningJobs()

    // Poll every 1 second for very responsive updates
    const pollInterval = setInterval(() => {
      fetchRunningJobs()
    }, 1000)

    return () => clearInterval(pollInterval)
  }, [batchId])

  if (loading) {
    return null
  }

  if (runningJobs.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Running Agents ({runningJobs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {runningJobs.map((job) => {
            const now = new Date()
            const createdAt = new Date(job.createdAt)
            const elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000)
            const elapsed = formatDistance(createdAt, now, { includeSeconds: true })

            // Determine current action with better fallbacks
            let currentAction = job.currentStep
            let isStalled = false

            if (!currentAction || currentAction.trim() === '') {
              // No progress yet - show helpful message based on elapsed time
              if (elapsedSeconds < 10) {
                currentAction = '🔄 Connecting to agent...'
              } else if (elapsedSeconds < 30) {
                currentAction = '🌐 Initializing browser session...'
              } else if (elapsedSeconds < 60) {
                currentAction = '⏳ Loading page (this may take a moment)...'
              } else {
                currentAction = '⚠️ Agent is taking longer than expected'
                isStalled = true
              }
            }

            // Check if job is stalled (no activity and high elapsed time)
            const lastActivity = job.lastActivityAt ? new Date(job.lastActivityAt) : createdAt
            const timeSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / 1000)
            if (timeSinceActivity > 90 && job.progressPercentage === 0) {
              isStalled = true
            }

            return (
              <div
                key={job.id}
                className={`p-4 border-2 rounded-lg ${
                  isStalled
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start gap-2 mb-3">
                  <Loader2 className={`h-5 w-5 animate-spin mt-0.5 flex-shrink-0 ${
                    isStalled ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm mb-1 ${
                      isStalled ? 'text-yellow-900' : 'text-blue-900'
                    }`}>
                      {job.siteName || 'Agent'}
                    </h4>
                    <div className={`flex items-center gap-1 text-xs mb-2 ${
                      isStalled ? 'text-yellow-700' : 'text-blue-700'
                    }`}>
                      <Globe className="h-3 w-3 flex-shrink-0" />
                      <a
                        href={job.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                        title={job.siteUrl}
                      >
                        {job.siteUrl}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Current Action */}
                <div className="mb-3">
                  <div className={`text-xs font-medium mb-1 ${
                    isStalled ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    Current Action:
                  </div>
                  <div className={`text-sm px-2 py-1.5 rounded border ${
                    isStalled
                      ? 'text-yellow-900 bg-white/60 border-yellow-200'
                      : 'text-blue-900 bg-white/60 border-blue-200'
                  }`}>
                    {currentAction}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className={`flex items-center justify-between text-xs mb-1 ${
                    isStalled ? 'text-yellow-700' : 'text-blue-700'
                  }`}>
                    <span className="font-medium">Progress</span>
                    <span className="font-semibold">{job.progressPercentage}%</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${
                    isStalled ? 'bg-yellow-200' : 'bg-blue-200'
                  }`}>
                    <div
                      className={`h-full transition-all duration-500 ${
                        isStalled ? 'bg-yellow-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${job.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Elapsed Time */}
                <div className={`flex items-center gap-1 text-xs ${
                  isStalled ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                  <Clock className="h-3 w-3" />
                  <span>{elapsed} elapsed</span>
                  {isStalled && (
                    <span className="ml-2 text-yellow-700 font-medium">
                      (Slow response)
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
