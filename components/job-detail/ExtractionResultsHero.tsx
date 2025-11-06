'use client'

import { FieldComparisonCard } from './FieldComparisonCard'
import { AlertCircle } from 'lucide-react'

interface ExtractionResultsHeroProps {
  extractedData: Record<string, any> | null
  groundTruthData?: Record<string, any> | null
  hasGroundTruth?: boolean
}

export function ExtractionResultsHero({
  extractedData,
  groundTruthData,
  hasGroundTruth = false,
}: ExtractionResultsHeroProps) {
  // Get all fields (union of extracted and ground truth)
  const extractedFields = extractedData ? Object.keys(extractedData) : []
  const gtFields = groundTruthData ? Object.keys(groundTruthData) : []
  const allFields = Array.from(new Set([...extractedFields, ...gtFields]))

  // Calculate stats
  const totalFields = hasGroundTruth ? gtFields.length : extractedFields.length
  const extractedCount = extractedFields.filter(
    f => extractedData?.[f] !== null && extractedData?.[f] !== undefined && extractedData?.[f] !== ''
  ).length
  const matchCount = hasGroundTruth
    ? extractedFields.filter(f => {
        const extracted = extractedData?.[f]
        const gt = groundTruthData?.[f]
        return extracted !== null && extracted !== undefined && extracted !== '' &&
               gt !== null && gt !== undefined &&
               String(extracted) === String(gt)
      }).length
    : 0

  const hasData = extractedData && Object.keys(extractedData).length > 0

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Extraction Results</h2>
          <p className="text-sm text-gray-600">
            {hasData ? (
              hasGroundTruth ? (
                <>
                  <span className="font-semibold text-emerald-600">{matchCount} / {totalFields}</span> fields match ground truth
                </>
              ) : (
                <>
                  <span className="font-semibold text-blue-600">{extractedCount}</span> fields extracted
                </>
              )
            ) : (
              'No data was extracted from this page'
            )}
          </p>
        </div>

        {/* Stats Badge */}
        {hasData && (
          <div className={`px-4 py-2 rounded-lg border-2 ${
            hasGroundTruth
              ? matchCount === totalFields
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : matchCount > 0
                ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                : 'bg-red-100 border-red-300 text-red-700'
              : 'bg-blue-100 border-blue-300 text-blue-700'
          }`}>
            <div className="text-3xl font-bold">
              {hasGroundTruth ? (
                `${Math.round((matchCount / totalFields) * 100)}%`
              ) : (
                extractedCount
              )}
            </div>
            <div className="text-xs font-medium uppercase tracking-wide">
              {hasGroundTruth ? 'Accuracy' : 'Fields'}
            </div>
          </div>
        )}
      </div>

      {/* No Data State */}
      {!hasData && (
        <div className="py-12 text-center">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No data extracted</p>
          <p className="text-gray-400 text-sm mt-2">
            The extraction may have failed or the page may not contain the expected data
          </p>
        </div>
      )}

      {/* Field Cards Grid */}
      {hasData && allFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allFields.map((fieldName) => (
            <FieldComparisonCard
              key={fieldName}
              fieldName={fieldName}
              extractedValue={extractedData?.[fieldName]}
              groundTruthValue={groundTruthData?.[fieldName]}
              hasGroundTruth={hasGroundTruth}
            />
          ))}
        </div>
      )}
    </div>
  )
}
