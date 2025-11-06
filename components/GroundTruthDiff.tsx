'use client'

import { CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react'

interface GroundTruthDiffProps {
  extractedData: Record<string, any> | null
  groundTruthData: Record<string, any> | null
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 100

  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 100

  const editDistance = levenshteinDistance(longer, shorter)
  return ((longer.length - editDistance) / longer.length) * 100
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Normalize value for comparison
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined) return ''
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ')
}

export function GroundTruthDiff({ extractedData, groundTruthData }: GroundTruthDiffProps) {
  if (!extractedData && !groundTruthData) {
    return (
      <div className="text-center py-8 text-stone-500">
        <p className="text-sm">No data available for comparison</p>
      </div>
    )
  }

  // Get all unique field names from both datasets
  const allFields = new Set([
    ...Object.keys(extractedData || {}),
    ...Object.keys(groundTruthData || {}),
  ])

  const fields = Array.from(allFields).sort()

  return (
    <div className="space-y-3">
      {fields.map((fieldName) => {
        const actualValue = extractedData?.[fieldName]
        const expectedValue = groundTruthData?.[fieldName]

        // Determine if this field has ground truth
        const hasGroundTruth = expectedValue !== undefined && expectedValue !== null

        // Normalize values for comparison
        const normalizedActual = normalizeValue(actualValue)
        const normalizedExpected = normalizeValue(expectedValue)

        // Determine match status
        const isExactMatch = hasGroundTruth && normalizedActual === normalizedExpected
        const similarity = hasGroundTruth && normalizedActual && normalizedExpected
          ? calculateSimilarity(normalizedActual, normalizedExpected)
          : null

        const isPartialMatch = similarity !== null && similarity > 80 && similarity < 100
        const isMismatch = hasGroundTruth && similarity !== null && similarity <= 80
        const isMissing = hasGroundTruth && !normalizedActual

        // Determine card styling
        let borderColor = 'border-stone-200'
        let bgColor = 'bg-white'
        let statusIcon = null
        let statusText = ''
        let statusColor = ''

        if (hasGroundTruth) {
          if (isExactMatch) {
            borderColor = 'border-green-300'
            bgColor = 'bg-green-50/30'
            statusIcon = <CheckCircle className="h-5 w-5 text-green-600" />
            statusText = 'Exact Match'
            statusColor = 'text-green-700'
          } else if (isPartialMatch) {
            borderColor = 'border-amber-300'
            bgColor = 'bg-amber-50/30'
            statusIcon = <AlertCircle className="h-5 w-5 text-amber-600" />
            statusText = `${similarity?.toFixed(0)}% Similar`
            statusColor = 'text-amber-700'
          } else if (isMissing) {
            borderColor = 'border-red-300'
            bgColor = 'bg-red-50/30'
            statusIcon = <XCircle className="h-5 w-5 text-red-600" />
            statusText = 'Missing'
            statusColor = 'text-red-700'
          } else {
            borderColor = 'border-red-300'
            bgColor = 'bg-red-50/30'
            statusIcon = <XCircle className="h-5 w-5 text-red-600" />
            statusText = 'Mismatch'
            statusColor = 'text-red-700'
          }
        }

        return (
          <div
            key={fieldName}
            className={`border ${borderColor} ${bgColor} rounded-lg p-4 transition-all`}
          >
            {/* Field Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-stone-900">{fieldName}</div>
              {hasGroundTruth && (
                <div className="flex items-center gap-2">
                  {statusIcon}
                  <span className={`text-sm font-medium ${statusColor}`}>
                    {statusText}
                  </span>
                </div>
              )}
            </div>

            {/* Side-by-Side Comparison */}
            {hasGroundTruth ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Expected Value */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-stone-500 uppercase">
                    Expected (Ground Truth)
                  </div>
                  <div className="bg-white border border-stone-200 rounded p-3">
                    <div className="text-sm font-mono break-all text-stone-900">
                      {expectedValue !== null && expectedValue !== undefined
                        ? String(expectedValue)
                        : <span className="text-stone-400">—</span>
                      }
                    </div>
                  </div>
                </div>

                {/* Actual Value */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-stone-500 uppercase">
                    Actual (Extracted)
                  </div>
                  <div className={`border rounded p-3 ${
                    isMissing ? 'bg-red-50 border-red-200' :
                    isExactMatch ? 'bg-green-50 border-green-200' :
                    isPartialMatch ? 'bg-amber-50 border-amber-200' :
                    isMismatch ? 'bg-red-50 border-red-200' :
                    'bg-white border-stone-200'
                  }`}>
                    <div className="text-sm font-mono break-all text-stone-900">
                      {actualValue !== null && actualValue !== undefined
                        ? String(actualValue)
                        : <span className="text-stone-400">Not extracted</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* No Ground Truth - Show Extracted Only */
              <div>
                <div className="text-xs text-stone-500 mb-1">Extracted Value (No Ground Truth)</div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="text-sm font-mono break-all text-blue-900">
                    {actualValue !== null && actualValue !== undefined
                      ? String(actualValue)
                      : <span className="text-blue-400">—</span>
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Diff for Mismatches */}
            {isMismatch && normalizedActual && normalizedExpected && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <div className="text-xs font-medium text-red-700 mb-2">Character-level Diff:</div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-red-600 line-through">{String(expectedValue)}</span>
                  <ArrowRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-900">{String(actualValue)}</span>
                </div>
                {similarity !== null && (
                  <div className="mt-2 text-xs text-red-600">
                    Similarity: {similarity.toFixed(1)}%
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
