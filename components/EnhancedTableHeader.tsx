'use client'

import { useState, useCallback } from 'react'
import { Search, Filter, Download, X } from 'lucide-react'
import { Button } from '@/components/Button'

interface FilterBadge {
  label: string
  value: string
  onRemove?: () => void
}

interface EnhancedTableHeaderProps {
  onSearch?: (query: string) => void
  onExport?: () => void
  filterBadges?: FilterBadge[]
  placeholder?: string
  showSearch?: boolean
  showExport?: boolean
  searchValue?: string
  exporting?: boolean
}

export function EnhancedTableHeader({
  onSearch,
  onExport,
  filterBadges = [],
  placeholder = 'Search by site URL, job ID...',
  showSearch = true,
  showExport = true,
  searchValue = '',
  exporting = false
}: EnhancedTableHeaderProps) {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue)

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setLocalSearchValue(query)
    onSearch?.(query)
  }, [onSearch])

  const handleClearSearch = useCallback(() => {
    setLocalSearchValue('')
    onSearch?.('')
  }, [onSearch])

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50/50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={placeholder}
              value={localSearchValue}
              onChange={handleSearch}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-md
                focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                transition-all duration-200
                placeholder:text-gray-400"
            />
            {localSearchValue && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {filterBadges.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {filterBadges.map((badge, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium
                  bg-white border border-gray-300 rounded-md
                  hover:border-gray-400 transition-colors"
              >
                <span className="text-gray-600">{badge.label}:</span>
                <span className="text-gray-900">{badge.value}</span>
                {badge.onRemove && (
                  <button
                    onClick={badge.onRemove}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-3">
        {showExport && (
          <Button
            size="sm"
            variant="outline"
            onClick={onExport}
            disabled={exporting}
            className="whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        )}
      </div>
    </div>
  )
}

// Standalone filter badge component for reuse
export function FilterBadge({
  label,
  value,
  onRemove
}: FilterBadge) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium
        bg-white border border-gray-300 rounded-md
        hover:border-gray-400 transition-colors"
    >
      <span className="text-gray-600">{label}:</span>
      <span className="text-gray-900">{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
