'use client'

import { X } from 'lucide-react'
import { ProjectInstructionsContent } from './ProjectInstructionsContent'
import { defaultInstructionsData } from '@/lib/project-instructions-data'

interface ProjectInstructionsPanelProps {
  isOpen: boolean
  onClose: () => void
  data?: typeof defaultInstructionsData
  projectId?: string
}

export function ProjectInstructionsPanel({ 
  isOpen, 
  onClose, 
  data = defaultInstructionsData,
  projectId 
}: ProjectInstructionsPanelProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-stone-900">Project Instructions</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center hover:bg-stone-100 rounded transition-fintech"
          >
            <X className="h-5 w-5 text-stone-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <ProjectInstructionsContent
            data={data}
            showActions={true}
            onSave={() => {
              console.log('Saving project instructions...', data)
              onClose()
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </>
  )
}
