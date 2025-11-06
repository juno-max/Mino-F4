'use client'

import { useState } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/Button'

interface ProjectDeleteModalProps {
  project: {
    id: string
    name: string
    batchCount?: number
  }
  onClose: () => void
  onDelete: () => Promise<void>
}

export function ProjectDeleteModal({ project, onClose, onDelete }: ProjectDeleteModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const isConfirmed = confirmText === project.name
  const hasBatches = (project.batchCount ?? 0) > 0

  const handleDelete = async () => {
    if (!isConfirmed) return

    try {
      setDeleting(true)
      setError('')
      await onDelete()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete project')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Delete Project</h2>
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
            {hasBatches ? (
              <p className="text-sm text-amber-800">
                All {project.batchCount} batches and their associated data will be permanently deleted.
              </p>
            ) : (
              <p className="text-sm text-amber-800">
                This project will be permanently deleted.
              </p>
            )}
          </div>

          {/* Project Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <p className="text-sm text-gray-600 mb-1">You are about to delete:</p>
            <p className="text-base font-semibold text-gray-900">{project.name}</p>
            {hasBatches && (
              <p className="text-sm text-gray-600 mt-1">{project.batchCount} batches</p>
            )}
          </div>

          {/* Cascade Delete Warning */}
          {hasBatches && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-sm text-red-900 font-medium mb-1">
                ⚠️ Cascade Delete Warning
              </p>
              <p className="text-sm text-red-800">
                Deleting this project will also delete all batches, jobs, and execution history. Consider moving batches to another project first.
              </p>
            </div>
          )}

          {/* Confirmation Input */}
          <div>
            <label htmlFor="confirm-name" className="block text-sm font-medium text-gray-700 mb-1">
              Type <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600 font-mono text-sm">{project.name}</code> to confirm
            </label>
            <input
              id="confirm-name"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter project name"
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
                Delete Project
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
