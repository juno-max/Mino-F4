'use client'

import React, { useState } from 'react'
import { Trash2, RefreshCw, X, Download, CheckCircle } from 'lucide-react'
import { toast } from '@/lib/toast'

interface BulkActionsToolbarProps {
  selectedJobIds: string[]
  batchId?: string
  onClearSelection: () => void
  onRefresh?: () => void
}

export default function BulkActionsToolbar({
  selectedJobIds,
  batchId,
  onClearSelection,
  onRefresh,
}: BulkActionsToolbarProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRerunning, setIsRerunning] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false)

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedJobIds.length} job(s)? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    const toastId = toast.loading(`Deleting ${selectedJobIds.length} job(s)...`)

    try {
      const response = await fetch('/api/jobs/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: selectedJobIds,
          confirm: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete jobs')
      }

      const result = await response.json()
      toast.dismiss(toastId)
      toast.success(`Successfully deleted ${result.deleted} job(s)`)
      onClearSelection()
      onRefresh?.()
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error('Delete failed', {
        description: error.message
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkRerun = async () => {
    if (!confirm(`Rerun ${selectedJobIds.length} job(s)?`)) {
      return
    }

    setIsRerunning(true)
    const toastId = toast.loading(`Queueing ${selectedJobIds.length} job(s)...`)

    try {
      const response = await fetch('/api/jobs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: selectedJobIds,
          executionType: 'test',
          useAgentQL: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to rerun jobs')
      }

      const result = await response.json()
      toast.dismiss(toastId)
      toast.success(`Successfully queued ${result.rerunJobs} job(s)`, {
        description: 'Jobs will begin execution shortly'
      })
      onClearSelection()
      onRefresh?.()
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error('Rerun failed', {
        description: error.message
      })
    } finally {
      setIsRerunning(false)
    }
  }

  const handleBulkExport = async () => {
    setIsExporting(true)
    const toastId = toast.export.started()

    try {
      const response = await fetch(`/api/jobs/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: selectedJobIds,
          batchId,
          format: 'csv',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export jobs')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `selected-jobs-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.dismiss(toastId)
      toast.export.completed(a.download)
      onClearSelection()
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.export.failed(error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleMarkReviewed = async () => {
    setIsMarkingReviewed(true)
    const toastId = toast.loading(`Marking ${selectedJobIds.length} job(s) as reviewed...`)

    try {
      const response = await fetch('/api/jobs/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: selectedJobIds,
          updates: {
            reviewed: true,
            reviewedAt: new Date().toISOString(),
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark jobs as reviewed')
      }

      const result = await response.json()
      toast.dismiss(toastId)
      toast.success(`Marked ${result.updated} job(s) as reviewed`)
      onClearSelection()
      onRefresh?.()
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error('Mark reviewed failed', {
        description: error.message
      })
    } finally {
      setIsMarkingReviewed(false)
    }
  }

  if (selectedJobIds.length === 0) {
    return null
  }

  return (
    <div className="sticky top-0 z-10 bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-blue-900">
          {selectedJobIds.length} job{selectedJobIds.length !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-sm text-blue-700 hover:text-blue-900 flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleMarkReviewed}
          disabled={isMarkingReviewed}
          className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          {isMarkingReviewed ? 'Marking...' : 'Mark Reviewed'}
        </button>

        <button
          onClick={handleBulkExport}
          disabled={isExporting}
          className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </button>

        <button
          onClick={handleBulkRerun}
          disabled={isRerunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRerunning ? 'animate-spin' : ''}`} />
          {isRerunning ? 'Rerunning...' : 'Rerun'}
        </button>

        <button
          onClick={handleBulkDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
