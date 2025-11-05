'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface DashboardData {
  overview: {
    overallAccuracy: number
    totalJobs: number
    jobsWithGroundTruth: number
    statusHealth: 'excellent' | 'good' | 'needs_attention' | 'critical'
    deltaFromLast: number | null
  }
  distribution: Array<{
    label: string
    count: number
    percentage: number
    jobIds: string[]
  }>
  columnPerformance: Array<{
    columnName: string
    accuracy: number
    status: string
    exactMatches: number
    mismatches: number
    trend: 'up' | 'down' | 'stable' | null
  }>
  commonErrors: Array<{
    errorType: string
    count: number
    affectedColumns: string[]
    exampleJobIds: string[]
  }>
  recentTrend: {
    dataPoints: Array<{ date: string; accuracy: number }>
    trendDirection: 'improving' | 'declining' | 'stable'
  }
}

export default function AnalyticsDashboard({
  params,
}: {
  params: { id: string; batchId: string }
}) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/batches/${params.batchId}/analytics/dashboard`)
      if (!response.ok) throw new Error('Failed to fetch dashboard')
      const result = await response.json()
      setData(result)
    } catch (error: any) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-stone-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-center text-stone-600">Failed to load dashboard data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const healthColor = {
    excellent: 'text-green-600 bg-green-100',
    good: 'text-blue-600 bg-blue-100',
    needs_attention: 'text-amber-600 bg-amber-100',
    critical: 'text-red-600 bg-red-100',
  }

  const healthIcon = {
    excellent: CheckCircle,
    good: CheckCircle,
    needs_attention: AlertCircle,
    critical: AlertCircle,
  }

  const HealthIcon = healthIcon[data.overview.statusHealth]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/projects/${params.id}/batches/${params.batchId}`}
            className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Batch
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">Accuracy Analytics</h1>
              <p className="text-sm text-stone-600 mt-1">Comprehensive performance breakdown</p>
            </div>
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-amber-700">{data.overview.overallAccuracy.toFixed(1)}%</div>
              <div className="text-sm text-stone-600 mt-1">Overall Accuracy</div>
              {data.overview.deltaFromLast !== null && (
                <div className={`text-xs mt-2 flex items-center gap-1 ${data.overview.deltaFromLast > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.overview.deltaFromLast > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {data.overview.deltaFromLast > 0 ? '+' : ''}{data.overview.deltaFromLast.toFixed(1)}% vs last run
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-stone-900">{data.overview.jobsWithGroundTruth}/{data.overview.totalJobs}</div>
              <div className="text-sm text-stone-600 mt-1">Jobs with GT</div>
              <div className="text-xs text-stone-500 mt-2">
                {((data.overview.jobsWithGroundTruth / data.overview.totalJobs) * 100).toFixed(0)}% coverage
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${healthColor[data.overview.statusHealth]}`}>
                <HealthIcon className="h-5 w-5" />
                <span className="font-semibold capitalize">{data.overview.statusHealth.replace('_', ' ')}</span>
              </div>
              <div className="text-sm text-stone-600 mt-3">System Health</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-2xl font-semibold">
                {data.recentTrend.trendDirection === 'improving' && <TrendingUp className="h-6 w-6 text-green-600" />}
                {data.recentTrend.trendDirection === 'declining' && <TrendingDown className="h-6 w-6 text-red-600" />}
                <span className="capitalize">{data.recentTrend.trendDirection}</span>
              </div>
              <div className="text-sm text-stone-600 mt-1">Trend Direction</div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Accuracy Distribution</CardTitle>
            <CardDescription>Number of jobs at each accuracy level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value: any) => `${value} jobs`} />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.distribution.map(range => (
                <div key={range.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-24 font-medium text-stone-700">{range.label}</div>
                    <div className="flex-1 bg-stone-200 rounded-full h-2 max-w-md">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${range.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-stone-600">{range.count} jobs ({range.percentage.toFixed(0)}%)</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Column Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Column Performance</CardTitle>
            <CardDescription>Accuracy breakdown by field (worst to best)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.columnPerformance.map(col => {
                const color =
                  col.status === 'excellent' ? 'bg-green-500' :
                  col.status === 'good' ? 'bg-blue-500' :
                  col.status === 'needs_attention' ? 'bg-amber-500' :
                  'bg-red-500'

                const statusLabel = col.status.replace('_', ' ')

                return (
                  <div key={col.columnName} className="border border-stone-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-stone-900">{col.columnName}</span>
                        {col.trend && (
                          <span className={`text-xs ${col.trend === 'up' ? 'text-green-600' : col.trend === 'down' ? 'text-red-600' : 'text-stone-600'}`}>
                            {col.trend === 'up' ? '↗' : col.trend === 'down' ? '↘' : '→'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-semibold">{col.accuracy.toFixed(1)}%</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          col.status === 'excellent' ? 'bg-green-100 text-green-800' :
                          col.status === 'good' ? 'bg-blue-100 text-blue-800' :
                          col.status === 'needs_attention' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${color}`}
                        style={{ width: `${col.accuracy}%` }}
                      />
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-stone-600">
                      <span>✓ {col.exactMatches} exact</span>
                      <span>✗ {col.mismatches} mismatch</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Common Errors */}
          <Card>
            <CardHeader>
              <CardTitle>Common Errors</CardTitle>
              <CardDescription>Most frequent failure patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {data.commonErrors.length > 0 ? (
                <div className="space-y-3">
                  {data.commonErrors.slice(0, 5).map((error, idx) => (
                    <div key={idx} className="border-l-4 border-red-500 pl-3 py-2">
                      <div className="font-medium text-stone-900 capitalize">
                        {error.errorType.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-stone-600">{error.count} occurrences</div>
                      <div className="text-xs text-stone-500 mt-1">
                        Affects: {error.affectedColumns.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 italic">No errors detected</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Trend</CardTitle>
              <CardDescription>Last {data.recentTrend.dataPoints.length} test runs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.recentTrend.dataPoints}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" style={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
