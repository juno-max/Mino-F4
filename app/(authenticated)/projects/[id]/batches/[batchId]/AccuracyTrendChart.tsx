'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'

interface TrendDataPoint {
  timestamp: string
  executionId: string | null
  overallAccuracy: number
  columnMetrics: Array<{
    columnName: string
    accuracy: number
    exactMatches: number
    mismatches: number
  }>
  instructionVersion?: number
  notes?: string
}

interface TrendSummary {
  firstRecorded: string | null
  latestRecorded: string | null
  averageAccuracy: number
  bestAccuracy: number
  worstAccuracy: number
  trend: 'improving' | 'declining' | 'stable'
  improvementRate: number
}

interface AccuracyTrendChartProps {
  batchId: string
}

export function AccuracyTrendChart({ batchId }: AccuracyTrendChartProps) {
  const [data, setData] = useState<TrendDataPoint[]>([])
  const [summary, setSummary] = useState<TrendSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTrends()
  }, [batchId])

  const fetchTrends = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/batches/${batchId}/ground-truth/trends`)
      if (!response.ok) throw new Error('Failed to fetch trends')

      const result = await response.json()
      setData(result.dataPoints || [])
      setSummary(result.summary || null)

      // Auto-select top 3 columns by default
      if (result.dataPoints && result.dataPoints.length > 0) {
        const firstPoint = result.dataPoints[0]
        if (firstPoint.columnMetrics && firstPoint.columnMetrics.length > 0) {
          const top3 = firstPoint.columnMetrics
            .slice()
            .sort((a: any, b: any) => b.accuracy - a.accuracy)
            .slice(0, 3)
            .map((c: any) => c.columnName)
          setSelectedColumns(new Set(top3))
        }
      }
    } catch (error: any) {
      console.error('Error fetching trends:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleColumn = (columnName: string) => {
    const newSelected = new Set(selectedColumns)
    if (newSelected.has(columnName)) {
      newSelected.delete(columnName)
    } else {
      newSelected.add(columnName)
    }
    setSelectedColumns(newSelected)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-stone-600">Loading trends...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accuracy Trend</CardTitle>
          <CardDescription>
            No historical data yet. Trends will appear after running multiple tests.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Format data for chart
  const chartData = data.map(point => {
    const formattedPoint: any = {
      date: new Date(point.timestamp).toLocaleDateString(),
      time: new Date(point.timestamp).toLocaleTimeString(),
      overall: point.overallAccuracy,
      version: point.instructionVersion,
      notes: point.notes,
    }

    // Add selected column data
    point.columnMetrics.forEach(col => {
      if (selectedColumns.has(col.columnName)) {
        formattedPoint[col.columnName] = col.accuracy
      }
    })

    return formattedPoint
  })

  // Get all unique column names from all data points
  const allColumns = new Set<string>()
  data.forEach(point => {
    point.columnMetrics.forEach(col => {
      allColumns.add(col.columnName)
    })
  })

  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

  const TrendIcon = summary?.trend === 'improving' ? TrendingUp :
                   summary?.trend === 'declining' ? TrendingDown : Minus

  const trendColor = summary?.trend === 'improving' ? 'text-green-600' :
                    summary?.trend === 'declining' ? 'text-red-600' : 'text-stone-600'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Accuracy Trend</CardTitle>
            <CardDescription>
              {data.length} data points from {summary?.firstRecorded && new Date(summary.firstRecorded).toLocaleDateString()} to {summary?.latestRecorded && new Date(summary.latestRecorded).toLocaleDateString()}
            </CardDescription>
          </div>
          {summary && (
            <div className="text-right">
              <div className={`flex items-center gap-2 text-xl font-semibold ${trendColor}`}>
                <TrendIcon className="h-5 w-5" />
                {summary.trend.charAt(0).toUpperCase() + summary.trend.slice(1)}
              </div>
              <div className="text-xs text-stone-500">
                {summary.improvementRate > 0 ? '+' : ''}{summary.improvementRate.toFixed(2)}% per day
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-stone-50 p-3 rounded-lg">
              <div className="text-xs text-stone-600">Average</div>
              <div className="text-2xl font-semibold text-stone-900">
                {summary.averageAccuracy.toFixed(1)}%
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs text-green-600">Best</div>
              <div className="text-2xl font-semibold text-green-900">
                {summary.bestAccuracy.toFixed(1)}%
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-xs text-red-600">Worst</div>
              <div className="text-2xl font-semibold text-red-900">
                {summary.worstAccuracy.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: any) => `${value.toFixed(1)}%`}
            />
            <Legend />

            {/* Overall accuracy line */}
            <Line
              type="monotone"
              dataKey="overall"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 4 }}
              name="Overall Accuracy"
            />

            {/* Selected column lines */}
            {Array.from(selectedColumns).map((columnName, idx) => (
              <Line
                key={columnName}
                type="monotone"
                dataKey={columnName}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[idx % colors.length], r: 3 }}
                name={columnName}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Column Selector */}
        {allColumns.size > 0 && (
          <div className="mt-6 border-t border-stone-200 pt-4">
            <div className="text-sm font-medium text-stone-700 mb-2">
              Show Column Trends:
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(allColumns).map((columnName, idx) => (
                <button
                  key={columnName}
                  onClick={() => toggleColumn(columnName)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedColumns.has(columnName)
                      ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                      : 'bg-stone-100 text-stone-600 border-2 border-transparent hover:border-stone-300'
                  }`}
                  style={
                    selectedColumns.has(columnName)
                      ? { borderColor: colors[Array.from(selectedColumns).indexOf(columnName) % colors.length] }
                      : undefined
                  }
                >
                  {columnName}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
