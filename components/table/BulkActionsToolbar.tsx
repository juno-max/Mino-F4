'use client'

import { Download, RotateCcw, Trash2, X } from 'lucide-react'
import { Button } from '../Button'

interface BulkActionsToolbarProps {
  selectedCount: number
  onRetrySelected?: () => void
  onDeleteSelected?: () => void
  onExportSelected?: () => void
  onClearSelection: () => void
  loading?: boolean
}

export function BulkActionsToolbar({
  selectedCount,
  onRetrySelected,
  onDeleteSelected,
  onExportSelected,
  onClearSelection,
  loading = false
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-gray-900">
            {selectedCount} selected
          </span>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onExportSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportSelected}
              disabled={loading}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
          )}

          {onRetrySelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetrySelected}
              disabled={loading}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          )}

          {onDeleteSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteSelected}
              disabled={loading}
              className="text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
