'use client'

import { useState } from 'react'
import { Pause, Play, Square, Maximize2, Activity, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { LiveExecutionGrid } from '@/components/live-execution-grid'
import Link from 'next/link'

interface LiveExecutionSectionProps {
  projectId: string
  batchId: string
  executionId: string
  stats: {
    totalJobs: number
    completedJobs: number
    runningJobs: number
    queuedJobs: number
    errorJobs: number
    passedJobs?: number
    failedJobs?: number
    passRate?: number
  }
  runningJobs: Array<{
    id: string
    siteUrl: string
    siteName?: string | null
    currentStep?: string | null
    currentUrl?: string | null
    progressPercentage?: number
    startedAt?: Date | string | null
    createdAt?: Date | string | null
    lastActivityAt?: Date | string | null
  }>
  status: string
  startedAt?: string
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
}

export function LiveExecutionSection({
  projectId,
  batchId,
  executionId,
  stats,
  runningJobs,
  status,
  startedAt,
  onPause,
  onResume,
  onStop,
}: LiveExecutionSectionProps) {
  const [showAllAgents, setShowAllAgents] = useState(false)

  const progressPercentage = stats.totalJobs > 0
    ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
    : 0

  const elapsedTime = startedAt
    ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  const isPaused = status === 'paused'
  const displayAgents = showAllAgents ? runningJobs : runningJobs.slice(0, 3)

  return (
    <div className="space-y-4 mb-6">
      {/* Live Status Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className={`h-5 w-5 ${isPaused ? 'text-amber-600' : 'text-blue-600 animate-pulse'}`} />
                <h3 className="text-lg font-bold text-stone-900">
                  {isPaused ? '⏸ Execution Paused' : '🔴 Live Execution in Progress'}
                </h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-blue-200">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">{formatTime(elapsedTime)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status === 'running' && onPause && (
                <Button size="sm" variant="outline" onClick={onPause}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              {status === 'paused' && onResume && (
                <Button size="sm" variant="primary" onClick={onResume}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              {onStop && (
                <Button size="sm" variant="outline" onClick={onStop} className="text-red-600 hover:bg-red-50">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
              <Link href={`/projects/${projectId}/batches/${batchId}/executions/${executionId}/live`}>
                <Button size="sm" variant="outline">
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Full Screen
                </Button>
              </Link>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{stats.completedJobs}</div>
              <div className="text-xs text-stone-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-2xl font-bold text-emerald-600">{stats.runningJobs}</div>
              <div className="text-xs text-stone-600">Running</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-2xl font-bold text-stone-600">{stats.queuedJobs}</div>
              <div className="text-xs text-stone-600">Queued</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-2xl font-bold text-red-600">{stats.errorJobs}</div>
              <div className="text-xs text-stone-600">Errors</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <div className="text-2xl font-bold text-amber-600">{progressPercentage}%</div>
              </div>
              <div className="text-xs text-stone-600">Progress</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-stone-700">
                {stats.completedJobs} of {stats.totalJobs} jobs completed
              </span>
              <span className="font-bold text-blue-700">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Running Agents Section */}
      {runningJobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600 animate-pulse" />
              Running Agents ({runningJobs.length})
            </h3>
            {runningJobs.length > 3 && (
              <button
                onClick={() => setShowAllAgents(!showAllAgents)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {showAllAgents ? 'Show Less' : `Show All ${runningJobs.length} Agents →`}
              </button>
            )}
          </div>

          <LiveExecutionGrid runningJobs={displayAgents} maxDisplay={showAllAgents ? 999 : 3} />
        </div>
      )}
    </div>
  )
}
