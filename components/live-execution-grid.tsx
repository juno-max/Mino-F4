'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Globe, Loader2, ExternalLink } from 'lucide-react'

export interface RunningJob {
  id: string
  siteUrl: string
  siteName?: string | null
  currentStep?: string | null
  currentUrl?: string | null
  progressPercentage?: number
  startedAt?: Date | string | null
}

interface LiveExecutionGridProps {
  runningJobs: RunningJob[]
  maxDisplay?: number
}

export function LiveExecutionGrid({ runningJobs, maxDisplay = 6 }: LiveExecutionGridProps) {
  const displayJobs = runningJobs.slice(0, maxDisplay)

  if (displayJobs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="text-center text-stone-500 py-8">
            <Globe className="h-12 w-12 mx-auto mb-3 text-stone-400" />
            <p className="text-sm">No agents currently running</p>
            <p className="text-xs text-stone-400 mt-1">Jobs will appear here when execution starts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayJobs.map((job) => {
        const progress = job.progressPercentage || 0
        const elapsedTime = job.startedAt
          ? Math.floor((Date.now() - new Date(job.startedAt).getTime()) / 1000)
          : 0

        return (
          <Card key={job.id} className="border-blue-200 bg-blue-50 animate-pulse-subtle">
            <CardContent className="pt-4 pb-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-semibold text-blue-900 truncate">
                      {job.siteName || 'Agent'}
                    </span>
                  </div>
                  <div className="text-xs text-blue-700 truncate flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {job.siteUrl}
                  </div>
                </div>
              </div>

              {/* Current Activity */}
              {job.currentStep && (
                <div className="mb-3 p-2 bg-white rounded border border-blue-200">
                  <div className="text-xs font-medium text-stone-700 mb-1">
                    Current Step
                  </div>
                  <div className="text-xs text-stone-600 line-clamp-2">
                    {job.currentStep}
                  </div>
                </div>
              )}

              {/* Current URL */}
              {job.currentUrl && job.currentUrl !== job.siteUrl && (
                <div className="mb-3">
                  <div className="text-xs text-blue-700 truncate flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{job.currentUrl}</span>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700 font-medium">Progress</span>
                  <span className="text-blue-900 font-semibold">{progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Elapsed Time */}
              <div className="mt-2 text-xs text-blue-600 text-center">
                {elapsedTime > 0 && (
                  <span>
                    {elapsedTime < 60
                      ? `${elapsedTime}s elapsed`
                      : `${Math.floor(elapsedTime / 60)}m ${elapsedTime % 60}s elapsed`}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Add subtle pulse animation to globals.css
// @keyframes pulse-subtle {
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.95; }
// }
// .animate-pulse-subtle {
//   animation: pulse-subtle 2s ease-in-out infinite;
// }
