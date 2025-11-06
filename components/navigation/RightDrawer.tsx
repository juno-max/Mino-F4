'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useCmdOrCtrlKey } from '@/hooks/useKeyboardShortcut'

interface RightDrawerProps {
  projectId?: string
  batchId?: string
  context?: 'project' | 'batch' | 'job' | 'account'
  children?: React.ReactNode
}

export default function RightDrawer({ projectId, batchId, context = 'project', children }: RightDrawerProps) {
  const [isOpen, setIsOpen] = useLocalStorage(`drawer-open-${context}-${projectId || 'default'}`, false)

  // Close drawer with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, setIsOpen])

  // Toggle drawer with Cmd+I (for instructions)
  useCmdOrCtrlKey('i', () => {
    if (context === 'project') {
      setIsOpen(!isOpen)
    }
  })

  return (
    <>
      {/* No overlay - per design principles: don't block main content */}

      {/* Drawer */}
      <div
        className={`
          fixed right-0 top-16 bottom-0 w-[480px]
          bg-white border-l border-gray-200 shadow-fintech-lg z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900">
                {context === 'project' && 'Workflow Instructions'}
                {context === 'batch' && 'Batch Settings'}
                {context === 'job' && 'Job Actions'}
                {context === 'account' && 'Help & Documentation'}
              </h3>
              {context === 'project' && (
                <p className="text-xs text-gray-500 mt-0.5">Press Cmd+I to toggle</p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close drawer (Esc)"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children || (
              <div className="text-center py-12 px-4">
                <div className="text-gray-400 mb-2 text-4xl">
                  {context === 'project' && '📝'}
                  {context === 'batch' && '⚙️'}
                  {context === 'job' && '🔧'}
                  {context === 'account' && '❓'}
                </div>
                <p className="text-sm text-gray-500">
                  {context === 'project' && 'Pass InstructionsEditor component as children'}
                  {context === 'batch' && 'Batch settings will appear here'}
                  {context === 'job' && 'Job actions will appear here'}
                  {context === 'account' && 'Help documentation will appear here'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating toggle button (when drawer is closed) */}
      {!isOpen && context === 'project' && (
        <button
          onClick={() => setIsOpen(true)}
          className="
            fixed right-6 top-24 z-30
            bg-emerald-600 hover:bg-emerald-700
            text-white font-semibold text-sm
            px-3 py-2 rounded-md shadow-fintech-md
            transition-all duration-200
            flex items-center gap-2
          "
          title="Open instructions (Cmd+I)"
        >
          <span className="text-base">📝</span>
          <span>Instructions</span>
        </button>
      )}
    </>
  )
}
