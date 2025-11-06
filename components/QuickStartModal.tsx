'use client'

/**
 * Quick Start Modal
 * Inline modal for instant CSV → Extraction in 2 clicks
 * Shows smart defaults, hides complexity
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface CSVAnalysis {
  filename: string
  rowCount: number
  urlColumn: string
  groundTruthColumns: string[]
  estimatedCost: string
  estimatedDuration: string
  columns: string[]
}

interface QuickStartModalProps {
  file: File
  isOpen: boolean
  onClose: () => void
}

export function QuickStartModal({ file, isOpen, onClose }: QuickStartModalProps) {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analysis, setAnalysis] = useState<CSVAnalysis | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Advanced options state
  const [batchName, setBatchName] = useState('')
  const [projectId, setProjectId] = useState<string>('uncategorized')
  const [customInstructions, setCustomInstructions] = useState('')
  const [testSize, setTestSize] = useState<number>(10)

  // Analyze CSV on mount
  useEffect(() => {
    analyzeCSV()
  }, [file])

  const analyzeCSV = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/csv/quick-analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze CSV')
      }

      const data: CSVAnalysis = await response.json()
      setAnalysis(data)

      // Set smart defaults
      const autoName = generateBatchName(data.filename)
      setBatchName(autoName)

      const autoInstructions = generateWorkflowInstructions(data.columns, data.groundTruthColumns)
      setCustomInstructions(autoInstructions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze CSV')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateBatchName = (filename: string): string => {
    const baseName = filename.replace('.csv', '')
    const date = new Date()
    const month = date.toLocaleString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${baseName}_${month}${day}`
  }

  const generateWorkflowInstructions = (columns: string[], gtColumns: string[]): string => {
    // Filter out URL and GT columns
    const dataColumns = columns.filter(col =>
      !col.toLowerCase().includes('url') &&
      !gtColumns.includes(col)
    )

    if (dataColumns.length === 0) {
      return 'Extract relevant information from each website'
    }

    const columnList = dataColumns.slice(0, 5).join(', ')
    const more = dataColumns.length > 5 ? ` and ${dataColumns.length - 5} more fields` : ''

    return `Extract ${columnList}${more} from each website`
  }

  const handleStartExtraction = async () => {
    if (!analysis) return

    setIsCreating(true)
    setError(null)

    try {
      // Create batch with smart defaults
      const formData = new FormData()
      formData.append('file', file)
      formData.append('batchName', batchName)
      formData.append('projectId', projectId)
      formData.append('instructions', customInstructions)
      formData.append('mode', testSize === analysis.rowCount ? 'full' : 'test')
      formData.append('testSize', testSize.toString())

      const response = await fetch('/api/batches/quick-create', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to create batch')
      }

      const batch = await response.json()

      // Navigate to batch dashboard
      router.push(`/projects/${batch.projectId}/batches/${batch.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start extraction')
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quick Start Extraction</h2>
              <p className="text-xs text-gray-500">Get results in minutes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Analyzing your CSV...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : analysis ? (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{analysis.filename}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Websites</p>
                        <p className="font-bold text-gray-900 text-lg">{analysis.rowCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Estimated Cost</p>
                        <p className="font-bold text-gray-900 text-lg">{analysis.estimatedCost}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Time</p>
                        <p className="font-bold text-gray-900 text-lg">{analysis.estimatedDuration}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* What we'll extract */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Extracting:</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.columns
                      .filter(col => !col.toLowerCase().includes('url'))
                      .slice(0, 6)
                      .map(col => (
                        <span
                          key={col}
                          className="px-3 py-1 bg-white text-gray-700 text-xs font-medium rounded-full border border-gray-200"
                        >
                          {col}
                        </span>
                      ))}
                    {analysis.columns.length > 7 && (
                      <span className="px-3 py-1 bg-white text-gray-600 text-xs rounded-full border border-gray-200">
                        +{analysis.columns.length - 7} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary Action */}
              <div>
                <button
                  onClick={handleStartExtraction}
                  disabled={isCreating}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl hover:from-blue-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      ▶ Start Extraction
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  We'll run a test on {testSize} websites first to verify quality
                </p>
              </div>

              {/* Advanced Options (Collapsed) */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Advanced Options
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 bg-gray-50 rounded-lg p-4">
                    {/* Batch Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Batch Name
                      </label>
                      <input
                        type="text"
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Project Assignment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add to Project
                      </label>
                      <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="uncategorized">Uncategorized (organize later)</option>
                        {/* TODO: Load actual projects */}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        You can change this later
                      </p>
                    </div>

                    {/* Custom Instructions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Workflow Instructions
                      </label>
                      <textarea
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-generated from your CSV columns
                      </p>
                    </div>

                    {/* Test Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Size
                      </label>
                      <div className="flex gap-2">
                        {[10, 25, 50].map(size => (
                          <button
                            key={size}
                            onClick={() => setTestSize(size)}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              testSize === size
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {size} sites
                          </button>
                        ))}
                        <button
                          onClick={() => setTestSize(analysis.rowCount)}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            testSize === analysis.rowCount
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          All ({analysis.rowCount})
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
