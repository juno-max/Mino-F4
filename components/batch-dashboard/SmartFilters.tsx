'use client'

import { Filter } from 'lucide-react'

interface FilterOption {
  id: string
  label: string
  count: number
  color?: string
}

interface SmartFiltersProps {
  filters: FilterOption[]
  activeFilter: string
  onFilterChange: (filterId: string) => void
}

export function SmartFilters({ filters, activeFilter, onFilterChange }: SmartFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filter:</span>
      </div>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300 shadow-sm'
                : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }
            `}
          >
            {filter.label}
            {filter.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-600'
              }`}>
                {filter.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
