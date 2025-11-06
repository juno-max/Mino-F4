'use client'

import { RefreshCw, Download, Trash2, X } from 'lucide-react'
import { Button } from '@/components/Button'

interface BulkActionsBarProps {
  selectedCount: number
  onRetry: () => void
  onExport: () => void
  onDelete: () => void
  onClearSelection: () => void
}

export function BulkActionsBar({
  selectedCount,
  onRetry,
  onExport,
  onDelete,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 text-emerald-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {selectedCount} {selectedCount === 1 ? 'job' : 'jobs'} selected
          </span>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onExport}
            className="flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <button
          onClick={onClearSelection}
          className="ml-2 p-1 hover:bg-gray-100 rounded-md transition-colors"
          title="Clear selection"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}
