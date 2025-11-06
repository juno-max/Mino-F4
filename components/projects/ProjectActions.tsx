'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { ProjectEditModal } from './ProjectEditModal'
import { ProjectDeleteModal } from './ProjectDeleteModal'

interface ProjectActionsProps {
  project: {
    id: string
    name: string
    description: string | null
    instructions: string | null
    batchCount?: number
  }
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleSave = async (updates: { name: string; description: string; instructions: string }) => {
    const response = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to update project')
    }

    router.refresh()
  }

  const handleDelete = async () => {
    const response = await fetch(`/api/projects/${project.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to delete project')
    }

    router.push('/projects')
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-0.5 hover:bg-gray-100 rounded transition-colors"
          aria-label="Project actions"
        >
          <MoreVertical className="h-3.5 w-3.5 text-gray-600" />
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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowEditModal(true)
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
              >
                <Edit className="h-4 w-4" />
                Edit Project
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDeleteModal(true)
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </button>
            </div>
          </>
        )}
      </div>

      {showEditModal && (
        <ProjectEditModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}

      {showDeleteModal && (
        <ProjectDeleteModal
          project={project}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
