'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface CollapsiblePanelProps {
  position: 'left' | 'right'
  title?: string
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  width?: string
  className?: string
}

export function CollapsiblePanel({
  position,
  title,
  children,
  isOpen,
  onClose,
  width = 'w-80',
  className = ''
}: CollapsiblePanelProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <aside
        className={`
          fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'} h-full
          ${width}
          bg-white
          shadow-2xl
          z-50
          flex flex-col
          animate-slide-in
          ${position === 'left' ? 'border-r' : 'border-l'} border-stone-200
          ${className}
        `}
      >
        {/* Header */}
        {title && (
          <div className="px-4 py-4 border-b border-stone-200 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center hover:bg-stone-100 rounded-lg transition-fintech"
              aria-label="Close panel"
            >
              <X className="h-5 w-5 text-stone-600" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </aside>
    </>
  )
}
