'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertCircle, Clock, TrendingUp, Play } from 'lucide-react'

export interface LiveStats {
  totalJobs: number
  completedJobs: number
  runningJobs: number
  queuedJobs: number
  errorJobs: number
  evaluatedJobs?: number
  passedJobs?: number
  failedJobs?: number
  passRate?: number | null
  progressPercentage: number
  estimatedTimeRemaining?: number | null
}

interface LiveStatsPanelProps {
  stats: LiveStats
  status: string
}

export function LiveStatsPanel({ stats, status }: LiveStatsPanelProps) {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-stone-700">Overall Progress</span>
              <span className="text-sm font-semibold text-stone-900">
                {stats.completedJobs} / {stats.totalJobs}
              </span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  status === 'running' ? 'bg-blue-600' :
                  status === 'paused' ? 'bg-amber-600' :
                  status === 'completed' ? 'bg-green-600' :
                  'bg-stone-400'
                }`}
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-600">{stats.progressPercentage}% complete</span>
              {stats.estimatedTimeRemaining && stats.estimatedTimeRemaining > 0 && (
                <span className="text-stone-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(stats.estimatedTimeRemaining)} remaining
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold text-green-700">
                  {stats.completedJobs}
                </div>
                <div className="text-xs text-green-600 font-medium">Completed</div>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold text-blue-700">
                  {stats.runningJobs}
                </div>
                <div className="text-xs text-blue-600 font-medium">Running</div>
              </div>
              <Play className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-stone-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold text-stone-700">
                  {stats.queuedJobs}
                </div>
                <div className="text-xs text-stone-600 font-medium">Queued</div>
              </div>
              <AlertCircle className="h-6 w-6 text-stone-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold text-red-700">
                  {stats.errorJobs}
                </div>
                <div className="text-xs text-red-600 font-medium">Failed</div>
              </div>
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy (if ground truth is available) */}
      {stats.passRate !== null && stats.passRate !== undefined && stats.evaluatedJobs && stats.evaluatedJobs > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-semibold text-amber-800">
                  {stats.passRate.toFixed(1)}%
                </div>
                <div className="text-sm text-amber-700 font-medium">
                  Accuracy ({stats.passedJobs}/{stats.evaluatedJobs} passed)
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-700" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
