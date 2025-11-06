'use client'

/**
 * Collapsible Section Component
 * Generic collapsible wrapper for progressive disclosure
 * Uses fintech UI design system
 */

import { useState, useEffect, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

export interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  defaultExpanded?: boolean
  children: ReactNode
  badge?: string | number
  storageKey?: string // For persisting state in localStorage
}

export function CollapsibleSection({
  title,
  subtitle,
  icon,
  defaultExpanded = false,
  children,
  badge,
  storageKey,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Load saved state from localStorage
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`collapsible-${storageKey}`)
      if (saved !== null) {
        setIsExpanded(saved === 'true')
      }
    }
    setHasLoaded(true)
  }, [storageKey])

  // Save state to localStorage
  const handleToggle = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    if (storageKey) {
      localStorage.setItem(`collapsible-${storageKey}`, String(newState))
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-fintech-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          {icon && (
            <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
              {icon}
            </div>
          )}

          {/* Title and Subtitle */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              {badge !== undefined && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight
          className={`h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-all ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {/* Content */}
      {hasLoaded && (
        <div
          className={`
            transition-all duration-200 ease-in-out
            ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
          `}
        >
          <div className="px-6 pb-6 border-t border-gray-100">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
