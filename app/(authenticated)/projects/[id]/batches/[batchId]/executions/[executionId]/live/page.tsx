'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { useWebSocket } from '@/lib/useWebSocket'
import { LiveStatsPanel, type LiveStats } from '@/components/live-stats-panel'
import { LiveExecutionGrid, type RunningJob } from '@/components/live-execution-grid'
import { ExecutionControls } from '@/components/execution-controls'
import { ExecutionCompletionCard } from '@/components/ExecutionCompletionCard'

interface ExecutionData {
  executionId: string
  status: string
  concurrency: number
  startedAt?: string
  stats: LiveStats
  runningJobs: RunningJob[]
}

export default function LiveExecutionPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const batchId = params.batchId as string
  const executionId = params.executionId as string

  const [executionData, setExecutionData] = useState<ExecutionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const { status: wsStatus, subscribe } = useWebSocket()

  // Fetch initial execution data
  const fetchExecutionData = useCallback(async () => {
    try {
      const response = await fetch(`/api/executions/${executionId}/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch execution data')
      }
      const data = await response.json()
      setExecutionData(data)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('Error fetching execution data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load execution')
    } finally {
      setLoading(false)
    }
  }, [executionId])

  // Initial data fetch
  useEffect(() => {
    fetchExecutionData()
  }, [fetchExecutionData])

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      // Only process events for this execution
      if (event.data.executionId !== executionId) return

      setLastUpdate(new Date())

      switch (event.type) {
        case 'execution_paused':
        case 'execution_resumed':
        case 'execution_stopped':
        case 'execution_completed':
        case 'execution_stats_updated':
        case 'concurrency_changed':
          // Refetch execution data for major state changes
          fetchExecutionData()
          break

        case 'job_started':
        case 'job_progress':
        case 'job_completed':
        case 'job_failed':
          // Update stats in real-time (optimistic update)
          // Could be more sophisticated, but refetching is simpler and safer
          fetchExecutionData()
          break
      }
    })

    return unsubscribe
  }, [subscribe, executionId, fetchExecutionData])

  // Execution control handlers
  const handlePause = async () => {
    try {
      const response = await fetch(`/api/executions/${executionId}/pause`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to pause execution')
      await fetchExecutionData()
    } catch (err) {
      console.error('Error pausing execution:', err)
      setError(err instanceof Error ? err.message : 'Failed to pause')
    }
  }

  const handleResume = async () => {
    try {
      const response = await fetch(`/api/executions/${executionId}/resume`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to resume execution')
      await fetchExecutionData()
    } catch (err) {
      console.error('Error resuming execution:', err)
      setError(err instanceof Error ? err.message : 'Failed to resume')
    }
  }

  const handleStop = async () => {
    const confirmed = confirm('Are you sure you want to stop this execution? This cannot be undone.')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/executions/${executionId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User stopped execution from live monitor' }),
      })
      if (!response.ok) throw new Error('Failed to stop execution')
      await fetchExecutionData()
    } catch (err) {
      console.error('Error stopping execution:', err)
      setError(err instanceof Error ? err.message : 'Failed to stop')
    }
  }

  const handleConcurrencyChange = async (newConcurrency: number) => {
    try {
      const response = await fetch(`/api/executions/${executionId}/concurrency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurrency: newConcurrency }),
      })
      if (!response.ok) throw new Error('Failed to change concurrency')
      await fetchExecutionData()
    } catch (err) {
      console.error('Error changing concurrency:', err)
      setError(err instanceof Error ? err.message : 'Failed to change concurrency')
    }
  }

  const handleRerunFailed = async () => {
    try {
      // Get failed job IDs
      const response = await fetch(`/api/batches/${batchId}/jobs?status=error`)
      if (!response.ok) throw new Error('Failed to fetch failed jobs')
      const { jobs } = await response.json()

      if (jobs.length === 0) {
        alert('No failed jobs to rerun')
        return
      }

      const confirmed = confirm(`Rerun ${jobs.length} failed job(s)?`)
      if (!confirmed) return

      // Trigger bulk rerun
      const rerunResponse = await fetch('/api/jobs/bulk/rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: jobs.map((j: any) => j.id),
          executionType: 'test',
          useAgentQL: true,
        }),
      })

      if (!rerunResponse.ok) throw new Error('Failed to rerun jobs')

      const result = await rerunResponse.json()

      // Navigate to new execution's live page
      router.push(`/projects/${projectId}/batches/${batchId}/executions/${result.execution.id}/live`)
    } catch (err) {
      console.error('Error rerunning failed jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to rerun jobs')
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/executions/${executionId}/export`)
      if (!response.ok) throw new Error('Failed to export results')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `execution-${executionId}-results.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting results:', err)
      setError(err instanceof Error ? err.message : 'Failed to export')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-stone-400 mx-auto mb-3" />
          <p className="text-stone-600">Loading execution data...</p>
        </div>
      </div>
    )
  }

  if (error || !executionData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load execution'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/projects/${projectId}/batches/${batchId}/executions/${executionId}`}
            className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 flex items-center gap-3">
                Live Execution Monitor
                {wsStatus.connected && (
                  <span className="flex items-center gap-2 text-sm font-normal text-green-600">
                    <span className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
              </h1>
              <p className="text-sm text-stone-600 mt-1">
                Status: <span className="font-medium">{executionData.status}</span>
                {' • '}
                Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExecutionData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Execution Controls */}
        {executionData.status === 'running' && (
          <ExecutionControls
            executionId={executionId}
            status={executionData.status}
            concurrency={executionData.concurrency}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onConcurrencyChange={handleConcurrencyChange}
          />
        )}

        {/* Completion Card - shown when execution is done */}
        {(executionData.status === 'completed' || executionData.status === 'stopped') && (
          <ExecutionCompletionCard
            projectId={projectId}
            batchId={batchId}
            executionId={executionId}
            stats={{
              totalJobs: executionData.stats.totalJobs,
              completedJobs: executionData.stats.completedJobs,
              errorJobs: executionData.stats.errorJobs,
              passedJobs: executionData.stats.passedJobs,
              failedJobs: executionData.stats.failedJobs,
              passRate: executionData.stats.passRate ?? undefined,
            }}
            duration={
              executionData.startedAt
                ? new Date().getTime() - new Date(executionData.startedAt).getTime()
                : undefined
            }
            onRerunFailed={handleRerunFailed}
            onExport={handleExport}
          />
        )}

        {/* Live Stats */}
        <LiveStatsPanel
          stats={executionData.stats}
          status={executionData.status}
        />

        {/* Running Agents Grid */}
        {executionData.status === 'running' && (
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              Running Agents ({executionData.runningJobs.length})
            </h2>
            <LiveExecutionGrid
              runningJobs={executionData.runningJobs}
              maxDisplay={6}
            />
          </div>
        )}

        {/* Show message when completed */}
        {(executionData.status === 'completed' || executionData.status === 'stopped') && executionData.runningJobs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-stone-200">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <p className="text-lg font-medium text-stone-900 mb-1">All agents completed</p>
            <p className="text-sm text-stone-600">No agents are currently running</p>
          </div>
        )}

        {/* WebSocket Status */}
        {!wsStatus.connected && (
          <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              {wsStatus.reconnecting
                ? 'Reconnecting to live updates...'
                : wsStatus.error || 'Disconnected from live updates'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
