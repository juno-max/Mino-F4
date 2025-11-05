'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, CheckCircle, XCircle, Clock, Loader2, Filter, X, Search } from 'lucide-react'

interface Job {
  id: string
  siteUrl: string
  siteName: string | null
  status: string
  isEvaluated: boolean
  evaluationResult: string | null
  createdAt: string
  hasGroundTruth: boolean
}

interface BatchJobsListProps {
  projectId: string
  batchId: string
}

interface Filters {
  status: string[]
  hasGroundTruth: boolean | null
  evaluationResult: string[]
  accuracyMin: string
  accuracyMax: string
  search: string
}

export function BatchJobsList({ projectId, batchId }: BatchJobsListProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    status: [],
    hasGroundTruth: null,
    evaluationResult: [],
    accuracyMin: '',
    accuracyMax: '',
    search: '',
  })

  useEffect(() => {
    fetchJobs()
  }, [batchId, filters])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.status.length > 0) params.set('status', filters.status.join(','))
      if (filters.hasGroundTruth !== null) params.set('hasGroundTruth', String(filters.hasGroundTruth))
      if (filters.evaluationResult.length > 0) params.set('evaluationResult', filters.evaluationResult.join(','))
      if (filters.accuracyMin) params.set('accuracyMin', filters.accuracyMin)
      if (filters.accuracyMax) params.set('accuracyMax', filters.accuracyMax)
      if (filters.search) params.set('search', filters.search)

      const response = await fetch(`/api/batches/${batchId}/jobs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch jobs')

      const data = await response.json()
      setJobs(data.jobs)
      setError(null)
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  const toggleEvaluationFilter = (result: string) => {
    setFilters(prev => ({
      ...prev,
      evaluationResult: prev.evaluationResult.includes(result)
        ? prev.evaluationResult.filter(r => r !== result)
        : [...prev.evaluationResult, result]
    }))
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      hasGroundTruth: null,
      evaluationResult: [],
      accuracyMin: '',
      accuracyMax: '',
      search: '',
    })
  }

  const hasActiveFilters = filters.status.length > 0 || filters.hasGroundTruth !== null ||
    filters.evaluationResult.length > 0 || filters.accuracyMin || filters.accuracyMax || filters.search

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchJobs} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>Individual jobs created from your batch data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-stone-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-stone-400" />
            <p className="text-sm">No jobs yet</p>
            <p className="text-xs text-stone-400 mt-1">
              Jobs will be created when you run a test execution
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = {
    queued: { color: 'text-stone-500', bgColor: 'bg-stone-100', label: 'Queued', icon: Clock },
    running: { color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Running', icon: Loader2 },
    completed: { color: 'text-green-500', bgColor: 'bg-green-100', label: 'Completed', icon: CheckCircle },
    error: { color: 'text-red-500', bgColor: 'bg-red-100', label: 'Error', icon: XCircle },
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>{jobs.length} jobs {hasActiveFilters && '(filtered)'}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
              {hasActiveFilters && <span className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{
                [filters.status.length, filters.evaluationResult.length, filters.hasGroundTruth ? 1 : 0, filters.accuracyMin || filters.accuracyMax ? 1 : 0, filters.search ? 1 : 0].reduce((a,b) => a+b, 0)
              }</span>}
            </Button>
            <Button onClick={fetchJobs} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by URL, ID, or name..."
                  className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {['queued', 'running', 'completed', 'error'].map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filters.status.includes(status)
                        ? 'bg-amber-500 text-white'
                        : 'bg-white border border-stone-300 text-stone-700 hover:border-amber-300'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Ground Truth Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Ground Truth</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, hasGroundTruth: true }))}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filters.hasGroundTruth === true
                      ? 'bg-amber-500 text-white'
                      : 'bg-white border border-stone-300 text-stone-700 hover:border-amber-300'
                  }`}
                >
                  With GT
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, hasGroundTruth: false }))}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filters.hasGroundTruth === false
                      ? 'bg-amber-500 text-white'
                      : 'bg-white border border-stone-300 text-stone-700 hover:border-amber-300'
                  }`}
                >
                  Without GT
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, hasGroundTruth: null }))}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filters.hasGroundTruth === null
                      ? 'bg-amber-500 text-white'
                      : 'bg-white border border-stone-300 text-stone-700 hover:border-amber-300'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* Evaluation Result Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Evaluation Result</label>
              <div className="flex gap-2">
                {['pass', 'fail'].map(result => (
                  <button
                    key={result}
                    onClick={() => toggleEvaluationFilter(result)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filters.evaluationResult.includes(result)
                        ? 'bg-amber-500 text-white'
                        : 'bg-white border border-stone-300 text-stone-700 hover:border-amber-300'
                    }`}
                  >
                    {result.charAt(0).toUpperCase() + result.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Accuracy Range */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Accuracy Range (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.accuracyMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, accuracyMin: e.target.value }))}
                  placeholder="Min"
                  className="w-24 px-3 py-1.5 border border-stone-300 rounded-md text-sm"
                />
                <span className="text-stone-500">to</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.accuracyMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, accuracyMax: e.target.value }))}
                  placeholder="Max"
                  className="w-24 px-3 py-1.5 border border-stone-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="pt-2 border-t border-stone-300">
                <Button onClick={clearFilters} variant="outline" size="sm" className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
          {jobs.map((job) => {
            const status = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.queued
            const StatusIcon = status.icon

            return (
              <div
                key={job.id}
                className={`p-4 border rounded-lg transition-all duration-200 ${
                  job.evaluationResult === 'pass'
                    ? 'border-green-200 bg-green-50'
                    : job.evaluationResult === 'fail'
                    ? 'border-red-200 bg-red-50'
                    : 'border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-stone-900 truncate">
                        {job.siteName || 'Site'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.bgColor} ${status.color} flex items-center gap-1`}>
                        <StatusIcon className={`h-3 w-3 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                        {status.label}
                      </span>
                      {job.isEvaluated && (
                        <span className="text-xs">
                          {job.evaluationResult === 'pass' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {job.evaluationResult === 'fail' && <XCircle className="h-4 w-4 text-red-600" />}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-stone-600 truncate">{job.siteUrl}</div>
                  </div>
                  <Link href={`/projects/${projectId}/jobs/${job.id}`}>
                    <Button size="sm" variant="outline" className="ml-4">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
