'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { JobDetailHeader } from './JobDetailHeader'
import { JobContextCard } from './JobContextCard'
import { LatestOutputCard } from './LatestOutputCard'
import { ExecutionPlayback } from './ExecutionPlayback'
import { GroundTruthComparison } from './GroundTruthComparison'
import { SessionHistoryList } from './SessionHistoryList'
import { ExecutionLogViewer } from './ExecutionLogViewer'

interface Session {
  id: string
  sessionNumber: number
  status: string
  detailedStatus: string | null
  blockedReason: string | null
  extractedData: Record<string, any> | null
  fieldsExtracted: string[] | null
  fieldsMissing: string[] | null
  completionPercentage: number | null
  rawOutput: string | null
  errorMessage: string | null
  screenshots: any[] | null
  streamingUrl: string | null
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
}

interface Job {
  id: string
  batchId: string
  projectId: string
  goal: string
  siteUrl: string
  inputId: string
  status: string
  hasGroundTruth: boolean
  groundTruthData: Record<string, any> | null
  csvRowData: Record<string, any> | null
  createdAt: Date
}

interface Project {
  id: string
  name: string
  instructions: string | null
}

interface Batch {
  id: string
  name: string
}

interface JobDetailClientProps {
  initialJob: Job
  initialSessions: Session[]
  project: Project
  batch: Batch
}

export function JobDetailClient({
  initialJob,
  initialSessions,
  project,
  batch,
}: JobDetailClientProps) {
  const router = useRouter()
  const [currentSessionId, setCurrentSessionId] = useState(initialSessions[0]?.id)
  const [job, setJob] = useState(initialJob)
  const [sessions, setSessions] = useState(initialSessions)
  const [showEditInstructionsDrawer, setShowEditInstructionsDrawer] = useState(false)
  const [showEditOutputModal, setShowEditOutputModal] = useState(false)

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0]

  // Real-time polling for running jobs
  useEffect(() => {
    if (currentSession?.status === 'running') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/jobs/${job.id}`)
          if (response.ok) {
            const data = await response.json()
            setJob(data.job)
            setSessions(data.sessions)
          }
        } catch (error) {
          console.error('Failed to poll job status:', error)
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [currentSession?.status, job.id])

  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  const handleRetry = async () => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/retry`, {
        method: 'POST',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to retry job:', error)
    }
  }

  const handleSetAsGroundTruth = async () => {
    if (!currentSession?.extractedData) return

    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groundTruthData: currentSession.extractedData,
          hasGroundTruth: true,
        }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to set ground truth:', error)
    }
  }

  const handleEditOutput = () => {
    setShowEditOutputModal(true)
  }

  const handleEditInstructions = () => {
    setShowEditInstructionsDrawer(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <JobDetailHeader
        projectId={project.id}
        batchId={batch.id}
        jobId={job.id}
        batchName={batch.name}
        currentSession={currentSession}
        allSessions={sessions}
        onSessionChange={handleSessionChange}
        onRetry={handleRetry}
        onEditInstructions={handleEditInstructions}
      />

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6">
          {/* Left Column: Context & Playback */}
          <div className="space-y-6">
            {/* Job Context */}
            <JobContextCard
              goal={job.goal}
              siteUrl={job.siteUrl}
              inputId={job.inputId}
              createdAt={job.createdAt}
              csvRowData={job.csvRowData}
              instructions={project.instructions}
            />

            {/* Execution Playback */}
            <ExecutionPlayback
              screenshots={currentSession?.screenshots || null}
              streamingUrl={currentSession?.streamingUrl || null}
              status={currentSession?.status || 'pending'}
              steps={[]}
            />
          </div>

          {/* Right Column: Output & Comparison */}
          <div className="space-y-6">
            {/* Latest Output */}
            <LatestOutputCard
              extractedData={currentSession?.extractedData || null}
              status={currentSession?.status || 'pending'}
              errorMessage={currentSession?.errorMessage || null}
              onSetAsGroundTruth={handleSetAsGroundTruth}
              onEditOutput={handleEditOutput}
              hasGroundTruth={job.hasGroundTruth}
            />

            {/* Ground Truth Comparison */}
            {job.hasGroundTruth && (
              <GroundTruthComparison
                extractedData={currentSession?.extractedData || null}
                groundTruthData={job.groundTruthData}
                fieldsExtracted={currentSession?.fieldsExtracted || null}
                fieldsMissing={currentSession?.fieldsMissing || null}
                completionPercentage={currentSession?.completionPercentage || null}
              />
            )}

            {/* Execution Log */}
            <ExecutionLogViewer
              rawOutput={currentSession?.rawOutput || null}
              errorMessage={currentSession?.errorMessage || null}
            />
          </div>
        </div>

        {/* Historic Sessions (Full Width Below) */}
        <div className="mt-6">
          <SessionHistoryList
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSessionClick={handleSessionChange}
          />
        </div>
      </div>
    </div>
  )
}
