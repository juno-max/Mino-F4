'use client'

import { Button } from '@/components/Button'
import { Pause, Square, Settings, ExternalLink, PlayCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface RunningModeHeroProps {
  executionId: string
  projectId: string
  batchId: string
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
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onAdjustConcurrency?: (newValue: number) => void
}

export function RunningModeHero({
  executionId,
  projectId,
  batchId,
  stats,
  runningJobs,
  status,
  startedAt,
  onPause,
  onResume,
  onStop,
  onAdjustConcurrency,
}: RunningModeHeroProps) {
  const [elapsedTime, setElapsedTime] = useState('')

  // Calculate elapsed time
  useEffect(() => {
    if (!startedAt) return

    const updateElapsed = () => {
      const start = new Date(startedAt)
      const now = new Date()
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000)

      const minutes = Math.floor(diff / 60)
      const seconds = diff % 60
      setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  // Calculate progress percentage
  const progressPercent = stats.totalJobs > 0
    ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
    : 0

  // Calculate health score (simple algorithm)
  const successRate = stats.completedJobs > 0
    ? (stats.completedJobs - stats.errorJobs) / stats.completedJobs
    : 1
  const healthScore = Math.round(successRate * 100)
  const healthColor =
    healthScore >= 90 ? 'text-emerald-600' :
    healthScore >= 70 ? 'text-yellow-600' :
    'text-red-600'
  const healthIcon =
    healthScore >= 90 ? '🟢' :
    healthScore >= 70 ? '🟡' :
    '🔴'

  // Estimate completion time
  const estimateCompletion = () => {
    if (!startedAt || stats.completedJobs === 0) return '—'

    const start = new Date(startedAt).getTime()
    const now = new Date().getTime()
    const elapsed = (now - start) / 1000 // seconds
    const rate = stats.completedJobs / elapsed // jobs per second
    const remaining = stats.totalJobs - stats.completedJobs
    const estimatedSeconds = Math.round(remaining / rate)

    const minutes = Math.floor(estimatedSeconds / 60)
    const seconds = estimatedSeconds % 60
    return `${minutes}m ${seconds}s`
  }

  const isPaused = status === 'paused'

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-fintech-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-2xl font-bold text-gray-900">
              {isPaused ? 'Execution Paused' : 'Test Run In Progress'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>⏱</span>
          <span className="font-mono font-semibold">{elapsedTime}</span>
          <span className="text-gray-400">elapsed</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Completed */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-emerald-700 mb-1">
            {stats.completedJobs}/{stats.totalJobs}
          </div>
          <div className="text-sm text-emerald-600 font-medium">DONE ✅</div>
          <div className="text-xs text-emerald-600 mt-1">
            {Math.round((stats.completedJobs / stats.totalJobs) * 100)}%
          </div>
        </div>

        {/* Running */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-700 mb-1">
            {stats.runningJobs}/{stats.totalJobs}
          </div>
          <div className="text-sm text-blue-600 font-medium flex items-center gap-1">
            RUNNING
            {stats.runningJobs > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            )}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {Math.round((stats.runningJobs / stats.totalJobs) * 100)}%
          </div>
        </div>

        {/* Queued */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-gray-700 mb-1">
            {stats.queuedJobs}/{stats.totalJobs}
          </div>
          <div className="text-sm text-gray-600 font-medium">QUEUED</div>
          <div className="text-xs text-gray-600 mt-1">
            {Math.round((stats.queuedJobs / stats.totalJobs) * 100)}%
          </div>
        </div>

        {/* Failed */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-red-700 mb-1">
            {stats.errorJobs}/{stats.totalJobs}
          </div>
          <div className="text-sm text-red-600 font-medium">FAILED</div>
          <div className="text-xs text-red-600 mt-1">
            {Math.round((stats.errorJobs / stats.totalJobs) * 100)}%
          </div>
        </div>

        {/* Health */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">Health</div>
          <div className={`text-3xl font-bold ${healthColor} mb-1 flex items-center gap-2`}>
            {healthIcon} {healthScore}
          </div>
          <div className="text-xs text-gray-600 space-y-0.5">
            <div className="flex items-center gap-1">
              {successRate >= 0.9 ? '✅' : '⚠️'} Success
            </div>
            <div className="flex items-center gap-1">
              ✅ Quality
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span className="font-medium">Progress</span>
          <span className="font-semibold">{progressPercent}%</span>
        </div>
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          Estimated completion: {estimateCompletion()}
        </div>
      </div>

      {/* Active Agents Preview */}
      {runningJobs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Active Agents ({runningJobs.length} running)
            </h3>
            <a
              href={`/projects/${projectId}/batches/${batchId}/executions/${executionId}/live`}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View All
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2">
            {runningJobs.slice(0, 2).map((job) => (
              <div
                key={job.id}
                className="bg-gradient-to-r from-blue-50 to-transparent border border-blue-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="font-medium text-gray-900 truncate">
                      {job.siteName || job.siteUrl}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-sm text-gray-600 truncate">
                      {job.currentStep || 'Processing...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <div className="text-sm font-semibold text-blue-600">
                      {job.progressPercentage || 0}%
                    </div>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${job.progressPercentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {isPaused ? (
          <Button variant="primary" onClick={onResume}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Resume
          </Button>
        ) : (
          <Button variant="outline" onClick={onPause}>
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        )}

        <Button variant="outline" onClick={onStop} className="text-red-600 border-red-300 hover:bg-red-50">
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          <Settings className="h-4 w-4 text-gray-500" />
          <label className="text-sm text-gray-600">Concurrency:</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            defaultValue="5"
            onChange={(e) => onAdjustConcurrency?.(parseInt(e.target.value))}
          >
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
      </div>
    </div>
  )
}
