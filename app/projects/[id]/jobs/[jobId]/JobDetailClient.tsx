'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Loader2, Eye, Code, Edit, X, MonitorPlay } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/ui/button'

interface JobDetailClientProps {
  job: any
  project: any
  jobSessions: any[]
  csvRowData: Record<string, any> | null
  groundTruthData: Record<string, any> | null
  projectId: string
}

export default function JobDetailClient({
  job,
  project,
  jobSessions,
  csvRowData,
  groundTruthData,
  projectId,
}: JobDetailClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [sessions, setSessions] = useState(jobSessions)

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
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [job.status, job.id])

  const statusConfig = {
    queued: { icon: Clock, color: 'text-stone-500', bgColor: 'bg-stone-100', label: 'Queued' },
    running: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Running' },
    completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Completed' },
    error: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Error' },
  }

  const statusInfo = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.queued
  const StatusIcon = statusInfo.icon

  // Get latest session
  const latestSession = sessions[0]
  const extractedData = latestSession?.extractedData as Record<string, any> | null

  return (
    <>
      {/* Main Content */}
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-stone-900">{sessions.length}</div>
              <div className="text-sm text-stone-600">Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className={`text-2xl font-semibold ${statusInfo.color}`}>{statusInfo.label}</div>
              <div className="text-sm text-stone-600">Status</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-stone-900">
                {job.isEvaluated ? (
                  <Badge variant={job.evaluationResult === 'pass' ? 'default' : 'destructive'}>
                    {job.evaluationResult === 'pass' ? 'Pass' : 'Fail'}
                  </Badge>
                ) : (
                  <span className="text-stone-400">N/A</span>
                )}
              </div>
              <div className="text-sm text-stone-600">Evaluation</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-stone-900">
                {job.lastRunAt ? new Date(job.lastRunAt).toLocaleTimeString() : 'N/A'}
              </div>
              <div className="text-sm text-stone-600">Last Run</div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions Card with Edit Button */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Workflow Instructions</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Instructions
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-stone-700 whitespace-pre-wrap line-clamp-3">{job.goal}</p>
          </CardContent>
        </Card>

        {/* Input vs Output Side by Side */}
        <Card>
          <CardHeader>
            <CardTitle>Data Comparison</CardTitle>
            <CardDescription>Input data from CSV vs Extracted output from website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Data */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-blue-900 bg-blue-50 px-3 py-2 rounded-md">
                  📥 INPUT DATA (from CSV)
                </h3>
                {csvRowData && Object.keys(csvRowData).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(csvRowData).map(([key, value]) => (
                      <div key={key} className="border border-blue-200 rounded-md p-3 bg-blue-50/50">
                        <div className="text-xs font-medium text-blue-600 uppercase mb-1">{key}</div>
                        <div className="text-sm text-blue-900 font-mono break-all">
                          {value != null ? String(value) : <span className="text-blue-400">—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-500 italic">No input data</p>
                )}
              </div>

              {/* Output Data */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-green-900 bg-green-50 px-3 py-2 rounded-md">
                  📤 OUTPUT DATA (extracted from website)
                </h3>
                {extractedData && Object.keys(extractedData).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(extractedData).map(([key, value]) => {
                      // Check if matches ground truth
                      const gtValue = groundTruthData?.[key]
                      const isMatch = gtValue != null && String(gtValue).toLowerCase().trim() === String(value).toLowerCase().trim()
                      const hasTruth = gtValue != null

                      return (
                        <div
                          key={key}
                          className={`border rounded-md p-3 ${
                            hasTruth
                              ? isMatch
                                ? 'border-green-300 bg-green-50/50'
                                : 'border-red-300 bg-red-50/50'
                              : 'border-green-200 bg-green-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-xs font-medium text-green-600 uppercase mb-1">{key}</div>
                              <div className="text-sm text-green-900 font-mono break-all">
                                {value != null ? String(value) : <span className="text-green-400">—</span>}
                              </div>
                            </div>
                            {hasTruth && (
                              <div>
                                {isMatch ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                            )}
                          </div>
                          {hasTruth && !isMatch && (
                            <div className="mt-2 pt-2 border-t border-red-200">
                              <div className="text-xs text-red-700">
                                Expected: <span className="font-mono">{String(gtValue)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-stone-500">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
                    <p className="text-sm">Waiting for data extraction...</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Stream or Execution Logs */}
        {sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Execution Details</CardTitle>
              <CardDescription>
                {job.status === 'running' ? 'Live execution monitoring' : 'Completed execution logs'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sessions.map((session) => {
                const sessionStatusConfig = {
                  pending: { icon: Clock, color: 'text-stone-500', bgColor: 'bg-stone-100' },
                  running: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100' },
                  completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' },
                  failed: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100' },
                }

                const sessionStatus = sessionStatusConfig[session.status as keyof typeof sessionStatusConfig] || sessionStatusConfig.pending
                const SessionStatusIcon = sessionStatus.icon

                // Parse logs
                const logs = session.rawOutput ? session.rawOutput.split('\n').filter((l: string) => l.trim()) : []
                const logSteps = logs.map((log: string, idx: number) => ({
                  index: idx,
                  text: log,
                  isToolCall: log.includes('Tool call:'),
                  isEvaThinking: log.startsWith('EVA:'),
                  isError: log.includes('Error:') || log.includes('✗'),
                  isSuccess: log.includes('✓'),
                  isStreamUrl: log.includes('Live browser stream:'),
                }))

                return (
                  <div key={session.id} className="border border-stone-200 rounded-lg p-4">
                    {/* Session Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${sessionStatus.bgColor}`}>
                          <SessionStatusIcon className={`h-4 w-4 ${sessionStatus.color} ${session.status === 'running' ? 'animate-spin' : ''}`} />
                          <span className={`text-xs font-medium ${sessionStatus.color} capitalize`}>
                            {session.status}
                          </span>
                        </div>
                        <span className="text-sm font-mono text-stone-600">Session #{session.sessionNumber}</span>
                      </div>
                      {session.executionTimeMs && (
                        <span className="text-xs text-stone-500">
                          {(session.executionTimeMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>

                    {/* LIVE STREAM for running sessions */}
                    {session.status === 'running' && session.streamingUrl && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                          <MonitorPlay className="h-5 w-5" />
                          Live Browser Session
                        </h4>
                        <div className="bg-black rounded-lg overflow-hidden border-4 border-blue-500 shadow-xl">
                          <iframe
                            src={session.streamingUrl}
                            className="w-full h-[600px]"
                            title="Live Browser Stream"
                            allow="autoplay; fullscreen"
                            sandbox="allow-same-origin allow-scripts allow-forms"
                          />
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span>LIVE</span>
                          </div>
                          <span>•</span>
                          <span>Watching agent execute in real-time</span>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {session.errorMessage && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-red-900 mb-2">Error</h4>
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-sm text-red-800">{session.errorMessage}</p>
                          {session.failureReason && (
                            <p className="text-xs text-red-600 mt-1">{session.failureReason}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step-by-Step Logs for Completed */}
                    {(session.status === 'completed' || session.status === 'failed') && logSteps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-stone-900 mb-3">Agent Execution Steps</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {logSteps.map((step: any) => (
                            <div
                              key={step.index}
                              className={`p-3 rounded-md border ${
                                step.isError
                                  ? 'bg-red-50 border-red-200'
                                  : step.isSuccess
                                  ? 'bg-green-50 border-green-200'
                                  : step.isToolCall
                                  ? 'bg-amber-50 border-amber-200'
                                  : step.isEvaThinking
                                  ? 'bg-blue-50 border-blue-200'
                                  : step.isStreamUrl
                                  ? 'bg-purple-50 border-purple-200'
                                  : 'bg-stone-50 border-stone-200'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-mono text-stone-500 min-w-[30px]">
                                  {step.index + 1}.
                                </span>
                                <div className="flex-1">
                                  {step.isToolCall && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 mb-1">
                                      <Code className="h-3 w-3" />
                                      Tool Call
                                    </span>
                                  )}
                                  {step.isEvaThinking && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 mb-1">
                                      <Eye className="h-3 w-3" />
                                      Agent Thinking
                                    </span>
                                  )}
                                  <p
                                    className={`text-sm font-mono ${
                                      step.isError
                                        ? 'text-red-800'
                                        : step.isSuccess
                                        ? 'text-green-800'
                                        : step.isToolCall
                                        ? 'text-amber-800'
                                        : step.isEvaThinking
                                        ? 'text-blue-800'
                                        : 'text-stone-700'
                                    }`}
                                  >
                                    {step.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live Logs for Running (no stream) */}
                    {session.status === 'running' && !session.streamingUrl && session.rawOutput && (
                      <div>
                        <h4 className="text-sm font-medium text-stone-900 mb-2">Agent Logs (Live)</h4>
                        <div className="bg-stone-900 rounded p-3 overflow-x-auto max-h-60 overflow-y-auto">
                          <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                            {session.rawOutput}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="mt-4 pt-3 border-t border-stone-200 flex items-center gap-4 text-xs text-stone-500">
                      {session.startedAt && (
                        <span>Started: {new Date(session.startedAt).toLocaleString()}</span>
                      )}
                      {session.completedAt && (
                        <span>Completed: {new Date(session.completedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Side Drawer for Instructions */}
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">Workflow Instructions</h2>
                  <p className="text-sm text-stone-600 mt-1">How the agent extracts data from this website</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-md transition-colors"
                >
                  <X className="h-5 w-5 text-stone-600" />
                </button>
              </div>

              {/* Project Instructions */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-stone-900 mb-2">Project-Level Instructions</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-900 whitespace-pre-wrap">
                      {project?.instructions || 'No project instructions set'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-stone-900 mb-2">Job-Specific Goal</h3>
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm text-green-900 whitespace-pre-wrap">
                      {job.goal}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-stone-900 mb-2">Target Website</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                    <p className="text-sm font-mono text-purple-900 break-all">
                      {job.siteUrl}
                    </p>
                  </div>
                </div>

                {groundTruthData && Object.keys(groundTruthData).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-stone-900 mb-2">Expected Results (Ground Truth)</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                      <div className="space-y-2">
                        {Object.entries(groundTruthData).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2">
                            <span className="text-xs font-medium text-amber-800 uppercase min-w-[100px]">
                              {key}:
                            </span>
                            <span className="text-sm text-amber-900 font-mono flex-1">
                              {value != null ? String(value) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-stone-200 pt-4">
                <Button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
