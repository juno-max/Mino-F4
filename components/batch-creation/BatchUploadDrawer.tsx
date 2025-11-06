'use client'

/**
 * Batch Upload Drawer - Universal entry point for batch creation
 *
 * This component provides a unified, multi-step flow for creating batches:
 * 1. CSV Upload & Analysis
 * 2. Project Selection (with context awareness)
 * 3. Workflow Configuration (inherited or custom)
 * 4. Final Review & Start
 *
 * Design Principles:
 * - Progressive disclosure (show complexity as needed)
 * - Smart defaults (minimize user decisions)
 * - Context awareness (pre-select based on entry point)
 */

import { useState, useCallback, useRef } from 'react'
import { X, Upload, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CSVAnalysis } from '@/components/quick-start/UniversalDropZone'
import { toast } from '@/lib/toast'
import { ProjectSelector } from './ProjectSelector'
import { WorkflowConfigPanel } from './WorkflowConfigPanel'
import { BatchConfirmation } from './BatchConfirmation'

// ============================================================================
// Types
// ============================================================================

interface BatchUploadDrawerProps {
  isOpen: boolean
  onClose: () => void
  // Context: If opened from a specific project, pre-select it
  projectId?: string
  projectName?: string
}

type Step = 'upload' | 'project' | 'workflow' | 'confirm'

interface Project {
  id: string
  name: string
  instructions?: string
  lastUsed?: Date
  batchCount?: number
  successRate?: number
}

// ============================================================================
// Main Component
// ============================================================================

export function BatchUploadDrawer({
  isOpen,
  onClose,
  projectId: initialProjectId,
  projectName: initialProjectName,
}: BatchUploadDrawerProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvAnalysis, setCsvAnalysis] = useState<CSVAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId || null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [workflowOption, setWorkflowOption] = useState<'use-project' | 'customize' | 'create-new'>('use-project')
  const [customWorkflow, setCustomWorkflow] = useState<string>('')
  const [batchName, setBatchName] = useState<string>('')
  const [batchDescription, setBatchDescription] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false)

  // ============================================================================
  // CSV Upload Handlers
  // ============================================================================

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
      setCsvAnalysis(analysis)
      setCsvFile(file)

      // Auto-generate batch name from filename
      const name = file.name.replace('.csv', '')
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
      setBatchName(`${name}_${timestamp}`)

      return analysis
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to analyze CSV', { description: err.message })
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const analysis = await analyzeCSV(file)
    if (analysis) {
      setCurrentStep('project')
    }
  }, [analyzeCSV])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find(f => f.name.endsWith('.csv'))

    if (!csvFile) {
      setError('Please drop a CSV file')
      toast.error('Invalid file', { description: 'Please drop a CSV file' })
      return
    }

    const analysis = await analyzeCSV(csvFile)
    if (analysis) {
      setCurrentStep('project')
    }
  }, [analyzeCSV])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // ============================================================================
  // Navigation Handlers
  // ============================================================================

  const handleNext = useCallback(() => {
    if (currentStep === 'upload' && csvAnalysis) {
      setCurrentStep('project')
    } else if (currentStep === 'project' && selectedProjectId) {
      setCurrentStep('workflow')
    } else if (currentStep === 'workflow') {
      setCurrentStep('confirm')
    }
  }, [currentStep, csvAnalysis, selectedProjectId])

  const handleBack = useCallback(() => {
    if (currentStep === 'project') {
      setCurrentStep('upload')
    } else if (currentStep === 'workflow') {
      setCurrentStep('project')
    } else if (currentStep === 'confirm') {
      setCurrentStep('workflow')
    }
  }, [currentStep])

  const handleClose = useCallback(() => {
    // Reset all state
    setCurrentStep('upload')
    setCsvFile(null)
    setCsvAnalysis(null)
    setSelectedProjectId(initialProjectId || null)
    setWorkflowOption('use-project')
    setError(null)
    onClose()
  }, [initialProjectId, onClose])

  // ============================================================================
  // Batch Creation
  // ============================================================================

  const handleCreateBatch = useCallback(async (testRun: boolean) => {
    if (!csvFile || !csvAnalysis || !selectedProjectId) return

    setIsCreating(true)

    try {
      // Create batch
      const formData = new FormData()
      formData.append('file', csvFile)
      formData.append('name', batchName)
      formData.append('projectId', selectedProjectId)
      if (batchDescription) {
        formData.append('description', batchDescription)
      }

      const batchResponse = await fetch('/api/batches', {
        method: 'POST',
        body: formData,
      })

      if (!batchResponse.ok) {
        throw new Error('Failed to create batch')
      }

      const batch = await batchResponse.json()

      // Start execution
      const executionResponse = await fetch('/api/executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          executionType: testRun ? 'test' : 'full',
          sampleSize: testRun ? 10 : undefined,
          useAgentQL: true,
        }),
      })

      if (!executionResponse.ok) {
        throw new Error('Failed to start execution')
      }

      toast.success(testRun ? 'Test run started!' : 'Full extraction started!', {
        description: `Processing ${testRun ? '10' : csvAnalysis.rowCount} sites...`
      })

      // Navigate to batch dashboard
      router.push(`/projects/${selectedProjectId}/batches/${batch.id}`)

      // Close drawer
      handleClose()
    } catch (error: any) {
      console.error('Create batch error:', error)
      toast.error('Failed to start extraction', {
        description: error.message
      })
    } finally {
      setIsCreating(false)
    }
  }, [csvFile, csvAnalysis, selectedProjectId, batchName, batchDescription, router, handleClose])

  // ============================================================================
  // Render
  // ============================================================================

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Extraction</h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentStep === 'upload' ? '1' : currentStep === 'project' ? '2' : currentStep === 'workflow' ? '3' : '4'} of 4
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: currentStep === 'upload' ? '25%' :
                     currentStep === 'project' ? '50%' :
                     currentStep === 'workflow' ? '75%' : '100%'
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 'upload' && (
            <UploadStep
              isDragging={isDragging}
              isAnalyzing={isAnalyzing}
              csvAnalysis={csvAnalysis}
              error={error}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
            />
          )}

          {currentStep === 'project' && csvAnalysis && (
            <ProjectSelector
              csvAnalysis={csvAnalysis}
              selectedProjectId={selectedProjectId}
              onProjectSelect={setSelectedProjectId}
              initialProjectId={initialProjectId}
              initialProjectName={initialProjectName}
            />
          )}

          {currentStep === 'workflow' && selectedProjectId && (
            <WorkflowConfigPanel
              projectId={selectedProjectId}
              workflowOption={workflowOption}
              customWorkflow={customWorkflow}
              onWorkflowOptionChange={setWorkflowOption}
              onCustomWorkflowChange={setCustomWorkflow}
            />
          )}

          {currentStep === 'confirm' && csvAnalysis && (
            <BatchConfirmation
              csvAnalysis={csvAnalysis}
              batchName={batchName}
              batchDescription={batchDescription}
              onBatchNameChange={setBatchName}
              onBatchDescriptionChange={setBatchDescription}
              onStartTest={() => handleCreateBatch(true)}
              onStartFull={() => handleCreateBatch(false)}
              isCreating={isCreating}
            />
          )}
        </div>

        {/* Footer */}
        {currentStep !== 'confirm' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleBack}
              disabled={currentStep === 'upload'}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={
                (currentStep === 'upload' && !csvAnalysis) ||
                (currentStep === 'project' && !selectedProjectId)
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  )
}

// ============================================================================
// Step Components
// ============================================================================

interface UploadStepProps {
  isDragging: boolean
  isAnalyzing: boolean
  csvAnalysis: CSVAnalysis | null
  error: string | null
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

function UploadStep({
  isDragging,
  isAnalyzing,
  csvAnalysis,
  error,
  onDrop,
  onDragOver,
  onDragLeave,
  fileInputRef,
}: UploadStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload CSV File</h3>
        <p className="text-sm text-gray-600">
          Drop your CSV file here or click to browse. We'll analyze it and guide you through the setup.
        </p>
      </div>

      {!csvAnalysis ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-blue-500 bg-blue-50 scale-105'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
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
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
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
                  Drop CSV file here or click to browse
                </p>
                <p className="text-sm text-gray-600">
                  Maximum file size: 50MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-8 w-8 text-emerald-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-emerald-900 mb-2">
                CSV Analyzed Successfully
              </h4>
              <div className="space-y-2 text-emerald-800">
                <p className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span className="font-medium">{csvAnalysis.filename}</span>
                  <span className="text-sm">({csvAnalysis.rowCount} websites)</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  URL column: <span className="font-medium">{csvAnalysis.urlColumn}</span>
                </p>
                {csvAnalysis.groundTruthColumns.length > 0 && (
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Ground truth fields: <span className="font-medium">{csvAnalysis.groundTruthColumns.join(', ')}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          💡 Quick Tip
        </h4>
        <p className="text-sm text-blue-800 mb-3">
          Your CSV should include:
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>A column with website URLs (named "url", "website", or similar)</li>
          <li>Optional: Expected values for validation (prefix with "gt_" or "expected_")</li>
        </ul>
      </div>
    </div>
  )
}

