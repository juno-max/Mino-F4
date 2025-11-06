'use client'

/**
 * DynamicTableHeader Component
 * Generates table headers from batch column schema
 * Supports extracted fields, ground truth indicators, and column visibility
 */

import { Eye, EyeOff } from 'lucide-react'

export interface ColumnConfig {
  name: string
  type: string
  isGroundTruth: boolean
  isUrl: boolean
}

export interface DynamicTableHeaderProps {
  columnSchema: ColumnConfig[]
  visibleColumns?: Set<string>
  onToggleColumn?: (columnName: string) => void
  showColumnControls?: boolean
  allSelected?: boolean
  onSelectAll?: () => void
}

export function DynamicTableHeader({
  columnSchema,
  visibleColumns = new Set(columnSchema.map(col => col.name)),
  onToggleColumn,
  showColumnControls = false,
  allSelected = false,
  onSelectAll,
}: DynamicTableHeaderProps) {
  // Separate URL columns from extracted data columns
  const urlColumns = columnSchema.filter(col => col.isUrl)
  const dataColumns = columnSchema.filter(col => !col.isUrl && !col.isGroundTruth)
  const gtColumns = columnSchema.filter(col => col.isGroundTruth)

  const renderColumnHeader = (col: ColumnConfig, isVisible: boolean) => {
    const canToggle = showColumnControls && onToggleColumn

    return (
      <th
        key={col.name}
        className={`
          px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider
          ${!isVisible ? 'opacity-50' : ''}
          ${canToggle ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}
        `}
        onClick={() => canToggle && onToggleColumn(col.name)}
      >
        <div className="flex items-center gap-2">
          {/* Column name and type */}
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">{col.name}</span>
            {col.type && (
              <span className="text-[10px] text-gray-400 font-normal lowercase">
                {col.type}
              </span>
            )}
          </div>

          {/* Ground truth indicator */}
          {col.isGroundTruth && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
              GT
            </span>
          )}

          {/* Visibility toggle */}
          {canToggle && (
            <button
              className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onToggleColumn(col.name)
              }}
            >
              {isVisible ? (
                <Eye className="h-3 w-3 text-gray-500" />
              ) : (
                <EyeOff className="h-3 w-3 text-gray-400" />
              )}
            </button>
          )}
        </div>
      </th>
    )
  }

  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        {/* Checkbox column */}
        <th className="w-12 px-4 py-3 text-left">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className="h-4 w-4 rounded border-gray-300 text-[rgb(52,211,153)] focus:ring-[rgb(52,211,153)] cursor-pointer"
          />
        </th>

        {/* Status column (compact) */}
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
          Status
        </th>

        {/* Accuracy column (if ground truth available) */}
        {gtColumns.length > 0 && (
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
            Accuracy
          </th>
        )}

        {/* Dynamic extracted data columns (PRIMARY FOCUS) */}
        {dataColumns.map(col =>
          visibleColumns.has(col.name) && renderColumnHeader(col, true)
        )}

        {/* URL column (secondary, compact) */}
        {urlColumns.map(col => (
          <th
            key={col.name}
            className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider max-w-[200px]"
          >
            <span className="truncate block">{col.name}</span>
          </th>
        ))}

        {/* Progress column */}
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
          Progress
        </th>

        {/* Duration column */}
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
          Duration
        </th>

        {/* Actions column */}
        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
          Actions
        </th>
      </tr>

      {/* Column controls row (optional) */}
      {showColumnControls && (
        <tr className="bg-blue-50 border-b border-blue-200">
          <td colSpan={100} className="px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-medium">Visible columns:</span>
              <div className="flex gap-2 flex-wrap">
                {dataColumns.map(col => (
                  <button
                    key={col.name}
                    onClick={() => onToggleColumn?.(col.name)}
                    className={`
                      px-2 py-1 rounded transition-colors
                      ${visibleColumns.has(col.name)
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }
                    `}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </thead>
  )
}
