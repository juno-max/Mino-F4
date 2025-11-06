'use client'

import { LayoutGrid, List } from 'lucide-react'
import { useState, useEffect } from 'react'

type ViewMode = 'grid' | 'list'

interface ViewSwitcherProps {
  onViewChange: (view: ViewMode) => void
}

export function ViewSwitcher({ onViewChange }: ViewSwitcherProps) {
  const [view, setView] = useState<ViewMode>('grid')

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('projects-view') as ViewMode
    if (saved) {
      setView(saved)
      onViewChange(saved)
    }
  }, [])

  const handleViewChange = (newView: ViewMode) => {
    setView(newView)
    localStorage.setItem('projects-view', newView)
    onViewChange(newView)
  }

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => handleViewChange('grid')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
          ${view === 'grid'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
          }
        `}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
        Grid
      </button>
      <button
        onClick={() => handleViewChange('list')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
          ${view === 'list'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
          }
        `}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
        List
      </button>
    </div>
  )
}
