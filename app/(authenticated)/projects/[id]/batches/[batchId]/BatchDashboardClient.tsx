'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '@/lib/useWebSocket'
import { LiveExecutionSection } from '@/components/batch-dashboard/LiveExecutionSection'
import { ExecutionCompletionCard } from '@/components/ExecutionCompletionCard'
import { JobsTable } from '@/components/JobsTable'
import { Button } from '@/components/Button'
import { PlayCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BatchDashboardClientProps {
  projectId: string
  batchId: string
  columnSchema: Array<{
    name: string
    type: string
    isGroundTruth: boolean
    isUrl: boolean
  }>
  hasGroundTruth: boolean
  totalSites: number
}

type ExecutionState = 'idle' | 'running' | 'paused' | 'completed' | 'stopped'

interface ActiveExecution {
  id: string
  status: string
  startedAt?: string
  completedAt?: string
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
}

export function BatchDashboardClient({
  projectId,
  batchId,
  columnSchema,
  hasGroundTruth,
  totalSites,
}: BatchDashboardClientProps) {
  const router = useRouter()
  const [executionState, setExecutionState] = useState<ExecutionState>('idle')
  const [activeExecution, setActiveExecution] = useState<ActiveExecution | null>(null)
  const [lastCompletedExecution, setLastCompletedExecution] = useState<ActiveExecution | null>(null)
  const [showCompletionCard, setShowCompletionCard] = useState(false)
  const { status: wsStatus, subscribe } = useWebSocket()

  // Check for active execution on mount
  const checkActiveExecution = useCallback(async () => {
    try {
      // Check if there's a running execution for this batch
      const response = await fetch(`/api/batches/${batchId}/active-execution`)
      if (response.ok) {
        const data = await response.json()
        if (data.execution) {
          setActiveExecution(data)
          setExecutionState(data.execution.status === 'paused' ? 'paused' : 'running')
        } else {
          setExecutionState('idle')
        }
      }
    } catch (error) {
      console.error('Error checking active execution:', error)
    }
  }, [batchId])

  // Initial check
  useEffect(() => {
    checkActiveExecution()
  }, [checkActiveExecution])

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      // Only process events for this batch
      if (event.data.batchId !== batchId) return

      switch (event.type) {
        case 'execution_started':
          setExecutionState('running')
          setShowCompletionCard(false)
          checkActiveExecution()
          break

        case 'execution_paused':
          setExecutionState('paused')
          break

        case 'execution_resumed':
          setExecutionState('running')
          break

        case 'execution_stopped':
        case 'execution_completed':
          const finalStats = event.data.stats || activeExecution?.stats
          if (activeExecution && finalStats) {
            setLastCompletedExecution({
              ...activeExecution,
              status: event.type === 'execution_stopped' ? 'stopped' : 'completed',
              completedAt: new Date().toISOString(),
              stats: finalStats,
            })
          }
          setExecutionState(event.type === 'execution_stopped' ? 'stopped' : 'completed')
          setShowCompletionCard(true)
          // Auto-hide completion card after 5 minutes and transition to idle
          setTimeout(() => {
            setShowCompletionCard(false)
            setExecutionState('idle')
          }, 5 * 60 * 1000)
          break

        case 'execution_stats_updated':
        case 'job_started':
        case 'job_completed':
        case 'job_failed':
        case 'job_progress':
          // Refresh active execution data
          checkActiveExecution()
          break

        case 'concurrency_changed':
          if (activeExecution) {
            setActiveExecution({
              ...activeExecution,
              ...event.data,
            })
          }
          break
      }
    })

    return unsubscribe
  }, [subscribe, batchId, activeExecution, checkActiveExecution])

  // Execution control handlers
  const handlePause = async () => {
    if (!activeExecution) return
    try {
      const response = await fetch(`/api/executions/${activeExecution.id}/pause`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to pause execution')
    } catch (err) {
      console.error('Error pausing execution:', err)
      alert('Failed to pause execution')
    }
  }

  const handleResume = async () => {
    if (!activeExecution) return
    try {
      const response = await fetch(`/api/executions/${activeExecution.id}/resume`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to resume execution')
    } catch (err) {
      console.error('Error resuming execution:', err)
      alert('Failed to resume execution')
    }
  }

  const handleStop = async () => {
    if (!activeExecution) return
    const confirmed = confirm('Are you sure you want to stop this execution? This cannot be undone.')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/executions/${activeExecution.id}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User stopped execution from batch dashboard' }),
      })
      if (!response.ok) throw new Error('Failed to stop execution')
    } catch (err) {
      console.error('Error stopping execution:', err)
      alert('Failed to stop execution')
    }
  }

  const handleRerunFailed = async () => {
    if (!lastCompletedExecution) return
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
      alert('Failed to rerun jobs')
    }
  }

  const handleExport = async () => {
    if (!lastCompletedExecution) return
    try {
      const response = await fetch(`/api/executions/${lastCompletedExecution.id}/export`)
      if (!response.ok) throw new Error('Failed to export results')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `execution-${lastCompletedExecution.id}-results.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting results:', err)
      alert('Failed to export results')
    }
  }

  return (
    <div className="space-y-6">
      {/* RUNNING STATE - Live Execution Section */}
      {(executionState === 'running' || executionState === 'paused') && activeExecution && (
        <LiveExecutionSection
          projectId={projectId}
          batchId={batchId}
          executionId={activeExecution.id}
          stats={activeExecution.stats}
          runningJobs={activeExecution.runningJobs}
          status={activeExecution.status}
          startedAt={activeExecution.startedAt}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
        />
      )}

      {/* COMPLETED STATE - Completion Card */}
      {(executionState === 'completed' || executionState === 'stopped') && showCompletionCard && lastCompletedExecution && (
        <ExecutionCompletionCard
          projectId={projectId}
          batchId={batchId}
          executionId={lastCompletedExecution.id}
          stats={{
            totalJobs: lastCompletedExecution.stats.totalJobs,
            completedJobs: lastCompletedExecution.stats.completedJobs,
            errorJobs: lastCompletedExecution.stats.errorJobs,
            passedJobs: lastCompletedExecution.stats.passedJobs,
            failedJobs: lastCompletedExecution.stats.failedJobs,
            passRate: lastCompletedExecution.stats.passRate,
          }}
          duration={
            lastCompletedExecution.startedAt && lastCompletedExecution.completedAt
              ? new Date(lastCompletedExecution.completedAt).getTime() - new Date(lastCompletedExecution.startedAt).getTime()
              : undefined
          }
          onRerunFailed={handleRerunFailed}
          onExport={handleExport}
        />
      )}

      {/* IDLE STATE - Simple CTA */}
      {executionState === 'idle' && !showCompletionCard && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Run Tests</h3>
          <p className="text-sm text-gray-600 mb-4">
            {totalSites} jobs configured and ready to execute
          </p>
          <Button variant="primary" onClick={() => router.refresh()}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Run Test Execution
          </Button>
        </div>
      )}

      {/* Jobs Table - Always visible with real-time updates when running */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Jobs</h2>
        <JobsTable
          projectId={projectId}
          batchId={batchId}
          columnSchema={columnSchema}
          realTimeUpdates={executionState === 'running' || executionState === 'paused'}
          pollInterval={executionState === 'running' || executionState === 'paused' ? 2000 : 10000}
        />
      </div>
    </div>
  )
}
