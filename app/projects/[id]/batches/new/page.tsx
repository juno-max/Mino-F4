'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, CheckCircle } from 'lucide-react'
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

export default function NewBatchPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [batchName, setBatchName] = useState('')
  const [batchDescription, setBatchDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

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
      },
      error: (error) => {
        setUploadError('Failed to parse CSV: ' + error.message)
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!csvFile || csvData.length === 0) {
      setUploadError('Please upload a valid CSV file')
      return
    }

    const urlColumn = columns.find(col => col.isUrl)
    if (!urlColumn) {
      setUploadError('CSV must contain a URL column (e.g., "url", "website", "site")')
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      // Read file as text
      const fileText = await csvFile.text()

      const response = await fetch(`/api/projects/${params.id}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: fileText,
          batchName,
          batchDescription,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create batch')
      }

      const batch = await response.json()
      router.push(`/projects/${params.id}/batches/${batch.id}`)
    } catch (error: any) {
      setUploadError(error.message)
      setIsUploading(false)
    }
  }

  const gtColumns = columns.filter(col => col.isGroundTruth)
  const urlColumns = columns.filter(col => col.isUrl)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/projects/${params.id}`} className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
          <h1 className="text-2xl font-bold text-stone-900">Upload CSV Batch</h1>
          <p className="text-sm text-stone-600 mt-1">
            Upload a CSV file with URLs to test your workflow
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file containing URLs and optional ground truth data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center hover:border-amber-500 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-stone-400 mx-auto mb-4" />
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
                      <div key={idx} className="flex items-start justify-between p-3 bg-stone-50 rounded-md">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-stone-900">{col.name}</span>
                            {col.isUrl && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                URL
                              </span>
                            )}
                            {col.isGroundTruth && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Ground Truth
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-700 rounded">
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
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-200">
                          {columns.map((col, idx) => (
                            <th key={idx} className="text-left p-2 font-medium text-stone-900">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 5).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-stone-100">
                            {columns.map((col, colIdx) => (
                              <td key={colIdx} className="p-2 text-stone-700 max-w-xs truncate">
                                {row[col.name] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isUploading || urlColumns.length === 0}
                  className="flex-1"
                >
                  {isUploading ? 'Creating Batch...' : 'Create Batch'}
                </Button>
                <Link href={`/projects/${params.id}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
