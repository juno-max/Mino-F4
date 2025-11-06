'use client'

import { Button } from '@/components/Button'
import { CheckCircle, Target, Clock, Download, Play, AlertTriangle, RefreshCw } from 'lucide-react'
import { MetricCard } from './MetricCard'
import { DonutChart } from './DonutChart'
import { ErrorBadge } from './ErrorBadge'

interface CompletedModeHeroProps {
  executionId: string
  projectId: string
  batchId: string
  stats: {
    totalJobs: number
    completedJobs: number
    errorJobs: number
    passedJobs?: number
    failedJobs?: number
    passRate?: number
  }
  duration?: number // milliseconds
  hasGroundTruth: boolean
  onSetupGroundTruth: () => void
  onEditInstructions: () => void
  onRunFull: () => void
  onExport: () => void
  onRetryFailed?: () => void
  isTestRun?: boolean
  totalSitesInBatch: number
}

export function CompletedModeHero({
  executionId,
  projectId,
  batchId,
  stats,
  duration,
  hasGroundTruth,
  onSetupGroundTruth,
  onEditInstructions,
  onRunFull,
  onExport,
  onRetryFailed,
  isTestRun = false,
  totalSitesInBatch,
}: CompletedModeHeroProps) {
  const formatDuration = (ms?: number) => {
    if (!ms) return '—'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
      return `${minutes}m ${seconds % 60}s`
    }
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  const avgDuration = duration && stats.totalJobs > 0
    ? formatDuration(duration / stats.totalJobs)
    : '—'

  const passRate = hasGroundTruth && stats.passRate !== undefined
    ? stats.passRate
    : stats.totalJobs > 0
    ? Math.round(((stats.completedJobs - stats.errorJobs) / stats.totalJobs) * 100)
    : 0

  const successJobs = stats.completedJobs - stats.errorJobs

  // Group errors by type (mock data - would come from actual error analysis)
  const topErrors = stats.errorJobs > 0 ? [
    { type: 'timeout' as const, count: Math.ceil(stats.errorJobs * 0.6), message: 'Page load timeout' },
    { type: 'selector' as const, count: Math.floor(stats.errorJobs * 0.4), message: 'Element not found' },
  ].filter(e => e.count > 0) : []

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Success header with animation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isTestRun ? 'Test Run Completed' : 'Batch Completed Successfully'}
              </h2>
              <p className="text-sm text-gray-600">
                {stats.totalJobs} jobs processed in {formatDuration(duration)}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={onExport}>
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            {isTestRun && (
              <Button size="sm" variant="outline" onClick={onRunFull}>
                <Play className="h-4 w-4 mr-1.5" />
                Run Full ({totalSitesInBatch})
              </Button>
            )}
          </div>
        </div>

        {/* Visual summary - donut chart + key metrics */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {/* Left: Donut chart of pass/fail */}
          <div className="flex items-center justify-center">
            <DonutChart
              data={[
                { label: 'Passed', value: successJobs, color: 'emerald' },
                { label: 'Failed', value: stats.errorJobs, color: 'red' },
              ]}
              centerText={`${passRate}%`}
              centerLabel="Pass Rate"
            />
          </div>

          {/* Right: Key metrics grid */}
          <div className="col-span-3 grid grid-cols-3 gap-3">
            <MetricCard
              icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
              label="Data Extracted"
              value={`${successJobs}/${stats.totalJobs}`}
              subtitle={`${Math.round((successJobs / stats.totalJobs) * 100)}% success`}
              color="emerald"
            />

            <MetricCard
              icon={<Target className="h-5 w-5 text-blue-500" />}
              label="Avg Accuracy"
              value={hasGroundTruth && stats.passRate ? `${stats.passRate}%` : 'N/A'}
              subtitle={hasGroundTruth ? 'vs ground truth' : 'Set up GT'}
              color={hasGroundTruth ? 'blue' : 'gray'}
            />

            <MetricCard
              icon={<Clock className="h-5 w-5 text-gray-500" />}
              label="Avg Duration"
              value={avgDuration}
              subtitle={`Total: ${formatDuration(duration)}`}
              color="gray"
            />
          </div>
        </div>

        {/* Top errors (if any) */}
        {stats.errorJobs > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                {stats.errorJobs} job{stats.errorJobs > 1 ? 's' : ''} failed
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {topErrors.map(error => (
                <ErrorBadge key={error.type} error={error} />
              ))}
            </div>
            {onRetryFailed && (
              <Button size="sm" variant="outline" onClick={onRetryFailed} className="border-red-300 text-red-700 hover:bg-red-100">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry {stats.errorJobs} failed job{stats.errorJobs > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        )}

        {/* Ground truth reminder */}
        {!hasGroundTruth && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-900">
                  Set up ground truth to measure accuracy
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={onSetupGroundTruth} className="border-amber-300 text-amber-700 hover:bg-amber-100">
                Set Up Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
