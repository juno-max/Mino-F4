'use client'

/**
 * JobQuickViewModal Component
 * Quick view modal for job details without navigation
 * Enhanced with screenshots, streaming video, and quick actions
 */

import { X, ExternalLink, Clock, Zap, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Trash2, CheckCircle, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { DataCell } from './DataCell'
import { toast } from '@/lib/toast'
import Link from 'next/link'
import { useState } from 'react'

interface Job {
  id: string
  inputId: string | null
  siteUrl: string
  status: string
  progressPercentage: number | null
  currentStep: string | null
  executionDurationMs: number | null
  lastActivityAt: Date | null
  error: string | null
  extractedData: Record<string, any> | null
  groundTruthData: Record<string, any> | null
  streamingUrl?: string | null
  screenshots?: string[] | null
  siteName?: string | null
  startedAt?: Date | null
  completedAt?: Date | null
}

interface JobQuickViewModalProps {
  job: Job
  projectId: string
  batchId?: string
  columnSchema: Array<{
    name: string
    type: string
    isGroundTruth: boolean
    isUrl: boolean
  }>
  onClose: () => void
  onRefresh?: () => void
}

export function JobQuickViewModal({
  job,
  projectId,
  batchId,
  columnSchema,
  onClose,
  onRefresh,
}: JobQuickViewModalProps) {
  const dataColumns = columnSchema.filter(col => !col.isUrl && !col.isGroundTruth)
  const [currentScreenshot, setCurrentScreenshot] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false)

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—'
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'failed':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <Zap className="h-5 w-5 text-blue-500 animate-pulse" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/retry`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to retry job')
      toast.success('Job queued for retry')
      onRefresh?.()
      onClose()
    } catch (error: any) {
      toast.error('Retry failed', { description: error.message })
    } finally {
      setIsRetrying(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete job')
      toast.success('Job deleted')
      onRefresh?.()
      onClose()
    } catch (error: any) {
      toast.error('Delete failed', { description: error.message })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMarkReviewed = async () => {
    setIsMarkingReviewed(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewed: true,
          reviewedAt: new Date().toISOString(),
        }),
      })
      if (!response.ok) throw new Error('Failed to mark as reviewed')
      toast.success('Marked as reviewed')
      onRefresh?.()
    } catch (error: any) {
      toast.error('Mark reviewed failed', { description: error.message })
    } finally {
      setIsMarkingReviewed(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-fintech-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h2 className="text-lg font-bold text-gray-900">Job Details</h2>
              <p className="text-sm text-gray-600 truncate max-w-md">{job.siteUrl}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/projects/${projectId}/jobs/${job.id}`}>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Full Details
              </Button>
            </Link>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Execution Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">{job.status}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Duration</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDuration(job.executionDurationMs)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Progress</div>
              <div className="text-lg font-semibold text-gray-900">
                {job.progressPercentage !== null ? `${job.progressPercentage}%` : '—'}
              </div>
            </div>
          </div>

          {/* Current Step */}
          {job.currentStep && job.status === 'running' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-900">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Current Step:</span>
                <span className="text-sm">{job.currentStep}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {job.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-red-900 mb-1">Error</div>
                  <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                    {job.error}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Data */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Extracted Data</h3>
            {dataColumns.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No data fields configured</p>
            ) : (
              <div className="space-y-2">
                {dataColumns.map((col) => {
                  const extractedValue = job.extractedData?.[col.name]
                  const gtValue = job.groundTruthData?.[col.name]
                  return (
                    <div
                      key={col.name}
                      className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                          {col.name}
                        </span>
                        <span className="text-[10px] text-gray-400">{col.type}</span>
                      </div>
                      <div className="flex-1 flex justify-end pl-4">
                        <DataCell
                          value={extractedValue}
                          groundTruth={gtValue}
                          fieldName={col.name}
                          fieldType={col.type}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Screenshots */}
          {job.screenshots && job.screenshots.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Screenshots</h3>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={job.screenshots[currentScreenshot]}
                  alt={`Screenshot ${currentScreenshot + 1}`}
                  className="w-full h-auto"
                />
                {job.screenshots.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentScreenshot((prev) => Math.max(0, prev - 1))}
                      disabled={currentScreenshot === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setCurrentScreenshot((prev) => Math.min(job.screenshots!.length - 1, prev + 1))}
                      disabled={currentScreenshot === job.screenshots.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                      {currentScreenshot + 1} / {job.screenshots.length}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Streaming URL */}
          {job.streamingUrl && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Live Recording</h3>
              <a
                href={job.streamingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 transition-colors"
              >
                <PlayCircle className="h-5 w-5" />
                <span className="text-sm font-medium">View Live Recording</span>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(job.status === 'failed' || job.status === 'error') && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkReviewed}
              disabled={isMarkingReviewed}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              {isMarkingReviewed ? 'Marking...' : 'Mark Reviewed'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button variant="primary" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
