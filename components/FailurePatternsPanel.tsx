'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, TrendingUp, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'

interface FailurePattern {
  pattern: string
  count: number
  percentage: number
  examples: Array<{
    jobId: string
    siteUrl: string
    errorMessage: string
  }>
  suggestedFix?: string
}

interface FailurePatternsData {
  patterns: FailurePattern[]
  totalFailures: number
  summary: string
  affectedJobs: number
  totalJobs: number
}

interface FailurePatternsPanelProps {
  batchId: string
}

export default function FailurePatternsPanel({ batchId }: FailurePatternsPanelProps) {
  const [data, setData] = useState<FailurePatternsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFailurePatterns()
  }, [batchId])

  const fetchFailurePatterns = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/batches/${batchId}/failure-patterns`)
      if (!response.ok) throw new Error('Failed to fetch failure patterns')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching failure patterns:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePattern = (pattern: string) => {
    setExpandedPatterns(prev => {
      const next = new Set(prev)
      if (next.has(pattern)) {
        next.delete(pattern)
      } else {
        next.add(pattern)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.patterns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-green-600" />
          Failure Analysis
        </h3>
        <p className="text-gray-600">No failure patterns detected - all jobs completed successfully!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Failure Analysis
        </h3>
        <p className="text-sm text-gray-600">
          {data.affectedJobs} of {data.totalJobs} jobs failed • {data.summary}
        </p>
      </div>

      <div className="p-6 space-y-4">
        {data.patterns.map((pattern, index) => {
          const isExpanded = expandedPatterns.has(pattern.pattern)

          return (
            <div key={index} className="border rounded-lg overflow-hidden">
              {/* Pattern Header */}
              <button
                onClick={() => togglePattern(pattern.pattern)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-700 font-bold text-lg">{pattern.percentage}%</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{pattern.pattern}</h4>
                    <p className="text-sm text-gray-600">
                      {pattern.count} occurrence{pattern.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Suggested Fix */}
                  {pattern.suggestedFix && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-1">Suggested Fix</p>
                          <p className="text-sm text-blue-700">{pattern.suggestedFix}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Examples */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Examples:</p>
                    <div className="space-y-2">
                      {pattern.examples.map((example, exIdx) => (
                        <div key={exIdx} className="bg-gray-50 rounded p-3">
                          <p className="text-xs text-gray-500 mb-1 truncate">{example.siteUrl}</p>
                          <p className="text-sm text-gray-700 font-mono text-xs">{example.errorMessage}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
