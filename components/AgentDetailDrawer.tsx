'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ExternalLink, Copy, Download, RefreshCw, StopCircle, Check, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/Button'

interface AgentDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobData: {
    id: string
    siteName?: string
    siteUrl: string
    status: string
    progressPercentage: number
    currentStep?: string
    streamingUrl?: string
    startedAt?: Date
    errorMessage?: string
  }
}

interface ActionLogEntry {
  timestamp: Date
  action: string
  details?: string
  status: 'pending' | 'success' | 'error'
}

interface ReasoningEntry {
  timestamp: Date
  thinking: string
  decision: string
}

export function AgentDetailDrawer({ isOpen, onClose, jobId, jobData }: AgentDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'reasoning' | 'data' | 'logs'>('timeline')
  const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([])
  const [reasoningLogs, setReasoningLogs] = useState<ReasoningEntry[]>([])
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch detailed job data
  const fetchJobDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/details`)
      if (response.ok) {
        const data = await response.json()

        // Parse action logs from API response
        if (data.logs && data.logs.length > 0) {
          setActionLogs(data.logs.map((log: any) => ({
            timestamp: new Date(log.timestamp),
            action: log.action,
            details: log.details,
            status: log.status || 'success'
          })))
        }

        // Parse reasoning/thinking logs
        if (data.reasoning && data.reasoning.length > 0) {
          setReasoningLogs(data.reasoning.map((r: any) => ({
            timestamp: new Date(r.timestamp),
            thinking: r.thinking,
            decision: r.decision
          })))
        }

        // Extract data
        if (data.extractedData) {
          setExtractedData(data.extractedData)
        }
      }
    } catch (error) {
      console.error('Error fetching job details:', error)
    }
  }, [jobId])

  useEffect(() => {
    if (isOpen && jobId) {
      fetchJobDetails()
      // Poll for updates every 2 seconds if job is running
      const interval = jobData.status === 'running' ? setInterval(fetchJobDetails, 2000) : null
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [isOpen, jobId, jobData.status, fetchJobDetails])

  const handleCopyUrl = async () => {
    if (jobData.streamingUrl) {
      await navigator.clipboard.writeText(jobData.streamingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenInNewWindow = () => {
    if (jobData.streamingUrl) {
      window.open(jobData.streamingUrl, '_blank', 'width=1200,height=800')
    }
  }

  const handleDownloadLogs = () => {
    const logs = {
      job: jobData,
      actions: actionLogs,
      reasoning: reasoningLogs,
      extractedData,
    }
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-${jobId}-logs.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDuration = (startDate?: Date) => {
    if (!startDate) return '0s'
    const seconds = Math.floor((Date.now() - startDate.getTime()) / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      running: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock, label: 'Running' },
      completed: { color: 'text-green-600', bgColor: 'bg-green-100', icon: Check, label: 'Completed' },
      error: { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle, label: 'Failed' },
      queued: { color: 'text-stone-500', bgColor: 'bg-stone-100', icon: Clock, label: 'Queued' },
    }
    return configs[status as keyof typeof configs] || configs.queued
  }

  const statusConfig = getStatusConfig(jobData.status)
  const StatusIcon = statusConfig.icon

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-3/4 lg:w-2/3 xl:w-1/2 bg-white shadow-2xl z-50 overflow-hidden flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="border-b border-stone-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={onClose}
                  className="text-stone-500 hover:text-stone-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-semibold text-stone-900">
                  {jobData.siteName || 'Agent Execution'}
                </h2>
              </div>
              <p className="text-sm text-stone-600 ml-8">{jobData.siteUrl}</p>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center gap-4 mt-4 ml-8">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
              <span className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <div className="text-sm text-stone-600">
              Progress: <span className="font-medium text-stone-900">{jobData.progressPercentage}%</span>
            </div>
            <div className="text-sm text-stone-600">
              Duration: <span className="font-medium text-stone-900">{formatDuration(jobData.startedAt)}</span>
            </div>
          </div>

          {jobData.currentStep && (
            <div className="mt-3 ml-8 text-sm text-stone-700">
              <span className="font-medium">Current action:</span> {jobData.currentStep}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Live Browser View */}
            {jobData.streamingUrl && (
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-stone-900">Live Browser View</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleOpenInNewWindow}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyUrl}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {copied ? 'Copied!' : 'Copy URL'}
                    </Button>
                  </div>
                </div>
                <div className="bg-white border border-stone-300 rounded aspect-video overflow-hidden">
                  <iframe
                    src={jobData.streamingUrl}
                    className="w-full h-full"
                    title="Live Browser View"
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {jobData.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 mb-1">Error</h4>
                    <p className="text-sm text-red-700">{jobData.errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-stone-200">
              <div className="flex gap-6">
                {['timeline', 'reasoning', 'data', 'logs'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  {actionLogs.length > 0 ? (
                    actionLogs.map((log, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="text-xs text-stone-500 w-16 pt-1">
                          {log.timestamp.toLocaleTimeString()}
                        </div>
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          log.status === 'success' ? 'bg-green-500' :
                          log.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-stone-900">{log.action}</div>
                          {log.details && (
                            <div className="text-sm text-stone-600 mt-0.5">{log.details}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-stone-500">
                      No timeline data available yet
                    </div>
                  )}
                </div>
              )}

              {/* Reasoning Tab */}
              {activeTab === 'reasoning' && (
                <div className="space-y-4">
                  {reasoningLogs.length > 0 ? (
                    reasoningLogs.map((entry, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-xs text-blue-700 mb-2">
                          {entry.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-semibold text-blue-900 uppercase">Thinking:</span>
                            <p className="text-sm text-blue-800 mt-1">{entry.thinking}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-blue-900 uppercase">Decision:</span>
                            <p className="text-sm text-blue-800 mt-1">{entry.decision}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-stone-500">
                      No reasoning data available yet
                    </div>
                  )}
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div>
                  {extractedData && Object.keys(extractedData).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(extractedData).map(([key, value]) => (
                        <div key={key} className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                          <div className="text-xs font-semibold text-stone-700 uppercase mb-2">
                            {key}
                          </div>
                          <div className="text-sm text-stone-900 font-mono break-words">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-stone-500">
                      No data extracted yet
                    </div>
                  )}
                </div>
              )}

              {/* Logs Tab */}
              {activeTab === 'logs' && (
                <div className="bg-stone-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto">
                  {actionLogs.length > 0 ? (
                    <div className="space-y-1">
                      {actionLogs.map((log, index) => (
                        <div key={index}>
                          <span className="text-stone-500">
                            [{log.timestamp.toISOString()}]
                          </span>{' '}
                          <span className={
                            log.status === 'error' ? 'text-red-400' :
                            log.status === 'success' ? 'text-green-400' : 'text-blue-400'
                          }>
                            {log.action}
                          </span>
                          {log.details && <span className="text-stone-400"> - {log.details}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-stone-500">No logs available</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-stone-200 bg-stone-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadLogs}>
                <Download className="h-4 w-4 mr-2" />
                Download Logs
              </Button>
            </div>
            <div className="flex gap-2">
              {jobData.status === 'running' && (
                <Button size="sm" variant="outline">
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
              {jobData.status === 'error' && (
                <Button size="sm" variant="primary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
