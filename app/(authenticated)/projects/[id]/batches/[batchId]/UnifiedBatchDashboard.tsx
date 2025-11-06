'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useWebSocket } from '@/lib/useWebSocket'
import { FileText, CheckCircle, Download, Play } from 'lucide-react'
import { Button } from '@/components/Button'
import { ProgressiveButtonGroup } from '@/components/ProgressiveButtonGroup'
import { toast } from '@/lib/toast'

// Hero components
import { RunningModeHero } from '@/components/batch-dashboard/RunningModeHero'
import { CompletedModeHero } from '@/components/batch-dashboard/CompletedModeHero'

// Configuration components
import { InstructionsEditor } from '@/components/batch-dashboard/InstructionsEditor'
import { GroundTruthConfigurator } from '@/components/batch-dashboard/GroundTruthConfigurator'
import { ExportConfigurator, ExportConfig } from '@/components/batch-dashboard/ExportConfigurator'

// Table component
import { JobsTableV3 } from '@/components/JobsTableV3'

interface UnifiedBatchDashboardProps {
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
  campaignInstructions: string
}

type DashboardState = 'setup' | 'running' | 'paused' | 'completed' | 'idle'

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

export function UnifiedBatchDashboard({
  projectId,
  batchId,
  columnSchema,
  hasGroundTruth: initialHasGT,
  totalSites,
  campaignInstructions,
}: UnifiedBatchDashboardProps) {
  const router = useRouter()
  const [dashboardState, setDashboardState] = useState<DashboardState>('setup')
  const [activeExecution, setActiveExecution] = useState<ActiveExecution | null>(null)
  const [lastCompletedExecution, setLastCompletedExecution] = useState<ActiveExecution | null>(null)
  const [showCompletionCard, setShowCompletionCard] = useState(false)
  const [hasGroundTruth, setHasGroundTruth] = useState(initialHasGT)

  // Dropdown states
  const [showInstructions, setShowInstructions] = useState(false)
  const [showGroundTruth, setShowGroundTruth] = useState(false)
  const [showExport, setShowExport] = useState(false)

  // Refs for click outside
  const instructionsRef = useRef<HTMLDivElement>(null)
  const gtRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  const { status: wsStatus, subscribe } = useWebSocket()

  // Check for active execution on mount
  const checkActiveExecution = useCallback(async () => {
    try {
      const response = await fetch(`/api/batches/${batchId}/active-execution`)
      if (response.ok) {
        const data = await response.json()
        if (data.execution) {
          setActiveExecution(data)
          setDashboardState(data.execution.status === 'paused' ? 'paused' : 'running')
        } else {
          // Check if we have any executions (if yes, idle, if no, setup)
          const execsResponse = await fetch(`/api/executions?batchId=${batchId}`)
          if (execsResponse.ok) {
            const execsData = await execsResponse.json()
            setDashboardState(execsData.executions && execsData.executions.length > 0 ? 'idle' : 'setup')
          } else {
            setDashboardState('setup')
          }
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
      if (event.data.batchId !== batchId) return

      switch (event.type) {
        case 'execution_started':
          setDashboardState('running')
          setShowCompletionCard(false)
          checkActiveExecution()
          toast.batch.executionStarted(
            event.data.batchName || 'Batch',
            event.data.totalJobs || 0
          )
          break

        case 'execution_paused':
          setDashboardState('paused')
          toast.batch.executionPaused(event.data.batchName || 'Batch')
          break

        case 'execution_resumed':
          setDashboardState('running')
          toast.batch.executionResumed(event.data.batchName || 'Batch')
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

            // Show completion toast
            if (event.type === 'execution_completed') {
              const duration = activeExecution.startedAt
                ? new Date().getTime() - new Date(activeExecution.startedAt).getTime()
                : 0

              toast.batch.executionCompleted(
                event.data.batchName || 'Batch',
                {
                  totalJobs: finalStats.totalJobs,
                  successJobs: finalStats.completedJobs - finalStats.errorJobs,
                  errorJobs: finalStats.errorJobs,
                  duration,
                }
              )
            }
          }
          setDashboardState('completed')
          setShowCompletionCard(true)
          // Auto-transition to idle after 5 minutes
          setTimeout(() => {
            setShowCompletionCard(false)
            setDashboardState('idle')
          }, 5 * 60 * 1000)
          break

        case 'execution_stats_updated':
          checkActiveExecution()
          break

        case 'job_started':
          checkActiveExecution()
          break

        case 'job_completed':
          checkActiveExecution()
          // Show toast for job completion
          if (event.data.siteUrl) {
            toast.job.completed(event.data.siteUrl, {
              accuracy: event.data.accuracy,
              onView: () => router.push(`/projects/${projectId}/batches/${batchId}?job=${event.data.jobId}`)
            })
          }
          break

        case 'job_failed':
          checkActiveExecution()
          // Show toast for job failure
          if (event.data.siteUrl) {
            toast.job.failed(
              event.data.siteUrl,
              event.data.error || 'Unknown error',
              {
                onRetry: async () => {
                  // TODO: Implement retry single job
                  console.log('Retry job:', event.data.jobId)
                }
              }
            )
          }
          break

        case 'job_progress':
          checkActiveExecution()
          break
      }
    })

    return unsubscribe
  }, [subscribe, batchId, activeExecution, checkActiveExecution, projectId, router])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (instructionsRef.current && !instructionsRef.current.contains(event.target as Node)) {
        setShowInstructions(false)
      }
      if (gtRef.current && !gtRef.current.contains(event.target as Node)) {
        setShowGroundTruth(false)
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExport(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handlers
  const handleStartTestRun = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/batches/${batchId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionType: 'test',
          sampleSize: 10,
          concurrency: 5,
          useAgentQL: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to start test run')

      const data = await response.json()
      setDashboardState('running')
      checkActiveExecution()
    } catch (error) {
      console.error('Error starting test run:', error)
      alert('Failed to start test run')
    }
  }

  const handleRunFull = async () => {
    const confirmed = confirm(`Start full production run with ${totalSites} sites?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/projects/${projectId}/batches/${batchId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionType: 'production',
          concurrency: 5,
          useAgentQL: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to start full run')

      setDashboardState('running')
      checkActiveExecution()
    } catch (error) {
      console.error('Error starting full run:', error)
      alert('Failed to start full run')
    }
  }

  const handlePause = async () => {
    if (!activeExecution) return
    try {
      const response = await fetch(`/api/executions/${activeExecution.id}/pause`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to pause')
    } catch (err) {
      console.error('Error pausing:', err)
      alert('Failed to pause execution')
    }
  }

  const handleResume = async () => {
    if (!activeExecution) return
    try {
      const response = await fetch(`/api/executions/${activeExecution.id}/resume`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to resume')
    } catch (err) {
      console.error('Error resuming:', err)
      alert('Failed to resume execution')
    }
  }

  const handleStop = async () => {
    if (!activeExecution) return
    const confirmed = confirm('Stop this execution? This cannot be undone.')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/executions/${activeExecution.id}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User stopped from batch dashboard' }),
      })
      if (!response.ok) throw new Error('Failed to stop')
    } catch (err) {
      console.error('Error stopping:', err)
      alert('Failed to stop execution')
    }
  }

  const handleSaveInstructions = async (instructions: string) => {
    // TODO: Implement save instructions API
    console.log('Save instructions:', instructions)
  }

  const handleSaveAndTestInstructions = async (instructions: string) => {
    // Save first, then start test run
    await handleSaveInstructions(instructions)
    await handleStartTestRun()
  }

  const handleSaveGroundTruth = async (gtColumns: string[]) => {
    try {
      // Update batch to mark columns as GT
      const response = await fetch(`/api/batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasGroundTruth: gtColumns.length > 0,
          groundTruthColumns: gtColumns,
        }),
      })

      if (!response.ok) throw new Error('Failed to save GT config')

      setHasGroundTruth(gtColumns.length > 0)
      router.refresh()
    } catch (error) {
      console.error('Error saving GT:', error)
      throw error
    }
  }

  const handleSaveAndTestGroundTruth = async (gtColumns: string[]) => {
    await handleSaveGroundTruth(gtColumns)
    await handleStartTestRun()
  }

  const handleExport = async (config: ExportConfig) => {
    try {
      const response = await fetch(`/api/batches/${batchId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `batch-${batchId}-export.${config.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  }

  const handleRetryFailed = async () => {
    if (!lastCompletedExecution || lastCompletedExecution.stats.errorJobs === 0) return

    const confirmed = confirm(`Retry ${lastCompletedExecution.stats.errorJobs} failed tasks?`)
    if (!confirmed) return

    try {
      // Create new execution with only failed jobs
      const response = await fetch(`/api/executions/${lastCompletedExecution.id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retryFailedOnly: true,
          concurrency: 5,
        }),
      })

      if (!response.ok) throw new Error('Failed to retry')

      // Transition to running mode
      setDashboardState('running')
      setShowCompletionCard(false)
      checkActiveExecution()
    } catch (error) {
      console.error('Error retrying failed tasks:', error)
      alert('Failed to start retry')
    }
  }

  return (
    <div className="space-y-4">
      {/* Compact Action Bar - Progressive Disclosure */}
      <div className="flex items-center justify-between">
        {/* Left: Workflow Actions (Icon-only, hover for labels) */}
        <ProgressiveButtonGroup
          size="lg"
          buttons={[
            {
              icon: FileText,
              label: 'Instructions',
              onClick: () => {
                setShowInstructions(!showInstructions)
                setShowGroundTruth(false)
                setShowExport(false)
              },
              variant: 'outline',
              badge: campaignInstructions ? undefined : '!',
            },
            {
              icon: CheckCircle,
              label: 'Ground Truth',
              onClick: () => {
                setShowGroundTruth(!showGroundTruth)
                setShowInstructions(false)
                setShowExport(false)
              },
              variant: 'outline',
              badge: hasGroundTruth ? undefined : '!',
            },
            {
              icon: Download,
              label: 'Export',
              onClick: () => {
                setShowExport(!showExport)
                setShowInstructions(false)
                setShowGroundTruth(false)
              },
              variant: 'outline',
            },
          ]}
        />

        {/* Right: Run Test Button with Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleStartTestRun}
              disabled={dashboardState === 'running' || dashboardState === 'paused'}
              size="lg"
            >
              <Play className="h-5 w-5 mr-2" />
              Run Test (10)
            </Button>

            <div className="relative group">
              <button
                className="h-10 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors border-l border-emerald-500"
                disabled={dashboardState === 'running' || dashboardState === 'paused'}
              >
                ▼
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-fintech-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="p-2">
                  <button
                    onClick={handleStartTestRun}
                    disabled={dashboardState === 'running'}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-semibold text-gray-900">Test Run (10 sites)</div>
                    <div className="text-xs text-gray-500">Quick validation run</div>
                  </button>

                  <button
                    onClick={handleRunFull}
                    disabled={dashboardState === 'running'}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-semibold text-gray-900">Run All ({totalSites} sites)</div>
                    <div className="text-xs text-gray-500">Full production run</div>
                  </button>

                  <div className="border-t border-gray-100 my-2"></div>

                  <div className="px-4 py-2">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Concurrency</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        defaultValue="5"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 font-mono w-8">5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Dropdowns (only when open) */}
      {showInstructions && (
        <div className="relative" ref={instructionsRef}>
          <InstructionsEditor
            currentInstructions={campaignInstructions}
            onClose={() => setShowInstructions(false)}
            onSave={handleSaveInstructions}
            onSaveAndTest={handleSaveAndTestInstructions}
          />
        </div>
      )}

      {showGroundTruth && (
        <div className="relative" ref={gtRef}>
          <GroundTruthConfigurator
            columns={columnSchema}
            onClose={() => setShowGroundTruth(false)}
            onSave={handleSaveGroundTruth}
            onSaveAndTest={handleSaveAndTestGroundTruth}
          />
        </div>
      )}

      {showExport && (
        <div className="relative" ref={exportRef}>
          <ExportConfigurator
            onClose={() => setShowExport(false)}
            onExport={handleExport}
            hasGroundTruth={hasGroundTruth}
            totalJobs={activeExecution?.stats.totalJobs || lastCompletedExecution?.stats.totalJobs || totalSites}
            completedJobs={activeExecution?.stats.completedJobs || lastCompletedExecution?.stats.completedJobs || 0}
            failedJobs={activeExecution?.stats.errorJobs || lastCompletedExecution?.stats.errorJobs || 0}
          />
        </div>
      )}

      {/* Jobs Table - PRIMARY VIEW */}
      <div className="mt-6">
        <JobsTableV3
          projectId={projectId}
          batchId={batchId}
          columnSchema={columnSchema}
          pollInterval={dashboardState === 'running' || dashboardState === 'paused' ? 2000 : 10000}
        />
      </div>

      {/* Running Mode Hero - Only when actively running */}
      {(dashboardState === 'running' || dashboardState === 'paused') && activeExecution && (
        <RunningModeHero
          executionId={activeExecution.id}
          projectId={projectId}
          batchId={batchId}
          stats={activeExecution.stats}
          runningJobs={activeExecution.runningJobs}
          status={activeExecution.status}
          startedAt={activeExecution.startedAt}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onAdjustConcurrency={async (value) => {
            // TODO: Implement concurrency adjustment
            console.log('Adjust concurrency to:', value)
          }}
        />
      )}

      {/* Completed Mode Hero - Show when execution just finished */}
      {dashboardState === 'completed' && showCompletionCard && lastCompletedExecution && (
        <CompletedModeHero
          executionId={lastCompletedExecution.id}
          projectId={projectId}
          batchId={batchId}
          stats={lastCompletedExecution.stats}
          duration={lastCompletedExecution.startedAt && lastCompletedExecution.completedAt
            ? new Date(lastCompletedExecution.completedAt).getTime() - new Date(lastCompletedExecution.startedAt).getTime()
            : undefined}
          hasGroundTruth={hasGroundTruth}
          onSetupGroundTruth={() => setShowGroundTruth(true)}
          onEditInstructions={() => setShowInstructions(true)}
          onRunFull={handleRunFull}
          onExport={() => setShowExport(true)}
          onRetryFailed={async () => {
            // TODO: Implement retry failed jobs
            console.log('Retry failed jobs')
          }}
          isTestRun={lastCompletedExecution.stats.totalJobs < totalSites}
          totalSitesInBatch={totalSites}
        />
      )}
    </div>
  )
}
