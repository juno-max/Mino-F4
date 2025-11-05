'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Clock, CheckCircle2, XCircle, Activity } from 'lucide-react'

interface ExecutionSummary {
  id: string
  createdAt: string
  status: string
  totalJobs: number
  completedJobs: number
  errorJobs: number
  accuracyPercentage: number | null
  avgDurationSeconds: number | null
}

interface ComparisonData {
  execution1: ExecutionSummary
  execution2: ExecutionSummary
  comparison: {
    accuracyChange: number | null
    completionRateChange: number
    errorRateChange: number
    speedChange: number | null
    improvements: string[]
    regressions: string[]
  }
  jobComparison: {
    sameJobs: number
    onlyInExecution1: number
    onlyInExecution2: number
    improved: number
    regressed: number
    unchanged: number
  }
}

interface ExecutionComparisonProps {
  execution1Id: string
  execution2Id: string
}

export default function ExecutionComparison({ execution1Id, execution2Id }: ExecutionComparisonProps) {
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchComparison()
  }, [execution1Id, execution2Id])

  const fetchComparison = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/executions/compare?execution1=${execution1Id}&execution2=${execution2Id}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to compare executions')
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gray-100 rounded"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-900 font-semibold mb-2">Error Loading Comparison</h3>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { execution1, execution2, comparison, jobComparison } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Execution Comparison</h2>
        <p className="text-gray-600 text-sm">
          Comparing execution from {new Date(execution1.createdAt).toLocaleDateString()} vs {new Date(execution2.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Execution 1 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Execution 1</h3>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">{execution1.status}</span>
          </div>
          <div className="space-y-2">
            <MetricRow label="Accuracy" value={execution1.accuracyPercentage ? `${execution1.accuracyPercentage.toFixed(1)}%` : 'N/A'} />
            <MetricRow label="Completed" value={`${execution1.completedJobs}/${execution1.totalJobs}`} />
            <MetricRow label="Errors" value={execution1.errorJobs.toString()} />
            <MetricRow label="Avg Duration" value={execution1.avgDurationSeconds ? `${execution1.avgDurationSeconds}s` : 'N/A'} />
          </div>
        </div>

        {/* Execution 2 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Execution 2</h3>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">{execution2.status}</span>
          </div>
          <div className="space-y-2">
            <MetricRow label="Accuracy" value={execution2.accuracyPercentage ? `${execution2.accuracyPercentage.toFixed(1)}%` : 'N/A'} />
            <MetricRow label="Completed" value={`${execution2.completedJobs}/${execution2.totalJobs}`} />
            <MetricRow label="Errors" value={execution2.errorJobs.toString()} />
            <MetricRow label="Avg Duration" value={execution2.avgDurationSeconds ? `${execution2.avgDurationSeconds}s` : 'N/A'} />
          </div>
        </div>
      </div>

      {/* Changes Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Performance Changes</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ChangeCard
            label="Accuracy"
            value={comparison.accuracyChange}
            suffix="%"
          />
          <ChangeCard
            label="Completion Rate"
            value={comparison.completionRateChange}
            suffix="%"
          />
          <ChangeCard
            label="Error Rate"
            value={comparison.errorRateChange}
            suffix="%"
            inverted
          />
          <ChangeCard
            label="Speed"
            value={comparison.speedChange}
            suffix="s"
            inverted
          />
        </div>
      </div>

      {/* Improvements & Regressions */}
      {(comparison.improvements.length > 0 || comparison.regressions.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparison.improvements.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Improvements
              </h3>
              <ul className="space-y-2">
                {comparison.improvements.map((improvement, idx) => (
                  <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {comparison.regressions.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Regressions
              </h3>
              <ul className="space-y-2">
                {comparison.regressions.map((regression, idx) => (
                  <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {regression}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Job-level Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Job-Level Changes</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{jobComparison.improved}</div>
            <div className="text-sm text-gray-600">Improved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{jobComparison.regressed}</div>
            <div className="text-sm text-gray-600">Regressed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{jobComparison.unchanged}</div>
            <div className="text-sm text-gray-600">Unchanged</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function ChangeCard({
  label,
  value,
  suffix = '',
  inverted = false,
}: {
  label: string
  value: number | null
  suffix?: string
  inverted?: boolean
}) {
  if (value === null) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        <div className="text-xl font-bold text-gray-400">N/A</div>
      </div>
    )
  }

  const isPositive = inverted ? value < 0 : value > 0
  const isNegative = inverted ? value > 0 : value < 0
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
  const bgColor = isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50'

  return (
    <div className={`text-center p-4 ${bgColor} rounded-lg`}>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color} flex items-center justify-center gap-1`}>
        <Icon className="w-5 h-5" />
        {value > 0 ? '+' : ''}{value.toFixed(1)}{suffix}
      </div>
    </div>
  )
}
