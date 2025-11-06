'use client'

import { useState, useEffect } from 'react'
import { X, Save, Folder } from 'lucide-react'
import { Button } from '@/components/Button'

interface Project {
  id: string
  name: string
}

interface BatchEditModalProps {
  batch: {
    id: string
    name: string
    description: string | null
    projectId: string
  }
  projects: Project[]
  onClose: () => void
  onSave: (updates: { name: string; description: string; projectId: string }) => Promise<void>
}

export function BatchEditModal({ batch, projects, onClose, onSave }: BatchEditModalProps) {
  const [name, setName] = useState(batch.name)
  const [description, setDescription] = useState(batch.description || '')
  const [projectId, setProjectId] = useState(batch.projectId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Batch name is required')
      return
    }

    try {
      setSaving(true)
      setError('')
      await onSave({ name: name.trim(), description: description.trim(), projectId })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update batch')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Batch</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

          {/* Batch Name */}
          <div>
            <label htmlFor="batch-name" className="block text-sm font-medium text-gray-700 mb-1">
              Batch Name
            </label>
            <input
              id="batch-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Q1_Analysis"
              disabled={saving}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="batch-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="batch-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add notes about this batch..."
              disabled={saving}
            />
          </div>

          {/* Project Selection */}
          <div>
            <label htmlFor="batch-project" className="block text-sm font-medium text-gray-700 mb-1">
              <Folder className="h-4 w-4 inline mr-1" />
              Project
            </label>
            <select
              id="batch-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {projectId !== batch.projectId && (
              <p className="text-xs text-amber-600 mt-1">
                This will move the batch to a different project
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
