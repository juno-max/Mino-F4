'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Filter, Monitor, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Progress } from '@/components/Progress'

interface ToolCall {
  id: string
  action: string
  timestamp: string
  description: string
  screenshot?: string
  status: 'completed' | 'pending' | 'failed'
}

interface SessionData {
  id: string
  jobId: string
  sessionNumber: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  extractedData: Record<string, any> | null
  rawOutput: string | null
  errorMessage: string | null
  failureReason: string | null
  executionTimeMs: number | null
  screenshots: Array<{
    timestamp: string
    title: string
    description: string
    screenshotUrl: string
  }> | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

interface JobData {
  id: string
  batchId: string
  projectId: string
  inputId: string
  siteUrl: string
  siteName: string | null
  goal: string
  groundTruthData: Record<string, any> | null
  status: string
  hasGroundTruth: boolean
  sessions: SessionData[]
}

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedToolCall, setSelectedToolCall] = useState<any | null>(null)
  const [selectedHistoricSession, setSelectedHistoricSession] = useState<string | null>(null)

  // Fetch session and job data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch session
        const sessionRes = await fetch(`/api/sessions/${sessionId}`)
        if (!sessionRes.ok) {
          throw new Error('Failed to fetch session')
        }
        const sessionData = await sessionRes.json()
        setSession(sessionData)

        // Fetch job with all sessions
        const jobRes = await fetch(`/api/jobs/${sessionData.jobId}`)
        if (!jobRes.ok) {
          throw new Error('Failed to fetch job')
        }
        const jobData = await jobRes.json()
        setJob(jobData)

        setLoading(false)
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionId])

  // Poll for updates if session is running
  useEffect(() => {
    if (!session || session.status !== 'running') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`)
        if (res.ok) {
          const data = await res.json()
          setSession(data)

          // If status changed, refetch job to get updated sessions list
          if (data.status !== 'running') {
            const jobRes = await fetch(`/api/jobs/${data.jobId}`)
            if (jobRes.ok) {
              const jobData = await jobRes.json()
              setJob(jobData)
            }
          }
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [session, sessionId])

  // Auto-select first screenshot for completed sessions
  useEffect(() => {
    if (session?.status === 'completed' && session.screenshots && session.screenshots.length > 0) {
      setSelectedToolCall(session.screenshots[0])
    }
  }, [session])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error || !session || !job) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Error Loading Session</h2>
          <p className="text-stone-600 mb-4">{error || 'Session not found'}</p>
          <Button onClick={() => router.back()} variant="secondary">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const isRunning = session.status === 'running'
  const isCompleted = session.status === 'completed'
  const isFailed = session.status === 'failed'

  // Calculate progress based on session status
  const progress = isCompleted ? 100 : isFailed ? 40 : isRunning ? 20 : 0

  // Convert screenshots to tool calls format for display
  const toolCalls: ToolCall[] = session.screenshots?.map((screenshot, index) => ({
    id: String(index + 1),
    action: screenshot.title,
    timestamp: screenshot.timestamp,
    description: screenshot.description,
    screenshot: screenshot.screenshotUrl,
    status: 'completed' as const,
  })) || []

  // Add current step if running
  if (isRunning) {
    toolCalls.push({
      id: String(toolCalls.length + 1),
      action: 'Extracting Data',
      timestamp: '',
      description: 'In progress...',
      status: 'pending',
    })
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="h-10 w-10 flex items-center justify-center hover:bg-stone-100 rounded-lg transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-stone-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-stone-900">Session #{session.sessionNumber}</h1>
                <p className="text-sm text-stone-500 mt-1">{job.siteName || job.siteUrl}</p>
              </div>
              <Badge
                variant={
                  isCompleted ? 'success' :
                  isFailed ? 'danger' :
                  'warning'
                }
              >
                {session.status}
              </Badge>
            </div>
            <Button variant="success" onClick={() => router.push(`/projects/${job.projectId}`)}>
              <Filter className="h-4 w-4 mr-2" />
              Edit Project Instruction
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            {/* Top Section - Job Details and Latest Output */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Details */}
              <Card>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-stone-900 mb-2">Job Details</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5 block">
                      Goal
                    </label>
                    <p className="text-sm text-stone-900 leading-relaxed">{job.goal}</p>
                  </div>
                  <div className="pt-3 border-t border-stone-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-stone-500">URL:</span>
                        <p className="font-medium text-stone-900 mt-0.5 truncate">{job.siteUrl}</p>
                      </div>
                      <div>
                        <span className="text-stone-500">Status:</span>
                        <p className="font-medium text-stone-900 mt-0.5">{job.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Latest Output */}
              <Card>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-stone-900 mb-2">Latest Output</h2>
                </div>
                <div className="space-y-3">
                  {session.extractedData ? (
                    <pre className="text-xs font-mono bg-stone-50 rounded-lg p-4 overflow-x-auto border border-stone-200">
                      {JSON.stringify(session.extractedData, null, 2)}
                    </pre>
                  ) : session.errorMessage ? (
                    <div className="text-sm text-red-600 bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="font-medium mb-1">Error:</p>
                      <p>{session.errorMessage}</p>
                      {session.failureReason && (
                        <p className="mt-2 text-xs text-red-500">{session.failureReason}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-stone-500 text-center py-8">
                      No output yet
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Progress Tracker */}
            <Card>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-stone-900 mb-2">Progress</h2>
                <Progress value={progress} showLabel size="md" />
              </div>
              {toolCalls.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-4">
                  {toolCalls.map((toolCall, index) => {
                    const isActive = toolCall.status === 'completed'
                    const isCurrent = toolCall.status === 'pending'
                    const isToolFailed = toolCall.status === 'failed'

                    return (
                      <div
                        key={toolCall.id}
                        className={`flex items-center gap-2 flex-shrink-0 ${
                          index < toolCalls.length - 1 ? 'pr-4' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center min-w-[120px]">
                          {toolCall.timestamp && (
                            <span
                              className={`text-xs font-medium mb-1.5 ${
                                isActive ? 'text-green-600' : 'text-stone-600'
                              }`}
                            >
                              {toolCall.timestamp}
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedToolCall(toolCall)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[120px] ${
                              isActive
                                ? 'bg-green-50 text-green-700 border-2 border-green-500'
                                : isCurrent
                                ? 'bg-amber-50 text-amber-700 border-2 border-amber-600'
                                : isToolFailed
                                ? 'bg-red-50 text-red-700 border-2 border-red-500'
                                : 'bg-stone-50 text-stone-500 border-2 border-stone-200'
                            }`}
                          >
                            {toolCall.action}
                          </button>
                        </div>
                        {index < toolCalls.length - 1 && (
                          <div className="h-0.5 w-8 bg-stone-200 flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Browser View / Screenshots */}
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-stone-900 mb-2">
                  {isCompleted ? 'Screenshots by Agent Tool Calls' : 'Latest Session Live Browser View'}
                </h2>
                <p className="text-sm text-stone-500">
                  {isCompleted
                    ? 'View screenshots captured at each step of the execution'
                    : 'Live view of the current browser state'}
                </p>
              </div>

              {isRunning ? (
                // Live Browser View for Running Sessions
                <div className="bg-white rounded-lg p-4 lg:p-6 border-4 border-stone-200 shadow-lg">
                  <div className="bg-white rounded overflow-hidden">
                    {/* Browser Chrome */}
                    <div className="bg-stone-100 px-4 py-2 flex items-center gap-2 border-b border-stone-200">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-stone-600 ml-4">
                        {job.siteUrl}
                      </div>
                    </div>
                    {/* Browser Content */}
                    <div className="aspect-video bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
                      <div className="text-center p-8">
                        <Monitor className="h-16 w-16 text-stone-700 mx-auto mb-4 animate-pulse" />
                        <p className="text-stone-500 font-medium">Live Browser View</p>
                        <p className="text-sm text-stone-600 mt-2">Extracting data...</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedToolCall && selectedToolCall.screenshot ? (
                // Screenshot Gallery for Completed Sessions
                <div className="space-y-4">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-stone-900">{selectedToolCall.action}</h3>
                        <p className="text-sm text-stone-500">{selectedToolCall.description}</p>
                      </div>
                      {selectedToolCall.timestamp && (
                        <span className="text-xs font-medium text-stone-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {selectedToolCall.timestamp}
                        </span>
                      )}
                    </div>
                    <div className="bg-white rounded-lg p-4 border-4 border-stone-200 shadow-lg">
                      <div className="bg-white rounded overflow-hidden">
                        <div className="bg-stone-100 px-4 py-2 flex items-center gap-2 border-b border-stone-200">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>
                          <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-stone-600 ml-4">
                            {job.siteUrl}
                          </div>
                        </div>
                        <img
                          src={selectedToolCall.screenshot}
                          alt={selectedToolCall.action}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Screenshot Thumbnails */}
                  {toolCalls.filter(tc => tc.screenshot).length > 0 && (
                    <div className="grid grid-cols-5 gap-3 pt-4 border-t border-stone-200">
                      {toolCalls.map((toolCall) => {
                        if (!toolCall.screenshot) return null
                        return (
                          <button
                            key={toolCall.id}
                            onClick={() => setSelectedToolCall(toolCall)}
                            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                              selectedToolCall?.id === toolCall.id
                                ? 'border-amber-600 ring-2 ring-blue-200'
                                : 'border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <img
                              src={toolCall.screenshot}
                              alt={toolCall.action}
                              className="w-full h-full object-cover"
                            />
                            {selectedToolCall?.id === toolCall.id && (
                              <div className="absolute inset-0 bg-amber-600/10 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-amber-600" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-stone-900/80 text-white text-xs p-1 truncate">
                              {toolCall.action}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-stone-50 rounded-lg border-2 border-dashed border-stone-200">
                  <Monitor className="h-12 w-12 text-stone-700 mx-auto mb-3" />
                  <p className="text-sm text-stone-500">
                    {isCompleted ? 'No screenshots available' : 'Waiting for data...'}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Historic Sessions */}
          <div className="lg:col-span-4">
            <Card>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-stone-900 mb-2">Historic Sessions</h2>
                <p className="text-sm text-stone-500">
                  Previous execution attempts for this job
                </p>
              </div>
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
                {job.sessions
                  .sort((a, b) => b.sessionNumber - a.sessionNumber)
                  .map((historicSession) => (
                    <button
                      key={historicSession.id}
                      onClick={() => {
                        if (historicSession.id === session.id) {
                          // Current session, just toggle expanded state
                          setSelectedHistoricSession(
                            selectedHistoricSession === historicSession.id ? null : historicSession.id
                          )
                        } else {
                          // Navigate to other session
                          router.push(`/sessions/${historicSession.id}`)
                        }
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        historicSession.id === session.id
                          ? 'border-amber-600 bg-amber-50'
                          : selectedHistoricSession === historicSession.id
                          ? 'border-amber-600 bg-amber-50'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-stone-900">
                              Session #{historicSession.sessionNumber}
                            </span>
                            {historicSession.id === session.id && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                Current
                              </span>
                            )}
                            <Badge
                              variant={
                                historicSession.status === 'completed' ? 'success' :
                                historicSession.status === 'failed' ? 'danger' :
                                'warning'
                              }
                            >
                              {historicSession.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {historicSession.completedAt
                                ? new Date(historicSession.completedAt).toLocaleString()
                                : historicSession.createdAt
                                ? new Date(historicSession.createdAt).toLocaleString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedHistoricSession === historicSession.id && (
                        <div className="mt-3 pt-3 border-t border-stone-200">
                          <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                            Output
                          </div>
                          {historicSession.extractedData ? (
                            <pre className="text-xs font-mono bg-stone-50 rounded p-3 overflow-x-auto border border-stone-200">
                              {JSON.stringify(historicSession.extractedData, null, 2)}
                            </pre>
                          ) : historicSession.errorMessage ? (
                            <div className="text-xs text-red-600 bg-red-50 rounded p-3 border border-red-200">
                              {historicSession.errorMessage}
                            </div>
                          ) : (
                            <p className="text-xs text-stone-500">No output available</p>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
