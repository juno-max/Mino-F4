'use client'

import { AlertCircle, CheckCircle, Play, XCircle, Clock } from 'lucide-react'

export type FilterPreset = 'all' | 'needs-attention' | 'running' | 'perfect' | 'failed'

interface SmartFiltersProps {
  activeFilter: FilterPreset
  onFilterChange: (filter: FilterPreset) => void
  counts: {
    all: number
    needsAttention: number
    running: number
    perfect: number
    failed: number
  }
}

export function SmartFilters({
  activeFilter,
  onFilterChange,
  counts
}: SmartFiltersProps) {
  const filters = [
    {
      id: 'all' as FilterPreset,
      label: 'All Jobs',
      icon: null,
      count: counts.all,
      color: 'text-gray-600',
      activeColor: 'bg-gray-100 text-gray-900'
    },
    {
      id: 'needs-attention' as FilterPreset,
      label: 'Needs Attention',
      icon: AlertCircle,
      count: counts.needsAttention,
      color: 'text-amber-600',
      activeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'running' as FilterPreset,
      label: 'Running',
      icon: Play,
      count: counts.running,
      color: 'text-blue-600',
      activeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'perfect' as FilterPreset,
      label: 'Perfect Match',
      icon: CheckCircle,
      count: counts.perfect,
      color: 'text-emerald-600',
      activeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'failed' as FilterPreset,
      label: 'Failed',
      icon: XCircle,
      count: counts.failed,
      color: 'text-red-600',
      activeColor: 'bg-red-50 text-red-700 border-red-200'
    }
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => {
        const Icon = filter.icon
        const isActive = activeFilter === filter.id

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium
              transition-all duration-150
              ${isActive
                ? filter.activeColor
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              }
            `}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{filter.label}</span>
            <span className={`
              ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold
              ${isActive ? 'bg-white/60' : 'bg-gray-100'}
            `}>
              {filter.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
