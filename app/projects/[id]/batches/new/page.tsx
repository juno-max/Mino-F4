'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, CheckCircle, Sparkles, Eye, EyeOff, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Papa from 'papaparse'

interface ColumnInfo {
  name: string
  type: 'text' | 'number' | 'url'
  isGroundTruth: boolean
  isUrl: boolean
  sampleValues: string[]
}

interface ParsedIntent {
  goal: string
  inputSchema: {
    name: string
    type: string
    description: string
    required: boolean
  }[]
  outputSchema: {
    name: string
    type: string
    description: string
  }[]
  exampleOutput: Record<string, any>
}

export default function NewBatchPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  // Project management
  const [projectId, setProjectId] = useState<string>(params.id)
  const [isCheckingProject, setIsCheckingProject] = useState(true)

  // Step 1: CSV Upload
  const [step, setStep] = useState<1 | 2>(1)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [batchName, setBatchName] = useState('')
  const [batchDescription, setBatchDescription] = useState('')

  // Step 2: AI Intent Parsing
  const [naturalLanguage, setNaturalLanguage] = useState('')
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [selectedInputs, setSelectedInputs] = useState<Set<string>>(new Set())

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

        // Auto-select all non-ground-truth columns as inputs
        const nonGtColumns = columnInfo.filter(c => !c.isGroundTruth).map(c => c.name)
        setSelectedInputs(new Set(nonGtColumns))
      },
      error: (error) => {
        setUploadError('Failed to parse CSV: ' + error.message)
      },
    })
  }

  const handleParseIntent = async () => {
    if (!naturalLanguage.trim()) {
      setUploadError('Please enter instructions in natural language')
      return
    }

    setIsParsing(true)
    setUploadError('')

    try {
      const response = await fetch('/api/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse',
          naturalLanguage,
          csvHeaders: columns.map(c => c.name),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to parse intent')
      }

      const parsed: ParsedIntent = await response.json()
      setParsedIntent(parsed)
    } catch (error: any) {
      setUploadError(error.message)
    } finally {
      setIsParsing(false)
    }
  }

  const handleSaveBatch = async () => {
    if (!csvFile || csvData.length === 0 || !parsedIntent) {
      setUploadError('Missing required data')
      return
    }

    setIsExecuting(true)
    setUploadError('')

    try {
      // Create batch (without execution)
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

      // Redirect to homepage dashboard to see the new jobs
      router.push(`/?project=${projectId}`)
    } catch (error: any) {
      setUploadError(error.message)
      setIsExecuting(false)
    }
  }

  const handleContinueToStep2 = () => {
    if (!csvFile || csvData.length === 0) {
      setUploadError('Please upload a valid CSV file')
      return
    }

    const urlColumn = columns.find(col => col.isUrl)
    if (!urlColumn) {
      setUploadError('CSV must contain a URL column (e.g., "url", "website", "site")')
      return
    }

    setStep(2)
    setUploadError('')
  }

  const toggleInputColumn = (columnName: string) => {
    const newSelected = new Set(selectedInputs)
    if (newSelected.has(columnName)) {
      newSelected.delete(columnName)
    } else {
      newSelected.add(columnName)
    }
    setSelectedInputs(newSelected)
  }

  const gtColumns = columns.filter(col => col.isGroundTruth)
  const urlColumns = columns.filter(col => col.isUrl)

  const inputColumns = Array.from(selectedInputs).map(name => columns.find(c => c.name === name)!).filter(Boolean)
  const sampleSize = Math.min(20, csvData.length)

  // Show loading state while checking/creating project
  if (isCheckingProject) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          <p className="mt-4 text-sm text-stone-600">Setting up your project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/projects/${projectId}`} className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">
                {step === 1 ? 'Step 1: Upload CSV' : 'Step 2: Configure & Execute'}
              </h1>
              <p className="text-sm text-stone-600 mt-1">
                {step === 1 ? 'Upload a CSV file with URLs to test' : 'Define what to extract and run tests'}
              </p>
            </div>
            <div className="flex gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${step === 1 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                Step {step} of 2
              </div>
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
              <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center hover:border-amber-400 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-stone-600 mx-auto mb-4" />
                  {csvFile ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-stone-900">{csvFile.name}</p>
                      <p className="text-xs text-stone-500">{csvData.length} rows, {columns.length} columns</p>
                      <Button type="button" variant="outline" size="sm" className="mt-2">
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-stone-900">Click to upload CSV</p>
                      <p className="text-xs text-stone-500 mt-1">or drag and drop</p>
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
                    <Label htmlFor="name">Batch Name *</Label>
                    <Input
                      id="name"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="e.g., Competitor Pricing Q1 2024"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={batchDescription}
                      onChange={(e) => setBatchDescription(e.target.value)}
                      placeholder="Optional description of this batch..."
                      rows={3}
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
                      <div key={idx} className="flex items-start justify-between p-3 bg-stone-50 rounded-md border border-stone-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-stone-900">{col.name}</span>
                            {col.isUrl && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-amber-800 rounded-full font-medium">
                                URL
                              </span>
                            )}
                            {col.isGroundTruth && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Ground Truth
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-700 rounded-full font-medium">
                              {col.type}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-stone-600">
                            Sample: {col.sampleValues.slice(0, 3).join(', ')}
                            {col.sampleValues.length > 3 && '...'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {gtColumns.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
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
                        <tr className="border-b border-stone-200 bg-stone-50">
                          {columns.map((col, idx) => (
                            <th key={idx} className="text-left p-2 font-semibold text-xs text-stone-500 uppercase tracking-wider">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 5).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-stone-100 hover:bg-stone-50">
                            {columns.map((col, colIdx) => (
                              <td key={colIdx} className="p-2 text-stone-900 max-w-xs truncate">
                                {row[col.name] || <span className="text-stone-600">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Continue Button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleContinueToStep2}
                  disabled={urlColumns.length === 0 || csvData.length === 0}
                  className="flex-1"
                >
                  Continue to Step 2
                </Button>
                <Link href={`/projects/${projectId}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </>
          )}
          </>
        )}

        {/* STEP 2: AI INTENT PARSING & EXECUTION */}
        {step === 2 && (
          <>
            {/* Natural Language Input */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <CardTitle>Describe What to Extract</CardTitle>
                </div>
                <CardDescription>
                  Tell us in natural language what data you want to extract from each website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={naturalLanguage}
                  onChange={(e) => setNaturalLanguage(e.target.value)}
                  placeholder="Example: Extract the price and rating for each service from the website"
                  rows={3}
                  className="text-base"
                />
                <Button onClick={handleParseIntent} disabled={isParsing || !naturalLanguage.trim()}>
                  {isParsing ? 'Parsing...' : 'Parse with AI'}
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Parsed Intent Display */}
            {parsedIntent && (
              <>
                {/* Input Schema with Toggles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Input Columns</CardTitle>
                    <CardDescription>
                      Select which columns to use as inputs (toggle on/off)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {columns.filter(c => !c.isGroundTruth).map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between p-3 bg-stone-50 rounded-md border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors"
                          onClick={() => toggleInputColumn(col.name)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selectedInputs.has(col.name)
                                ? 'bg-amber-600 border-amber-600'
                                : 'border-stone-300'
                            }`}>
                              {selectedInputs.has(col.name) && (
                                <Eye className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="font-medium text-stone-900">{col.name}</span>
                            {col.isUrl && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-amber-800 rounded-full font-medium">
                                URL
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-stone-600">{col.type}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Output Schema */}
                <Card>
                  <CardHeader>
                    <CardTitle>Output Schema (What to Extract)</CardTitle>
                    <CardDescription>
                      AI-generated schema based on your instructions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {parsedIntent.outputSchema.map((field, idx) => (
                        <div key={idx} className="flex items-start justify-between p-3 bg-green-50 rounded-md border border-green-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-stone-900">{field.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full font-medium">
                                {field.type}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 mt-1">{field.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Example Output */}
                    <div className="mt-4 p-3 bg-stone-900 rounded-md">
                      <p className="text-xs text-stone-400 mb-2">Example JSON Output:</p>
                      <pre className="text-xs text-green-400 font-mono">
                        {JSON.stringify(parsedIntent.exampleOutput, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Data Preview</CardTitle>
                    <CardDescription>
                      Input columns (blue) → Output columns (green) for first 10 rows
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b-2 border-stone-200">
                            {inputColumns.map((col, idx) => (
                              <th key={idx} className="text-left p-3 bg-blue-50 font-semibold text-xs text-blue-900 uppercase tracking-wider">
                                {col.name}
                                <span className="block text-[10px] text-blue-600 font-normal mt-0.5">input</span>
                              </th>
                            ))}
                            {parsedIntent.outputSchema.map((field, idx) => (
                              <th key={idx} className="text-left p-3 bg-green-50 font-semibold text-xs text-green-900 uppercase tracking-wider">
                                {field.name}
                                <span className="block text-[10px] text-green-600 font-normal mt-0.5">to extract</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 10).map((row, rowIdx) => (
                            <tr key={rowIdx} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                              {inputColumns.map((col, colIdx) => (
                                <td key={colIdx} className="p-3 text-stone-900 max-w-xs truncate">
                                  {row[col.name] || <span className="text-stone-600">—</span>}
                                </td>
                              ))}
                              {parsedIntent.outputSchema.map((field, colIdx) => (
                                <td key={colIdx} className="p-3 text-stone-400 italic">
                                  (will extract)
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvData.length > 10 && (
                      <p className="text-sm text-stone-500 mt-4 text-center">
                        Showing 10 of {csvData.length} rows
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Project Instructions */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <CardTitle>Project Instructions</CardTitle>
                    </div>
                    <CardDescription>
                      How EVA agents will extract data from each website
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">
                        {parsedIntent.goal}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Batch Button */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <CardTitle>Ready to Create Batch</CardTitle>
                    </div>
                    <CardDescription>
                      Save this batch and go to dashboard to run tests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Info */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-900">
                              Batch will create {csvData.length} jobs
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              After saving, you'll see all jobs in the dashboard where you can run them with EVA agents
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSaveBatch}
                          disabled={isExecuting}
                          className="flex-1"
                        >
                          {isExecuting ? 'Saving...' : 'Save Batch & Go to Dashboard'}
                          <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                        </Button>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setStep(1)}
                          variant="outline"
                          disabled={isExecuting}
                          className="flex-1"
                        >
                          Back to Step 1
                        </Button>
                        <Link href={`/projects/${projectId}`} className="flex-1">
                          <Button type="button" variant="outline" className="w-full" disabled={isExecuting}>
                            Cancel
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
