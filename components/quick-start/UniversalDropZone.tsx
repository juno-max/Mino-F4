'use client'

/**
 * Universal CSV Drop Zone
 * Accepts CSV drops anywhere in the app
 * Provides instant feedback and analysis
 */

import { useCallback, useState } from 'react'
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UniversalDropZoneProps {
  onFileAnalyzed?: (analysis: CSVAnalysis) => void
  className?: string
}

export interface CSVAnalysis {
  filename: string
  rowCount: number
  columns: Array<{
    name: string
    type: 'text' | 'number' | 'url' | 'email' | 'phone'
    isUrl: boolean
    isGroundTruth: boolean
    sampleValues: string[]
  }>
  urlColumn: string | null
  groundTruthColumns: string[]
  estimatedDuration: string
  estimatedCost: string
}

export function UniversalDropZone({ onFileAnalyzed, className = '' }: UniversalDropZoneProps) {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeCSV = useCallback(async (file: File): Promise<CSVAnalysis | null> => {
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
        const error = await response.json()
        throw new Error(error.error || 'Failed to analyze CSV')
      }

      const analysis: CSVAnalysis = await response.json()
      onFileAnalyzed?.(analysis)
      return analysis
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [onFileAnalyzed])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find(f => f.name.endsWith('.csv'))

    if (!csvFile) {
      setError('Please drop a CSV file')
      return
    }

    const analysis = await analyzeCSV(csvFile)
    if (analysis) {
      // Store analysis in sessionStorage for next page
      sessionStorage.setItem('csvAnalysis', JSON.stringify(analysis))
      sessionStorage.setItem('csvFile', await fileToBase64(csvFile))

      // Navigate to batch creation with analysis
      router.push('/quick-start?analyzed=true')
    }
  }, [analyzeCSV, router])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const analysis = await analyzeCSV(file)
    if (analysis) {
      sessionStorage.setItem('csvAnalysis', JSON.stringify(analysis))
      sessionStorage.setItem('csvFile', await fileToBase64(file))
      router.push('/quick-start?analyzed=true')
    }
  }, [analyzeCSV, router])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  return (
    <div
      className={`relative ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
          ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {isAnalyzing ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
            <p className="text-gray-700 font-medium">Analyzing your CSV...</p>
            <p className="text-sm text-gray-500">This should only take a moment</p>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <p className="text-red-700 font-medium">Error: {error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-1">
                Drop CSV file here to start extracting data
              </p>
              <p className="text-sm text-gray-600">
                or click to browse
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              Browse Files
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Example: customers.csv with website URLs
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}
