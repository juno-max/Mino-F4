'use client'

/**
 * JobQuickViewModal Component
 * Quick view modal for job details without navigation
 */

import { X, ExternalLink, Clock, Zap, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/Button'
import { DataCell } from './DataCell'
import Link from 'next/link'

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
}

interface JobQuickViewModalProps {
  job: Job
  projectId: string
  columnSchema: Array<{
    name: string
    type: string
    isGroundTruth: boolean
    isUrl: boolean
  }>
  onClose: () => void
}

export function JobQuickViewModal({
  job,
  projectId,
  columnSchema,
  onClose,
}: JobQuickViewModalProps) {
  const dataColumns = columnSchema.filter(col => !col.isUrl && !col.isGroundTruth)

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
        return <Zap className="h-5 w-5 text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button variant="primary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
