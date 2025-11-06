'use client'

/**
 * DataCell Component
 * Displays extracted field values with validation indicators
 */

import { CheckCircle2, XCircle, AlertTriangle, Minus } from 'lucide-react'

export interface DataCellProps {
  value: any
  groundTruth?: any
  fieldName: string
  fieldType?: string
}

export function DataCell({ value, groundTruth, fieldName, fieldType }: DataCellProps) {
  const hasValue = value !== null && value !== undefined && value !== ''
  const hasGroundTruth = groundTruth !== null && groundTruth !== undefined && groundTruth !== ''

  // Determine validation status
  let validationStatus: 'match' | 'mismatch' | 'no-gt' | 'no-value' = 'no-value'
  let validationIcon = null
  let validationColor = ''

  if (!hasValue) {
    validationStatus = 'no-value'
    validationIcon = <Minus className="h-3 w-3 text-gray-300" />
    validationColor = 'text-gray-400'
  } else if (!hasGroundTruth) {
    validationStatus = 'no-gt'
    validationIcon = <AlertTriangle className="h-3 w-3 text-amber-500" />
    validationColor = 'text-gray-700'
  } else {
    // Compare values (normalize for comparison)
    const normalizedValue = String(value).trim().toLowerCase()
    const normalizedGT = String(groundTruth).trim().toLowerCase()

    if (normalizedValue === normalizedGT) {
      validationStatus = 'match'
      validationIcon = <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      validationColor = 'text-gray-900 font-medium'
    } else {
      validationStatus = 'mismatch'
      validationIcon = <XCircle className="h-3 w-3 text-red-500" />
      validationColor = 'text-gray-900'
    }
  }

  // Format value for display
  const displayValue = formatValue(value, fieldType)

  // Truncate long values
  const maxLength = 50
  const truncatedValue = displayValue.length > maxLength
    ? displayValue.substring(0, maxLength) + '...'
    : displayValue

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex-shrink-0" title={getValidationTooltip(validationStatus, groundTruth)}>
        {validationIcon}
      </div>
      <span
        className={`text-sm truncate ${validationColor}`}
        title={displayValue}
      >
        {truncatedValue}
      </span>
    </div>
  )
}

function formatValue(value: any, fieldType?: string): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.join(', ')
  }

  // Handle objects
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  // Handle numbers
  if (typeof value === 'number') {
    // Check if it looks like a price
    if (fieldType === 'price' || String(value).match(/^\d+\.\d{2}$/)) {
      return `$${value.toFixed(2)}`
    }
    return String(value)
  }

  return String(value)
}

function getValidationTooltip(status: string, groundTruth?: any): string {
  switch (status) {
    case 'match':
      return `✓ Matches ground truth: "${groundTruth}"`
    case 'mismatch':
      return `✗ Doesn't match ground truth: "${groundTruth}"`
    case 'no-gt':
      return '⚠ Extracted, but no ground truth to compare'
    case 'no-value':
      return '- Not extracted'
    default:
      return ''
  }
}
