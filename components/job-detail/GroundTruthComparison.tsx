'use client'

import { Card } from '@/components/Card'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface GroundTruthComparisonProps {
  extractedData: Record<string, any> | null
  groundTruthData: Record<string, any> | null
  fieldsExtracted: string[] | null
  fieldsMissing: string[] | null
  completionPercentage: number | null
}

function compareValues(extracted: any, groundTruth: any): 'match' | 'mismatch' | 'partial' {
  if (extracted === groundTruth) return 'match'
  if (extracted === null || extracted === undefined) return 'mismatch'

  // Fuzzy string matching
  if (typeof extracted === 'string' && typeof groundTruth === 'string') {
    const normalizedExtracted = extracted.toLowerCase().trim()
    const normalizedGT = groundTruth.toLowerCase().trim()
    if (normalizedExtracted === normalizedGT) return 'match'
    if (normalizedExtracted.includes(normalizedGT) || normalizedGT.includes(normalizedExtracted)) {
      return 'partial'
    }
  }

  return 'mismatch'
}

export function GroundTruthComparison({
  extractedData,
  groundTruthData,
  fieldsExtracted,
  fieldsMissing,
  completionPercentage,
}: GroundTruthComparisonProps) {
  if (!groundTruthData) {
    return null
  }

  const allFields = new Set([
    ...Object.keys(extractedData || {}),
    ...Object.keys(groundTruthData),
  ])

  let matches = 0
  let mismatches = 0
  let partialMatches = 0

  const comparisons = Array.from(allFields).map((field) => {
    const extracted = extractedData?.[field]
    const groundTruth = groundTruthData[field]
    const result = compareValues(extracted, groundTruth)

    if (result === 'match') matches++
    else if (result === 'partial') partialMatches++
    else mismatches++

    return { field, extracted, groundTruth, result }
  })

  const accuracy = allFields.size > 0
    ? Math.round(((matches + partialMatches * 0.5) / allFields.size) * 100)
    : 0

  return (
    <Card padding="none" className="bg-white mt-4">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Ground Truth Comparison
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {accuracy}%
              </div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-lg font-bold">{matches}</span>
            </div>
            <div className="text-xs text-gray-600">Matches</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
              <AlertCircle className="h-4 w-4" />
              <span className="text-lg font-bold">{partialMatches}</span>
            </div>
            <div className="text-xs text-gray-600">Partial</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <XCircle className="h-4 w-4" />
              <span className="text-lg font-bold">{mismatches}</span>
            </div>
            <div className="text-xs text-gray-600">Mismatches</div>
          </div>
        </div>
      </div>

      {/* Field-by-field comparison */}
      <div className="divide-y divide-gray-200">
        {comparisons.map(({ field, extracted, groundTruth, result }) => (
          <div key={field} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {result === 'match' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : result === 'partial' ? (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>

              {/* Field Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {field}
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* Extracted */}
                  <div>
                    <div className="text-gray-500 uppercase tracking-wide mb-1">
                      Extracted
                    </div>
                    <div className={`font-mono p-2 rounded ${
                      result === 'match'
                        ? 'bg-emerald-50 text-emerald-900'
                        : result === 'partial'
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-red-50 text-red-900'
                    }`}>
                      {extracted !== null && extracted !== undefined
                        ? JSON.stringify(extracted)
                        : '—'}
                    </div>
                  </div>

                  {/* Ground Truth */}
                  <div>
                    <div className="text-gray-500 uppercase tracking-wide mb-1">
                      Ground Truth
                    </div>
                    <div className="font-mono bg-gray-100 text-gray-900 p-2 rounded">
                      {JSON.stringify(groundTruth)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
