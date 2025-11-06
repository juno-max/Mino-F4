'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, CheckCircle, Play } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card'
import Papa from 'papaparse'

interface ColumnInfo {
  name: string
  type: 'text' | 'number' | 'url'
  isGroundTruth: boolean
  isUrl: boolean
  sampleValues: string[]
}

export default function NewBatchPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  // Project management
  const [projectId, setProjectId] = useState<string>(params.id)
  const [isCheckingProject, setIsCheckingProject] = useState(true)

  // Single step: CSV Upload & Create Batch
  const [step, setStep] = useState<1>(1)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [batchName, setBatchName] = useState('')
  const [batchDescription, setBatchDescription] = useState('')

  // Removed Step 2: Direct batch creation from CSV

  // Execution
  const [isExecuting, setIsExecuting] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Check if project exists, create default if needed
  useEffect(() => {
    const ensureProjectExists = async () => {
      try {
        setIsCheckingProject(true)

        // Try to fetch the current project
        const projectResponse = await fetch(`/api/projects/${params.id}`)

        if (projectResponse.ok) {
          // Project exists, we're good
          setProjectId(params.id)
          setIsCheckingProject(false)
          return
        }

        // Project doesn't exist, check if ANY projects exist
        const allProjectsResponse = await fetch('/api/projects')

        if (!allProjectsResponse.ok) {
          throw new Error('Failed to fetch projects')
        }

        const allProjects = await allProjectsResponse.json()

        if (allProjects.length > 0) {
          // Projects exist, redirect to the first one
          const firstProject = allProjects[0]
          router.replace(`/projects/${firstProject.id}/batches/new`)
          return
        }

        // No projects exist at all - create a default one
        const createResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Default Project',
            description: 'Auto-created default project',
            instructions: 'Extract data from the website based on the CSV columns provided.',
          }),
        })

        if (!createResponse.ok) {
          throw new Error('Failed to create default project')
        }

        const newProject = await createResponse.json()

        // Redirect to the new project's batch creation page
        router.replace(`/projects/${newProject.id}/batches/new`)
      } catch (error: any) {
        console.error('Error ensuring project exists:', error)
        setUploadError('Failed to initialize project: ' + error.message)
        setIsCheckingProject(false)
      }
    }

    ensureProjectExists()
  }, [params.id, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setUploadError('')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          setUploadError('CSV parsing error: ' + results.errors[0].message)
          return
        }

        const data = results.data as Record<string, any>[]
        const headers = results.meta.fields || []

        if (headers.length === 0 || data.length === 0) {
          setUploadError('CSV file is empty or has no headers')
          return
        }

        setCsvData(data)

        // Analyze columns
        const columnInfo: ColumnInfo[] = headers.map(header => {
          const values = data.map(row => row[header]).filter(v => v != null && v !== '')
          const sampleValues = values.slice(0, 5)

          // Detect ground truth
          const gtPatterns = [/^gt_/i, /_gt$/i, /_ground_truth$/i, /_expected$/i, /^expected_/i]
          const isGroundTruth = gtPatterns.some(pattern => pattern.test(header))

          // Detect URL
          const urlPatterns = ['url', 'website', 'site', 'link', 'homepage']
          const isUrl = urlPatterns.some(pattern => header.toLowerCase().includes(pattern))

          // Infer type
          let type: 'text' | 'number' | 'url' = 'text'
          if (isUrl || sampleValues.every(v => /^https?:\/\//i.test(String(v)))) {
            type = 'url'
          } else if (sampleValues.every(v => !isNaN(Number(v)))) {
            type = 'number'
          }

          return {
            name: header,
            type,
            isGroundTruth,
            isUrl,
            sampleValues,
          }
        })

        setColumns(columnInfo)

        // Auto-generate batch name
        if (!batchName) {
          setBatchName(file.name.replace('.csv', ''))
        }

        // CSV loaded successfully
      },
      error: (error) => {
        setUploadError('Failed to parse CSV: ' + error.message)
      },
    })
  }

  // Removed unused functions - direct batch creation and execution

  const handleCreateBatchAndExecute = async () => {
    if (!csvFile || csvData.length === 0) {
      setUploadError('Please upload a valid CSV file')
      return
    }

    const urlColumn = columns.find(col => col.isUrl)
    if (!urlColumn) {
      setUploadError('CSV must contain a URL column (e.g., "url", "website", "site")')
      return
    }

    if (!batchName.trim()) {
      setUploadError('Please enter a batch name')
      return
    }

    setIsExecuting(true)
    setUploadError('')

    try {
      // Create batch
      const fileText = await csvFile.text()

      const batchResponse = await fetch(`/api/projects/${projectId}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: fileText,
          batchName,
          batchDescription,
        }),
      })

      if (!batchResponse.ok) {
        const error = await batchResponse.json()
        throw new Error(error.message || 'Failed to create batch')
      }

      const batch = await batchResponse.json()

      // Start TEST execution immediately (10 sites) for instant feedback
      const executeResponse = await fetch(`/api/projects/${projectId}/batches/${batch.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionType: 'test',
          sampleSize: 10,
          useAgentQL: true,
          concurrency: 5,
        }),
      })

      if (!executeResponse.ok) {
        console.error('Failed to start test execution, but batch was created')
      }

      // Redirect to batch dashboard
      router.push(`/projects/${projectId}/batches/${batch.id}`)
    } catch (error: any) {
      setUploadError(error.message)
      setIsExecuting(false)
    }
  }

  const gtColumns = columns.filter(col => col.isGroundTruth)
  const urlColumns = columns.filter(col => col.isUrl)

  // Show loading state while checking/creating project
  if (isCheckingProject) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(52,211,153)]"></div>
          <p className="mt-4 text-sm text-gray-600">Setting up your project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/projects/${projectId}`} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Create New Batch
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Upload a CSV file with URLs and start job execution
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* STEP 1: CSV UPLOAD */}
        {step === 1 && (
          <>
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>CSV File</CardTitle>
                <CardDescription>
                  Upload a CSV file containing URLs and optional ground truth data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[rgb(52,211,153)] transition-all duration-200">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  {csvFile ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">{csvFile.name}</p>
                      <p className="text-xs text-gray-500">{csvData.length} rows, {columns.length} columns</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Click to upload CSV</p>
                      <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                  {uploadError}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Batch Details */}
          {csvData.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Batch Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                      Batch Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="e.g., Competitor Pricing Q1 2024"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={batchDescription}
                      onChange={(e) => setBatchDescription(e.target.value)}
                      placeholder="Optional description of this batch..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Column Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Column Analysis</CardTitle>
                  <CardDescription>
                    {columns.length} columns detected ({gtColumns.length} ground truth, {urlColumns.length} URL)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {columns.map((col, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">{col.name}</span>
                            {col.isUrl && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                                URL
                              </span>
                            )}
                            {col.isGroundTruth && (
                              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Ground Truth
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full font-medium">
                              {col.type}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            Sample: {col.sampleValues.slice(0, 3).join(', ')}
                            {col.sampleValues.length > 3 && '...'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {gtColumns.length > 0 && (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                      <p className="text-sm text-emerald-800">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        This batch has ground truth data - you can test accuracy!
                      </p>
                    </div>
                  )}

                  {urlColumns.length === 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">
                        ⚠️ No URL column detected. CSV must have a column named "url", "website", or "site".
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>First 5 rows of {csvData.length} total</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          {columns.map((col, idx) => (
                            <th key={idx} className="text-left p-2 font-semibold text-xs text-gray-700 uppercase tracking-wider">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 5).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50">
                            {columns.map((col, colIdx) => (
                              <td key={colIdx} className="p-2 text-gray-900 max-w-xs truncate">
                                {row[col.name] || <span className="text-gray-600">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Create & Execute Button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleCreateBatchAndExecute}
                  disabled={urlColumns.length === 0 || csvData.length === 0 || !batchName.trim() || isExecuting}
                  variant="primary"
                  size="lg"
                  className="flex-1"
                >
                  {isExecuting ? 'Creating & Starting Test Run...' : 'Create Batch & Run 10 Test Sites'}
                  <Play className="h-4 w-4 ml-2" />
                </Button>
                <Link href={`/projects/${projectId}`} className="flex-1">
                  <Button variant="outline" size="lg" className="w-full" disabled={isExecuting}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </>
          )}
          </>
        )}

        {/* Error Display */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            {uploadError}
          </div>
        )}
      </div>
    </div>
  )
}
