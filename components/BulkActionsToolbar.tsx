'use client'

import React, { useState } from 'react'
import { Trash2, RefreshCw, X } from 'lucide-react'

interface BulkActionsToolbarProps {
  selectedJobIds: string[]
  onClearSelection: () => void
  onRefresh?: () => void
}

export default function BulkActionsToolbar({
  selectedJobIds,
  onClearSelection,
  onRefresh,
}: BulkActionsToolbarProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRerunning, setIsRerunning] = useState(false)

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedJobIds.length} job(s)? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
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
      alert(`Successfully deleted ${result.deleted} job(s)`)
      onClearSelection()
      onRefresh?.()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkRerun = async () => {
    if (!confirm(`Rerun ${selectedJobIds.length} job(s)?`)) {
      return
    }

    setIsRerunning(true)
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
      alert(`Successfully queued ${result.rerunJobs} job(s) for execution`)
      onClearSelection()
      onRefresh?.()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsRerunning(false)
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
