'use client'

import { useState } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/Button'

interface BulkBatchDeleteModalProps {
  batches: Array<{
    id: string
    name: string
    totalSites: number
  }>
  onClose: () => void
  onDelete: () => Promise<void>
}

export function BulkBatchDeleteModal({ batches, onClose, onDelete }: BulkBatchDeleteModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const totalSites = batches.reduce((sum, batch) => sum + batch.totalSites, 0)
  const isConfirmed = confirmText.toUpperCase() === 'DELETE'

  const handleDelete = async () => {
    if (!isConfirmed) return

    try {
      setDeleting(true)
      setError('')
      await onDelete()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete batches')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Delete {batches.length} Batches</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={deleting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p className="text-sm text-amber-900 font-medium mb-1">
              This action cannot be undone
            </p>
            <p className="text-sm text-amber-800">
              All {totalSites.toLocaleString()} sites across {batches.length} batches and their associated job data will be permanently deleted.
            </p>
          </div>

          {/* Batches List */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
            <p className="text-sm text-gray-600 mb-2 font-medium">Batches to be deleted:</p>
            <div className="space-y-1">
              {batches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between text-sm py-1">
                  <span className="font-medium text-gray-900 truncate flex-1">{batch.name}</span>
                  <span className="text-gray-600 ml-2">{batch.totalSites} sites</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-sm text-red-900 font-medium mb-1">
              ⚠️ Total Impact
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-red-800">
              <div>
                <span className="font-semibold">{batches.length}</span> batches
              </div>
              <div>
                <span className="font-semibold">{totalSites.toLocaleString()}</span> sites
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700 mb-1">
              Type <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600 font-mono text-sm">DELETE</code> to confirm
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Type DELETE in capital letters"
              disabled={deleting}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {batches.length} Batches
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
