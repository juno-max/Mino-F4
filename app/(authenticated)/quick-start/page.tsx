'use client'

/**
 * Quick Start Page
 * Unified flow from CSV drop to extraction start
 * Implements the streamlined 3-click experience
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UniversalDropZone, CSVAnalysis } from '@/components/quick-start/UniversalDropZone'
import { InstantAnalysis } from '@/components/quick-start/InstantAnalysis'
import { toast } from '@/lib/toast'

export default function QuickStartPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [analysis, setAnalysis] = useState<CSVAnalysis | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  // Load analysis from sessionStorage if redirected after analysis
  useEffect(() => {
    if (searchParams.get('analyzed') === 'true') {
      const storedAnalysis = sessionStorage.getItem('csvAnalysis')
      if (storedAnalysis) {
        setAnalysis(JSON.parse(storedAnalysis))
      }
    }
  }, [searchParams])

  const handleStartTest = async () => {
    if (!analysis) return

    setIsStarting(true)

    try {
      // Get CSV file from sessionStorage
      const csvFileData = sessionStorage.getItem('csvFile')
      if (!csvFileData) {
        throw new Error('CSV file data not found')
      }

      // Convert base64 back to file
      const response = await fetch(csvFileData)
      const blob = await response.blob()
      const file = new File([blob], analysis.filename, { type: 'text/csv' })

      // Create project with smart defaults
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Project ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          workflowInstructions: generateInstructions(analysis),
          autoCreated: true,
        }),
      })

      if (!projectResponse.ok) {
        throw new Error('Failed to create project')
      }

      const project = await projectResponse.json()

      // Create batch with CSV upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', generateBatchName(analysis.filename))
      formData.append('projectId', project.id)
      formData.append('autoDetected', 'true')

      const batchResponse = await fetch('/api/batches', {
        method: 'POST',
        body: formData,
      })

      if (!batchResponse.ok) {
        throw new Error('Failed to create batch')
      }

      const batch = await batchResponse.json()

      // Start test execution (10 sites)
      const executionResponse = await fetch('/api/executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          executionType: 'test',
          sampleSize: 10,
          useAgentQL: true,
        }),
      })

      if (!executionResponse.ok) {
        throw new Error('Failed to start execution')
      }

      const execution = await executionResponse.json()

      // Clear sessionStorage
      sessionStorage.removeItem('csvAnalysis')
      sessionStorage.removeItem('csvFile')

      // Navigate to unified progress view
      toast.success('Test run started!', {
        description: 'Extracting data from 10 sites...'
      })

      router.push(`/projects/${project.id}/batches/${batch.id}`)
    } catch (error: any) {
      console.error('Start test error:', error)
      toast.error('Failed to start test run', {
        description: error.message
      })
      setIsStarting(false)
    }
  }

  const handleStartFull = async () => {
    if (!analysis) return

    const confirmed = confirm(
      `Start full extraction with ${analysis.rowCount} sites?\n\n` +
      `Estimated time: ${analysis.estimatedDuration}\n` +
      `Estimated cost: ${analysis.estimatedCost}\n\n` +
      `We recommend testing on 10 sites first to verify extraction quality.`
    )

    if (!confirmed) return

    setIsStarting(true)

    try {
      // Similar flow but with full execution
      const csvFileData = sessionStorage.getItem('csvFile')
      if (!csvFileData) {
        throw new Error('CSV file data not found')
      }

      const response = await fetch(csvFileData)
      const blob = await response.blob()
      const file = new File([blob], analysis.filename, { type: 'text/csv' })

      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Project ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          workflowInstructions: generateInstructions(analysis),
          autoCreated: true,
        }),
      })

      if (!projectResponse.ok) {
        throw new Error('Failed to create project')
      }

      const project = await projectResponse.json()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', generateBatchName(analysis.filename))
      formData.append('projectId', project.id)
      formData.append('autoDetected', 'true')

      const batchResponse = await fetch('/api/batches', {
        method: 'POST',
        body: formData,
      })

      if (!batchResponse.ok) {
        throw new Error('Failed to create batch')
      }

      const batch = await batchResponse.json()

      // Start full execution
      const executionResponse = await fetch('/api/executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          executionType: 'full',
          useAgentQL: true,
        }),
      })

      if (!executionResponse.ok) {
        throw new Error('Failed to start execution')
      }

      sessionStorage.removeItem('csvAnalysis')
      sessionStorage.removeItem('csvFile')

      toast.success('Full extraction started!', {
        description: `Processing ${analysis.rowCount} sites...`
      })

      router.push(`/projects/${project.id}/batches/${batch.id}`)
    } catch (error: any) {
      console.error('Start full error:', error)
      toast.error('Failed to start full extraction', {
        description: error.message
      })
      setIsStarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {!analysis ? (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Start Data Extraction
              </h1>
              <p className="text-gray-600">
                Drop your CSV file to begin extracting data automatically
              </p>
            </div>

            <UniversalDropZone onFileAnalyzed={setAnalysis} />

            {/* Example/Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                💡 Quick Tip
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Your CSV should include:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>A column with website URLs (named "url", "website", or similar)</li>
                <li>Optional: Columns with expected values for validation (prefix with "gt_" or "expected_")</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <button
                onClick={() => {
                  setAnalysis(null)
                  sessionStorage.removeItem('csvAnalysis')
                  sessionStorage.removeItem('csvFile')
                  router.push('/quick-start')
                }}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                ← Upload Different CSV
              </button>
            </div>

            <InstantAnalysis
              analysis={analysis}
              onStartTest={handleStartTest}
              onStartFull={handleStartFull}
              isLoading={isStarting}
            />
          </div>
        )}
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
