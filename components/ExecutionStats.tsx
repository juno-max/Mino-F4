'use client'

import { Execution } from '@/db/schema'
import { Clock, CheckCircle, XCircle, PlayCircle, PauseCircle, StopCircle, Loader2 } from 'lucide-react'

interface ExecutionStatsProps {
  execution: Execution | null
  connected: boolean
}

export function ExecutionStats({ execution, connected }: ExecutionStatsProps) {
  if (!execution) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Loading execution data...</span>
        </div>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (execution.status) {
      case 'running':
        return <PlayCircle className="h-5 w-5 text-green-500" />
      case 'paused':
        return <PauseCircle className="h-5 w-5 text-yellow-500" />
      case 'stopped':
        return <StopCircle className="h-5 w-5 text-red-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (execution.status) {
      case 'running':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'stopped':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const progressPercentage = execution.totalJobs > 0
    ? Math.round((execution.completedJobs / execution.totalJobs) * 100)
    : 0

  const failedJobsCount = execution.errorJobs || 0
  const failureRate = execution.totalJobs > 0
    ? Math.round((failedJobsCount / execution.totalJobs) * 100)
    : 0

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Execution Status
              </h2>
              <p className="text-sm text-gray-500">
                {execution.executionType === 'production' ? 'Production' : 'Test'} Run
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {execution.status.toUpperCase()}
            </span>
            <div className="flex items-center text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-gray-600">
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-medium text-gray-900">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
          <span>{execution.completedJobs} of {execution.totalJobs} jobs completed</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        {/* Queued */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Queued</span>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {execution.queuedJobs}
          </p>
        </div>

        {/* Running */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600">Running</span>
            <PlayCircle className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-blue-900">
            {execution.runningJobs}
          </p>
          <p className="mt-1 text-xs text-blue-600">
            Concurrency: {execution.concurrency}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600">Completed</span>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-900">
            {execution.completedJobs}
          </p>
        </div>

        {/* Failed */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-600">Failed</span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-red-900">
            {failedJobsCount}
          </p>
          {failureRate > 0 && (
            <p className="mt-1 text-xs text-red-600">
              Failure rate: {failureRate}%
            </p>
          )}
        </div>
      </div>


      {/* Timestamps */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 space-y-1">
        {execution.startedAt && (
          <div className="flex justify-between">
            <span>Started:</span>
            <span className="font-medium">{new Date(execution.startedAt).toLocaleString()}</span>
          </div>
        )}
        {execution.completedAt && (
          <div className="flex justify-between">
            <span>Completed:</span>
            <span className="font-medium">{new Date(execution.completedAt).toLocaleString()}</span>
          </div>
        )}
        {execution.stopReason && (
          <div className="flex justify-between">
            <span>Stop reason:</span>
            <span className="font-medium text-red-600">{execution.stopReason}</span>
          </div>
        )}
      </div>
    </div>
  )
}
