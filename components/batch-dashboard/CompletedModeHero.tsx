'use client'

import { Button } from '@/components/Button'
import { CheckCircle2, PlayCircle, Edit3, BarChart3, Download, RotateCcw } from 'lucide-react'

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
  isTestRun?: boolean // Was this a test run (10 jobs) or full batch?
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
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const qualityGrade =
    stats.errorJobs === 0 ? 'A' :
    stats.errorJobs <= stats.totalJobs * 0.1 ? 'B' :
    stats.errorJobs <= stats.totalJobs * 0.3 ? 'C' :
    'D'

  const qualityColor =
    qualityGrade === 'A' ? 'text-emerald-600 bg-emerald-50' :
    qualityGrade === 'B' ? 'text-blue-600 bg-blue-50' :
    qualityGrade === 'C' ? 'text-yellow-600 bg-yellow-50' :
    'text-red-600 bg-red-50'

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-fintech-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isTestRun ? 'Test Run Complete' : 'Execution Complete'}
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              ⏱ {formatDuration(duration)} total
            </p>
          </div>
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
          <div className="text-xs text-emerald-600 mt-1">100%</div>
        </div>

        {/* Running */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-gray-400 mb-1">
            0/{stats.totalJobs}
          </div>
          <div className="text-sm text-gray-500 font-medium">RUNNING</div>
          <div className="text-xs text-gray-500 mt-1">0%</div>
        </div>

        {/* Queued */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-gray-400 mb-1">
            0/{stats.totalJobs}
          </div>
          <div className="text-sm text-gray-500 font-medium">QUEUED</div>
          <div className="text-xs text-gray-500 mt-1">0%</div>
        </div>

        {/* Failed */}
        <div className={`${stats.errorJobs > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
          <div className={`text-3xl font-bold mb-1 ${stats.errorJobs > 0 ? 'text-red-700' : 'text-gray-400'}`}>
            {stats.errorJobs}/{stats.totalJobs}
          </div>
          <div className={`text-sm font-medium ${stats.errorJobs > 0 ? 'text-red-600' : 'text-gray-500'}`}>
            FAILED
          </div>
          <div className={`text-xs mt-1 ${stats.errorJobs > 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {Math.round((stats.errorJobs / stats.totalJobs) * 100)}%
          </div>
        </div>

        {/* Results Quality */}
        <div className={`border-2 rounded-lg p-4 ${qualityColor}`}>
          <div className="text-sm font-semibold text-gray-700 mb-2">Results</div>
          <div className={`text-3xl font-bold mb-1 ${qualityColor.replace('bg-', 'text-').replace('-50', '-700')}`}>
            Quality: {qualityGrade}
          </div>
          <div className="text-xs space-y-0.5">
            <div>{stats.completedJobs - stats.errorJobs}/{stats.totalJobs} ✓</div>
            {hasGroundTruth && stats.passRate !== null && (
              <div>Pass: {stats.passRate}%</div>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-emerald-900">
          <span className="text-xl">🎉</span>
          <span className="font-medium">
            {stats.errorJobs === 0
              ? 'All tasks completed successfully!'
              : `${stats.completedJobs - stats.errorJobs} tasks completed successfully, ${stats.errorJobs} failed.`
            }
          </span>
        </div>
      </div>

      {/* Ground Truth Reminder (if not set up) */}
      {!hasGroundTruth && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="text-sm text-yellow-900 font-medium mb-2">
                No ground truth set up - can't measure accuracy yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onSetupGroundTruth}
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Set Up Ground Truth Now
              </Button>
              <span className="text-xs text-yellow-700 ml-2">to see pass/fail results</span>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🚀</span>
          Next Steps:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Set Up GT */}
          {!hasGroundTruth && (
            <div className="border-2 border-emerald-300 rounded-lg p-4 bg-emerald-50">
              <div className="text-emerald-700 font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Set Up GT
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Measure accuracy for future runs
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={onSetupGroundTruth}
                className="w-full"
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Improve Instructions */}
          <div className="border border-gray-300 rounded-lg p-4 bg-white hover:border-emerald-300 transition-colors">
            <div className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              🔧 Improve
            </div>
            <p className="text-sm text-gray-700 mb-3">
              {stats.errorJobs > 0
                ? 'Edit and re-run failed tasks'
                : 'Edit and re-test to optimize'
              }
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onEditInstructions}
              className="w-full"
            >
              Edit & Test
            </Button>
          </div>

          {/* Run Full or View Analytics */}
          {isTestRun ? (
            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
              <div className="text-blue-700 font-semibold mb-2 flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Run All
              </div>
              <p className="text-sm text-gray-700 mb-1 font-medium">
                ({totalSitesInBatch.toLocaleString()} sites)
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Ready to scale?
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={onRunFull}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Start Full Run
              </Button>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 bg-white hover:border-emerald-300 transition-colors">
              <div className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </div>
              <p className="text-sm text-gray-700 mb-3">
                View detailed insights
              </p>
              <a href={`/projects/${projectId}/batches/${batchId}/analytics`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  View Analytics
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        {stats.errorJobs > 0 && onRetryFailed && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRetryFailed}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry {stats.errorJobs} Failed Task{stats.errorJobs > 1 ? 's' : ''}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </Button>

        <a
          href={`/projects/${projectId}/batches/${batchId}/executions/${executionId}`}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View Full Execution Details →
        </a>
      </div>
    </div>
  )
}
