'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, MonitorPlay } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import { ExtractionResultsHero } from '@/components/job-detail/ExtractionResultsHero'
import { ExecutionTimeline } from '@/components/job-detail/ExecutionTimeline'
import { ScreenshotPlayback } from '@/components/ScreenshotPlayback'
import { Button } from '@/components/Button'

interface JobDetailClientV2Props {
  job: any
  project: any
  jobSessions: any[]
  csvRowData: Record<string, any> | null
  groundTruthData: Record<string, any> | null
  projectId: string
  batchId: string
}

export default function JobDetailClientV2({
  job,
  project,
  jobSessions,
  csvRowData,
  groundTruthData,
  projectId,
  batchId,
}: JobDetailClientV2Props) {
  const [sessions, setSessions] = useState(jobSessions)
  const [showContext, setShowContext] = useState(false)

  // Poll for updates when job is running
  useEffect(() => {
    if (job.status !== 'running') return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`)
        if (response.ok) {
          const data = await response.json()
          setSessions(data.sessions || [])
        }
      } catch (error) {
        console.error('Error polling job:', error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [job.status, job.id])

  // Get latest session
  const latestSession = sessions[0]
  const extractedData = latestSession?.extractedData as Record<string, any> | null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/projects/${projectId}/batches/${batchId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-600 mb-3 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Batch
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight truncate">
                {job.siteName || new URL(job.siteUrl).hostname}
              </h1>
              <p className="text-sm text-gray-600 mt-1 truncate">{job.siteUrl}</p>
            </div>
            <div className="ml-4 flex items-center gap-3">
              <StatusBadge
                status={job.status}
                detailedStatus={job.detailedStatus}
                blockedReason={job.blockedReason}
                completionPercentage={job.completionPercentage}
                showPercentage={job.detailedStatus === 'partial'}
                size="md"
              />
              {job.sessions > 1 && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{sessions.length}</span> sessions
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* SECTION 1: HERO - Extraction Results (60% of focus) */}
        <ExtractionResultsHero
          extractedData={extractedData}
          groundTruthData={groundTruthData}
          hasGroundTruth={job.hasGroundTruth}
        />

        {/* SECTION 2: Timeline - What Happened (30% of focus) */}
        <ExecutionTimeline
          status={job.status}
          detailedStatus={job.detailedStatus}
          blockedReason={job.blockedReason}
          rawOutput={latestSession?.rawOutput}
          errorMessage={latestSession?.errorMessage}
          executionTimeMs={latestSession?.executionTimeMs}
          fieldsExtracted={job.fieldsExtracted}
          fieldsMissing={job.fieldsMissing}
        />

        {/* Live Stream or Screenshot Playback */}
        {latestSession && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
            {/* Live Stream for Running Jobs */}
            {job.status === 'running' && latestSession.streamingUrl && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MonitorPlay className="h-6 w-6 text-emerald-600" />
                  Live Browser Session
                </h3>
                <div className="bg-black rounded-lg overflow-hidden border-4 border-emerald-500 shadow-lg">
                  <iframe
                    src={latestSession.streamingUrl}
                    className="w-full h-[600px]"
                    title="Live Browser Stream"
                    allow="autoplay; fullscreen"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">LIVE</span>
                  </div>
                  <span>•</span>
                  <span>Watching agent execute in real-time</span>
                </div>
              </div>
            )}

            {/* Screenshot Playback for Completed Jobs */}
            {(job.status === 'completed' || job.status === 'error') &&
             latestSession.screenshots &&
             Array.isArray(latestSession.screenshots) &&
             latestSession.screenshots.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Execution Playback</h3>
                <ScreenshotPlayback screenshots={latestSession.screenshots} />
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Context - Input & Instructions (10% of focus, collapsible) */}
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowContext(!showContext)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold text-gray-900">
                Context & Instructions
              </div>
              <div className="text-sm text-gray-500">
                Input data and workflow instructions
              </div>
            </div>
            {showContext ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {showContext && (
            <div className="px-6 pb-6 space-y-6 border-t border-gray-200">
              {/* Workflow Instructions */}
              <div className="pt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Workflow Instructions</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 whitespace-pre-wrap">
                    {job.goal}
                  </p>
                </div>
              </div>

              {/* Project Instructions */}
              {project?.instructions && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Project-Level Instructions</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {project.instructions}
                    </p>
                  </div>
                </div>
              )}

              {/* Input Data */}
              {csvRowData && Object.keys(csvRowData).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Input Data (from CSV)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(csvRowData).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          {key}
                        </div>
                        <div className="text-sm text-gray-900 font-mono break-all">
                          {value != null ? String(value) : <span className="text-gray-400">—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ground Truth (Expected Results) */}
              {groundTruthData && Object.keys(groundTruthData).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Expected Results (Ground Truth)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(groundTruthData).map(([key, value]) => (
                      <div key={key} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="text-xs font-medium text-amber-700 uppercase mb-1">
                          {key}
                        </div>
                        <div className="text-sm text-amber-900 font-mono break-all">
                          {value != null ? String(value) : <span className="text-amber-400">—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* All Sessions History */}
        {sessions.length > 1 && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Session History</h3>
            <div className="space-y-3">
              {sessions.slice(1).map((session, idx) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900">Session #{session.sessionNumber}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        {session.status}
                      </span>
                    </div>
                    {session.executionTimeMs && (
                      <span className="text-sm text-gray-500">
                        {(session.executionTimeMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
