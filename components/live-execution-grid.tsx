'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Globe, Loader2, ExternalLink, Clock } from 'lucide-react'
import { AgentDetailDrawer } from '@/components/AgentDetailDrawer'

export interface RunningJob {
  id: string
  siteUrl: string
  siteName?: string | null
  currentStep?: string | null
  currentUrl?: string | null
  progressPercentage?: number
  startedAt?: Date | string | null
  createdAt?: Date | string | null
  lastActivityAt?: Date | string | null
}

interface LiveExecutionGridProps {
  runningJobs: RunningJob[]
  maxDisplay?: number
}

export function LiveExecutionGrid({ runningJobs, maxDisplay = 6 }: LiveExecutionGridProps) {
  const displayJobs = runningJobs.slice(0, maxDisplay)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [jobDetails, setJobDetails] = useState<Record<string, any>>({})

  // Fetch streaming URLs for running jobs
  useEffect(() => {
    const fetchJobDetails = async (jobId: string) => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/details`)
        if (response.ok) {
          const data = await response.json()
          setJobDetails(prev => ({
            ...prev,
            [jobId]: data
          }))
        }
      } catch (error) {
        console.error('Error fetching job details:', error)
      }
    }

    // Fetch details for all running jobs
    runningJobs.forEach(job => {
      if (!jobDetails[job.id]) {
        fetchJobDetails(job.id)
      }
    })
  }, [runningJobs.map(j => j.id).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId)
  }

  const handleCloseDrawer = () => {
    setSelectedJobId(null)
  }

  const selectedJob = selectedJobId ? runningJobs.find(j => j.id === selectedJobId) : null
  const selectedJobData = selectedJobId && jobDetails[selectedJobId]?.session
    ? {
        id: selectedJobId,
        siteName: selectedJob?.siteName ?? undefined,
        siteUrl: selectedJob?.siteUrl || '',
        status: 'running',
        progressPercentage: selectedJob?.progressPercentage || 0,
        currentStep: selectedJob?.currentStep ?? undefined,
        streamingUrl: jobDetails[selectedJobId]?.session?.streamingUrl,
        startedAt: selectedJob?.startedAt ? new Date(selectedJob.startedAt) : undefined,
      }
    : null

  if (displayJobs.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-center text-gray-500 py-8">
          <Globe className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium">No agents currently running</p>
          <p className="text-xs text-gray-400 mt-1">Jobs will appear here when execution starts</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayJobs.map((job) => {
          const progress = job.progressPercentage || 0
          const now = Date.now()
          const startTime = job.startedAt || job.createdAt
          const elapsedTime = startTime
            ? Math.floor((now - new Date(startTime).getTime()) / 1000)
            : 0

          // Smart fallback messages based on elapsed time
          let currentStep = job.currentStep
          let isStalled = false

          if (!currentStep || currentStep.trim() === '') {
            if (elapsedTime < 10) {
              currentStep = '🔄 Connecting to agent...'
            } else if (elapsedTime < 30) {
              currentStep = '🌐 Initializing browser session...'
            } else if (elapsedTime < 60) {
              currentStep = '⏳ Loading page (this may take a moment)...'
            } else {
              currentStep = '⚠️ Agent is taking longer than expected'
              isStalled = true
            }
          }

          // Check if job is stalled
          const lastActivity = job.lastActivityAt ? new Date(job.lastActivityAt).getTime() : (startTime ? new Date(startTime).getTime() : now)
          const timeSinceActivity = Math.floor((now - lastActivity) / 1000)
          if (timeSinceActivity > 90 && progress === 0) {
            isStalled = true
          }

          return (
            <Card
              key={job.id}
              padding="md"
              className={`transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                isStalled
                  ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
                  : 'border-emerald-300 bg-emerald-50 animate-pulse-subtle hover:border-emerald-400'
              }`}
              onClick={() => handleJobClick(job.id)}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Loader2 className={`h-4 w-4 animate-spin ${isStalled ? 'text-amber-600' : 'text-emerald-600'}`} />
                      <span className={`text-sm font-semibold truncate ${isStalled ? 'text-amber-900' : 'text-emerald-900'}`}>
                        {job.siteName || 'Agent'}
                      </span>
                    </div>
                    <div className={`text-xs truncate flex items-center gap-1 ${isStalled ? 'text-amber-700' : 'text-emerald-700'}`}>
                      <Globe className="h-3 w-3 flex-shrink-0" />
                      <a
                        href={job.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate"
                        title={job.siteUrl}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {job.siteUrl}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Current Activity */}
                <div className="mb-3 p-2.5 bg-white rounded-md border">
                  <div className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${isStalled ? 'text-amber-700' : 'text-gray-600'}`}>
                    Current Action
                  </div>
                  <div className={`text-sm font-medium line-clamp-2 ${isStalled ? 'text-amber-900' : 'text-gray-900'}`}>
                    {currentStep}
                  </div>
                </div>

                {/* Current URL (if different) */}
                {job.currentUrl && job.currentUrl !== job.siteUrl && (
                  <div className="mb-3">
                    <div className={`text-xs truncate flex items-center gap-1 ${isStalled ? 'text-amber-700' : 'text-emerald-700'}`}>
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{job.currentUrl}</span>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className={`font-semibold ${isStalled ? 'text-amber-700' : 'text-emerald-700'}`}>Progress</span>
                    <span className={`font-bold ${isStalled ? 'text-amber-900' : 'text-emerald-900'}`}>{progress}%</span>
                  </div>
                  <div className={`w-full rounded-full h-2.5 ${isStalled ? 'bg-amber-200' : 'bg-emerald-200'}`}>
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${isStalled ? 'bg-amber-600' : 'bg-emerald-600'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Elapsed Time */}
                <div className={`flex items-center justify-center gap-1.5 text-xs ${isStalled ? 'text-amber-600' : 'text-emerald-600'}`}>
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {elapsedTime < 60
                      ? `${elapsedTime}s elapsed`
                      : `${Math.floor(elapsedTime / 60)}m ${elapsedTime % 60}s elapsed`}
                  </span>
                  {isStalled && (
                    <span className="text-amber-700 font-semibold">(Slow)</span>
                  )}
                </div>
            </Card>
          )
        })}
      </div>

      {/* Agent Detail Drawer */}
      {selectedJobId && selectedJobData && (
        <AgentDetailDrawer
          isOpen={true}
          onClose={handleCloseDrawer}
          jobId={selectedJobId}
          jobData={selectedJobData}
        />
      )}
    </>
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
