'use client'

/**
 * Instant Analysis Display
 * Shows CSV analysis results with smart defaults
 */

import { CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { CSVAnalysis } from './UniversalDropZone'

interface InstantAnalysisProps {
  analysis: CSVAnalysis
  onStartTest: () => void
  onStartFull: () => void
  isLoading?: boolean
}

export function InstantAnalysis({
  analysis,
  onStartTest,
  onStartFull,
  isLoading = false
}: InstantAnalysisProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="h-8 w-8 text-emerald-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">
              Ready to Extract
            </h2>
            <div className="space-y-2 text-emerald-800">
              <p className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{analysis.rowCount} websites</span> detected in "{analysis.urlColumn}" column
              </p>
              {analysis.groundTruthColumns.length > 0 && (
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{analysis.groundTruthColumns.length} ground truth fields</span>
                  {' '}({analysis.groundTruthColumns.join(', ')})
                </p>
              )}
              <p className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Test on <span className="font-medium">10 sites first</span> (recommended)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What's Next?
            </h3>
            <p className="text-gray-600 text-sm">
              We recommend testing on 10 sites first to verify extraction quality before running the full batch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onStartTest}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Starting...
                </>
              ) : (
                `Start Test Run (10 sites)`
              )}
            </button>

            <button
              onClick={onStartFull}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Run All {analysis.rowCount} Sites
            </button>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 pt-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>⏱️ {analysis.estimatedDuration}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💰 ~{analysis.estimatedCost}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Setup (Collapsible) */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">Advanced Setup</span>
            <span className="text-sm text-gray-500">(optional)</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-200 pt-6">
            {/* Batch Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Name
              </label>
              <input
                type="text"
                defaultValue={generateBatchName(analysis.filename)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from filename and date
              </p>
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="new">Create New Project</option>
                <option value="default">Default Project</option>
              </select>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extraction Instructions
              </label>
              <textarea
                rows={3}
                defaultValue={generateInstructions(analysis)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional: Add specific instructions for data extraction..."
              />
              <p className="text-xs text-gray-500 mt-1">
                AI-generated from detected columns (you can edit)
              </p>
            </div>

            {/* Column Mapping */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Column Mapping
                </label>
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  Remap Columns
                </button>
              </div>
              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                {analysis.columns.map((col) => (
                  <div key={col.name} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-gray-700">{col.name}</span>
                    <div className="flex items-center gap-2">
                      {col.isUrl && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Target URL
                        </span>
                      )}
                      {col.isGroundTruth && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                          Ground Truth
                        </span>
                      )}
                      {!col.isUrl && !col.isGroundTruth && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {col.type}
                        </span>
                      )}
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sample Data Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Sample Data (first 3 rows)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {analysis.columns.slice(0, 5).map((col) => (
                  <th key={col.name} className="text-left py-2 px-3 font-medium text-gray-700">
                    {col.name}
                  </th>
                ))}
                {analysis.columns.length > 5 && (
                  <th className="text-left py-2 px-3 text-gray-400">
                    +{analysis.columns.length - 5} more
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2].map((rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-100">
                  {analysis.columns.slice(0, 5).map((col) => (
                    <td key={col.name} className="py-2 px-3 text-gray-600">
                      {col.sampleValues[rowIndex] || '—'}
                    </td>
                  ))}
                  {analysis.columns.length > 5 && (
                    <td className="py-2 px-3 text-gray-400">...</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function generateBatchName(filename: string): string {
  const name = filename.replace('.csv', '')
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '').slice(0, 6)
  return `${name}_${date}_${time}`
}

function generateInstructions(analysis: CSVAnalysis): string {
  const fields = analysis.groundTruthColumns.join(', ')
  if (fields) {
    return `Extract ${fields} from each website`
  }
  return 'Extract contact information and relevant data from each website'
}
