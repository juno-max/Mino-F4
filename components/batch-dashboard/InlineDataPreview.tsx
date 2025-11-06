'use client'

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface InlineDataPreviewProps {
  extractedData: Record<string, any> | null
  groundTruthData?: Record<string, any> | null
  maxFields?: number
  showGroundTruthComparison?: boolean
}

export function InlineDataPreview({
  extractedData,
  groundTruthData,
  maxFields = 3,
  showGroundTruthComparison = false,
}: InlineDataPreviewProps) {
  if (!extractedData || Object.keys(extractedData).length === 0) {
    return (
      <div className="text-sm text-gray-400 italic py-2">
        No data extracted
      </div>
    )
  }

  const fields = Object.entries(extractedData).slice(0, maxFields)

  return (
    <div className="space-y-1.5 py-1">
      {fields.map(([key, value]) => {
        const gtValue = groundTruthData?.[key]
        const hasGroundTruth = showGroundTruthComparison && gtValue !== undefined && gtValue !== null
        const matches = hasGroundTruth && String(value) === String(gtValue)

        return (
          <div key={key} className="flex items-start gap-2 text-sm">
            {showGroundTruthComparison && hasGroundTruth && (
              <div className="flex-shrink-0 mt-0.5">
                {matches ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-700">{key}:</span>{' '}
              <span className={`${
                value === null || value === undefined || value === ''
                  ? 'text-gray-400 italic'
                  : hasGroundTruth && !matches
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}>
                {value !== null && value !== undefined && value !== ''
                  ? truncate(String(value), 60)
                  : '(missing)'}
              </span>
            </div>
          </div>
        )
      })}
      {Object.keys(extractedData).length > maxFields && (
        <div className="text-xs text-gray-500 italic">
          +{Object.keys(extractedData).length - maxFields} more fields
        </div>
      )}
    </div>
  )
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}
