'use client'

import { CheckCircle, XCircle, TrendingUp, Eye, RefreshCw, Download, BarChart3, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'

interface ExecutionCompletionCardProps {
  projectId: string
  batchId: string
  executionId: string
  stats: {
    totalJobs: number
    completedJobs: number
    errorJobs: number
    passedJobs?: number
    failedJobs?: number
    passRate?: number
  }
  duration?: number
  onRerunFailed?: () => void
  onExport?: () => void
}

export function ExecutionCompletionCard({
  projectId,
  batchId,
  executionId,
  stats,
  duration,
  onRerunFailed,
  onExport,
}: ExecutionCompletionCardProps) {
  const hasFailures = stats.errorJobs > 0 || (stats.failedJobs && stats.failedJobs > 0)
  const allSuccess = stats.completedJobs === stats.totalJobs && !hasFailures

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {allSuccess ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-orange-600" />
            )}
            <div>
              <CardTitle className="text-xl">
                {allSuccess ? 'Execution Completed Successfully' : 'Execution Completed'}
              </CardTitle>
              <p className="text-sm text-stone-600 mt-1">
                {allSuccess
                  ? 'All jobs completed without errors'
                  : hasFailures
                  ? `${stats.errorJobs} job${stats.errorJobs !== 1 ? 's' : ''} encountered errors`
                  : 'Review results below'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-amber-700">
              {stats.passRate !== undefined ? `${Math.round(stats.passRate)}%` : '-'}
            </div>
            <div className="text-xs text-stone-600">Pass Rate</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-stone-200">
            <div className="text-2xl font-semibold text-green-600">
              {stats.completedJobs}
            </div>
            <div className="text-xs text-stone-600 mt-1">Completed</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-stone-200">
            <div className="text-2xl font-semibold text-red-600">
              {stats.errorJobs}
            </div>
            <div className="text-xs text-stone-600 mt-1">Failed</div>
          </div>

          {stats.passedJobs !== undefined && (
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-stone-200">
              <div className="text-2xl font-semibold text-green-600">
                {stats.passedJobs}
              </div>
              <div className="text-xs text-stone-600 mt-1">Passed Tests</div>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-stone-200">
            <div className="text-2xl font-semibold text-stone-900">
              {formatDuration(duration)}
            </div>
            <div className="text-xs text-stone-600 mt-1">Duration</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Primary Actions */}
          <Link href={`/projects/${projectId}/batches/${batchId}/executions/${executionId}`} className="flex-1 min-w-[200px]">
            <Button className="w-full" variant="primary">
              <Eye className="h-4 w-4 mr-2" />
              View Full Results
            </Button>
          </Link>

          <Link href={`/projects/${projectId}/batches/${batchId}/analytics`} className="flex-1 min-w-[200px]">
            <Button className="w-full" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>

          {/* Conditional Actions */}
          {hasFailures && onRerunFailed && (
            <Button
              className="flex-1 min-w-[200px]"
              variant="outline"
              onClick={onRerunFailed}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rerun Failed Jobs ({stats.errorJobs})
            </Button>
          )}

          {onExport && (
            <Button
              className="flex-1 min-w-[200px]"
              variant="outline"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          )}

          <Link href={`/projects/${projectId}/batches/${batchId}`} className="flex-1 min-w-[200px]">
            <Button className="w-full" variant="outline">
              <PlayCircle className="h-4 w-4 mr-2" />
              New Execution
            </Button>
          </Link>
        </div>

        {/* Success Message */}
        {allSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 text-center">
              🎉 All jobs completed successfully! Your batch execution has finished without any errors.
            </p>
          </div>
        )}

        {/* Failure Suggestions */}
        {hasFailures && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800 mb-2 font-medium">
              💡 Next Steps for Failed Jobs:
            </p>
            <ul className="text-sm text-orange-700 space-y-1 ml-4 list-disc">
              <li>Review error messages in the full results page</li>
              <li>Check if sites have changed their structure</li>
              <li>Update selectors or instructions if needed</li>
              <li>Rerun failed jobs after making adjustments</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
