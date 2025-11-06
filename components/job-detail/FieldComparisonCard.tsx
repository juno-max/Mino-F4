'use client'

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface FieldComparisonCardProps {
  fieldName: string
  extractedValue: any
  groundTruthValue?: any
  hasGroundTruth?: boolean
}

export function FieldComparisonCard({
  fieldName,
  extractedValue,
  groundTruthValue,
  hasGroundTruth = false,
}: FieldComparisonCardProps) {
  const hasValue = extractedValue !== null && extractedValue !== undefined && extractedValue !== ''
  const hasGT = hasGroundTruth && groundTruthValue !== null && groundTruthValue !== undefined
  const matches = hasGT && hasValue && String(extractedValue) === String(groundTruthValue)
  const hasMismatch = hasGT && hasValue && !matches
  const isMissing = !hasValue

  // Determine card style
  let cardStyle = 'border-gray-200 bg-white'
  let iconColor = 'text-gray-400'
  let Icon = AlertCircle

  if (hasGT) {
    if (isMissing) {
      cardStyle = 'border-red-300 bg-red-50'
      iconColor = 'text-red-600'
      Icon = XCircle
    } else if (matches) {
      cardStyle = 'border-emerald-300 bg-emerald-50'
      iconColor = 'text-emerald-600'
      Icon = CheckCircle
    } else if (hasMismatch) {
      cardStyle = 'border-orange-300 bg-orange-50'
      iconColor = 'text-orange-600'
      Icon = XCircle
    }
  } else {
    if (hasValue) {
      cardStyle = 'border-blue-200 bg-blue-50'
      iconColor = 'text-blue-600'
      Icon = CheckCircle
    } else {
      cardStyle = 'border-gray-200 bg-gray-50'
      iconColor = 'text-gray-400'
      Icon = XCircle
    }
  }

  return (
    <div className={`border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md ${cardStyle}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {fieldName}
          </div>
        </div>
        <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 ml-2`} />
      </div>

      {/* Extracted Value */}
      <div className="mb-3">
        <div className="text-lg font-semibold text-gray-900 break-words">
          {hasValue ? (
            String(extractedValue)
          ) : (
            <span className="text-gray-400 italic text-base">Not found</span>
          )}
        </div>
      </div>

      {/* Ground Truth Comparison */}
      {hasGT && (
        <div className="pt-3 border-t border-current border-opacity-20">
          <div className="text-xs font-medium text-gray-600 mb-1">Expected (Ground Truth)</div>
          <div className="text-sm font-mono text-gray-700 break-words">
            {String(groundTruthValue)}
          </div>
          <div className={`text-xs font-bold mt-2 ${
            isMissing
              ? 'text-red-600'
              : matches
              ? 'text-emerald-600'
              : 'text-orange-600'
          }`}>
            {isMissing ? '✗ Missing' : matches ? '✓ Exact Match' : '⚠ Mismatch'}
          </div>
        </div>
      )}
    </div>
  )
}
