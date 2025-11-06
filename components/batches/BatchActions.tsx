'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { BatchEditModal } from './BatchEditModal'
import { BatchDeleteModal } from './BatchDeleteModal'

interface BatchActionsProps {
  batch: {
    id: string
    name: string
    description: string | null
    projectId: string
    totalSites: number
  }
  projects: Array<{
    id: string
    name: string
  }>
}

export function BatchActions({ batch, projects }: BatchActionsProps) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleSave = async (updates: { name: string; description: string; projectId: string }) => {
    const response = await fetch(`/api/batches/${batch.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to update batch')
    }

    // If project changed, redirect to new project path
    if (updates.projectId !== batch.projectId) {
      router.push(`/projects/${updates.projectId}/batches/${batch.id}`)
    } else {
      router.refresh()
    }
  }

  const handleDelete = async () => {
    const response = await fetch(`/api/batches/${batch.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to delete batch')
    }

    router.push(`/projects/${batch.projectId}`)
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Batch actions"
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <button
                onClick={() => {
                  setShowEditModal(true)
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
              >
                <Edit className="h-4 w-4" />
                Edit Batch
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(true)
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
              >
                <Trash2 className="h-4 w-4" />
                Delete Batch
              </button>
            </div>
          </>
        )}
      </div>

      {showEditModal && (
        <BatchEditModal
          batch={batch}
          projects={projects}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}

      {showDeleteModal && (
        <BatchDeleteModal
          batch={batch}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
