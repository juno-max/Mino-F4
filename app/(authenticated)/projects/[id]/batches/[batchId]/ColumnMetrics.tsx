'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card'
import { BarChart3, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'

interface ColumnMetric {
  columnName: string
  totalJobs: number
  jobsWithGroundTruth: number
  exactMatches: number
  partialMatches: number
  mismatches: number
  missingExtractions: number
  accuracyPercentage: number | null
  errorExamples: Array<{ expected: any; actual: any }>
}

interface ColumnMetricsData {
  batchId: string
  columns: ColumnMetric[]
  overallAccuracy: number | null
}

interface ColumnMetricsProps {
  batchId: string
}

export function ColumnMetrics({ batchId }: ColumnMetricsProps) {
  const [metrics, setMetrics] = useState<ColumnMetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [batchId])

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/batches/${batchId}/ground-truth/column-metrics`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      const data = await response.json()
      setMetrics(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-48">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-stone-600">Calculating column metrics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading metrics: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics || metrics.columns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Column-Level Accuracy</CardTitle>
          <CardDescription>No ground truth data available for analysis</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Column-Level Accuracy</CardTitle>
            <CardDescription>
              Performance breakdown across {metrics.columns.length} ground truth columns
            </CardDescription>
          </div>
          {metrics.overallAccuracy !== null && (
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-700">
                {metrics.overallAccuracy.toFixed(1)}%
              </div>
              <div className="text-xs text-stone-500">Overall Accuracy</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.columns.map((column) => {
            const accuracyColor =
              column.accuracyPercentage === null ? 'bg-stone-300' :
              column.accuracyPercentage >= 90 ? 'bg-green-500' :
              column.accuracyPercentage >= 70 ? 'bg-amber-500' :
              'bg-red-500'

            const accuracyWidth = column.accuracyPercentage || 0

            return (
              <div key={column.columnName} className="space-y-2">
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-stone-900">{column.columnName}</div>
                    <div className="text-xs text-stone-500">
                      {column.jobsWithGroundTruth} of {column.totalJobs} jobs have ground truth
                    </div>
                  </div>
                  <div className="text-right">
                    {column.accuracyPercentage !== null ? (
                      <div className="text-xl font-semibold text-stone-900">
                        {column.accuracyPercentage.toFixed(1)}%
                      </div>
                    ) : (
                      <div className="text-sm text-stone-400">N/A</div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-stone-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${accuracyColor}`}
                    style={{ width: `${accuracyWidth}%` }}
                  />
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-green-50 p-2 rounded border border-green-200">
                    <div className="font-semibold text-green-900">{column.exactMatches}</div>
                    <div className="text-green-600">Exact</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <div className="font-semibold text-blue-900">{column.partialMatches}</div>
                    <div className="text-blue-600">Partial</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded border border-red-200">
                    <div className="font-semibold text-red-900">{column.mismatches}</div>
                    <div className="text-red-600">Mismatch</div>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-200">
                    <div className="font-semibold text-stone-900">{column.missingExtractions}</div>
                    <div className="text-stone-600">Missing</div>
                  </div>
                </div>

                {/* Error Examples */}
                {column.errorExamples.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-600 hover:text-red-700 font-medium">
                      View {column.errorExamples.length} error examples
                    </summary>
                    <div className="mt-2 space-y-2">
                      {column.errorExamples.map((example, idx) => (
                        <div key={idx} className="bg-red-50 p-2 rounded border border-red-200">
                          <div className="flex justify-between gap-4">
                            <div className="flex-1">
                              <div className="text-red-600 font-medium">Expected:</div>
                              <div className="font-mono text-stone-900">
                                {example.expected !== null ? String(example.expected) : 'null'}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-red-600 font-medium">Actual:</div>
                              <div className="font-mono text-stone-900">
                                {example.actual !== null ? String(example.actual) : 'null'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-stone-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-stone-900">
                {metrics.columns.reduce((sum, col) => sum + col.exactMatches, 0)}
              </div>
              <div className="text-xs text-stone-600">Total Exact Matches</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-stone-900">
                {metrics.columns.reduce((sum, col) => sum + col.mismatches, 0)}
              </div>
              <div className="text-xs text-stone-600">Total Mismatches</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-stone-900">
                {metrics.columns.reduce((sum, col) => sum + col.jobsWithGroundTruth, 0)}
              </div>
              <div className="text-xs text-stone-600">Total GT Jobs</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
