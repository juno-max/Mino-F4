'use client'

import { Button } from '@/components/Button'
import { Pause, Square, PlayCircle, Target, CheckCircle, Zap, XCircle, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { MetricCard } from './MetricCard'
import { Sparkline } from './Sparkline'
import { LiveAgentCard } from './LiveAgentCard'

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Calculate elapsed time
  useEffect(() => {
    if (!startedAt) return

    const updateElapsed = () => {
      const start = new Date(startedAt)
      const now = new Date()
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
      setElapsedSeconds(diff)

      const minutes = Math.floor(diff / 60)
      const seconds = diff % 60
      setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  // Calculate metrics
  const progressPercent = stats.totalJobs > 0
    ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
    : 0

  const successRate = stats.completedJobs > 0
    ? Math.round(((stats.passedJobs || 0) / stats.completedJobs) * 100)
    : 100

  const errorRate = stats.completedJobs > 0
    ? Math.round((stats.errorJobs / stats.completedJobs) * 100)
    : 0

  // Estimate completion time
  const estimateCompletion = () => {
    if (!startedAt || stats.completedJobs === 0) return '—'

    const start = new Date(startedAt).getTime()
    const now = new Date().getTime()
    const elapsed = (now - start) / 1000 // seconds
    const rate = stats.completedJobs / elapsed // jobs per second
    const remaining = stats.totalJobs - stats.completedJobs
    const estimatedSeconds = Math.round(remaining / rate)

    if (estimatedSeconds < 60) return `${estimatedSeconds}s`
    const minutes = Math.floor(estimatedSeconds / 60)
    if (minutes < 60) return `~${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `~${hours}h ${minutes % 60}m`
  }

  // Generate sparkline data (mock for now - could be real historical data)
  const successTrend = Array.from({ length: 10 }, (_, i) => {
    // Simulate improving success rate over time
    return Math.min(100, successRate - 20 + i * 2 + Math.random() * 5)
  })

  const isPaused = status === 'paused'

  return (
    <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top row: Title + Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse shadow-lg">
              <PlayCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isPaused ? 'Execution Paused' : 'Batch Executing'}
              </h2>
              <p className="text-sm text-gray-600">{elapsedTime} elapsed</p>
            </div>
          </div>

          {/* Execution controls */}
          <div className="flex items-center gap-2">
            {isPaused ? (
              <Button size="sm" variant="primary" onClick={onResume}>
                <PlayCircle className="h-4 w-4 mr-1.5" />
                Resume
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onPause}>
                <Pause className="h-4 w-4 mr-1.5" />
                Pause
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onStop}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Square className="h-4 w-4 mr-1.5" />
              Stop
            </Button>
          </div>
        </div>

        {/* Metrics grid - Visual, compact, scannable */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {/* Progress */}
          <MetricCard
            icon={<Target className="h-5 w-5 text-blue-500" />}
            label="Progress"
            value={`${stats.completedJobs}/${stats.totalJobs}`}
            subtitle={`${progressPercent}%`}
            color="blue"
            trend={
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            }
          />

          {/* Success Rate */}
          <MetricCard
            icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
            label="Success"
            value={`${stats.passedJobs || 0}`}
            subtitle={`${successRate}% pass`}
            color="emerald"
            trend={<Sparkline data={successTrend} color="emerald" />}
          />

          {/* Running */}
          <MetricCard
            icon={<Zap className="h-5 w-5 text-blue-500 animate-pulse" />}
            label="Running"
            value={stats.runningJobs}
            subtitle="Active agents"
            color="blue"
            trend={
              runningJobs.length > 0 ? (
                <div className="text-[10px] text-gray-600 truncate">
                  {runningJobs.slice(0, 2).map(j =>
                    (j.siteName || j.siteUrl).split('/')[0].replace('www.', '')
                  ).join(', ')}
                  {runningJobs.length > 2 && ` +${runningJobs.length - 2}`}
                </div>
              ) : undefined
            }
          />

          {/* Errors */}
          <MetricCard
            icon={<XCircle className="h-5 w-5 text-red-500" />}
            label="Errors"
            value={stats.errorJobs}
            subtitle={errorRate > 10 ? '⚠️ High rate' : errorRate > 0 ? 'Normal' : 'None'}
            color={errorRate > 10 ? 'red' : errorRate > 0 ? 'amber' : 'gray'}
          />

          {/* ETA */}
          <MetricCard
            icon={<Clock className="h-5 w-5 text-gray-500" />}
            label="Est. Completion"
            value={estimateCompletion()}
            subtitle={`${stats.totalJobs - stats.completedJobs} left`}
            color="gray"
            trend={
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1 bg-gray-200 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      elapsedSeconds < 120 ? 'bg-emerald-500' :
                      elapsedSeconds < 300 ? 'bg-blue-500' :
                      elapsedSeconds < 600 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(elapsedSeconds / 600 * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500">
                  {elapsedSeconds < 60 ? `${elapsedSeconds}s` :
                   elapsedSeconds < 3600 ? `${Math.floor(elapsedSeconds / 60)}m` :
                   `${Math.floor(elapsedSeconds / 3600)}h`}
                </span>
              </div>
            }
          />
        </div>

        {/* Live agents preview - Compact horizontal scroll */}
        {runningJobs.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-700">Live Agents</span>
              <span className="text-xs text-gray-500">({runningJobs.length} running)</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {runningJobs.map(job => (
                <LiveAgentCard key={job.id} job={job} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
