'use client'

import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/Button'

interface BulkActionToolbarProps {
  selectedCount: number
  onDelete: () => void
  onClear: () => void
}

export function BulkActionToolbar({ selectedCount, onDelete, onClear }: BulkActionToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl px-4 py-3 flex items-center gap-4">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
            {selectedCount}
          </div>
          <span className="text-sm font-medium">
            {selectedCount} batch{selectedCount === 1 ? '' : 'es'} selected
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-700" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>

          <button
            onClick={onClear}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
