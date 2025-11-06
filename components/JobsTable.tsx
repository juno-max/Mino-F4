'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Square, ArrowUpDown, Activity, Eye } from 'lucide-react'
import Link from 'next/link'
import { Badge } from './Badge'
import { AgentDetailDrawer } from './AgentDetailDrawer'
import { EnhancedTableHeader } from './EnhancedTableHeader'

interface ColumnInfo {
  name: string
  type: string
  isGroundTruth: boolean
  isUrl: boolean
}

interface Job {
  id: string
  inputId: string
  siteUrl: string
  siteName?: string | null
  status: string
  groundTruthData?: Record<string, any> | null
  extractedData?: Record<string, any> | null
  currentStep?: string | null
  progressPercentage?: number
  startedAt?: Date | string | null
  streamingUrl?: string | null
}

interface JobsTableProps {
  projectId: string
  batchId: string
  columnSchema?: ColumnInfo[]
  initialJobs?: Job[]
  pollInterval?: number
  realTimeUpdates?: boolean
  onRunningJobClick?: (jobId: string) => void
}

export function JobsTable({
  projectId,
  batchId,
  columnSchema = [],
  initialJobs = [],
  pollInterval = 2000,
  realTimeUpdates = false,
  onRunningJobClick
}: JobsTableProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<string>('siteUrl')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(true)
  const [showOnlyRunning, setShowOnlyRunning] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [jobDetails, setJobDetails] = useState<Record<string, any>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [exporting, setExporting] = useState(false)

  // Identify ground truth columns
  const gtColumns = columnSchema.filter(col => col.isGroundTruth)

  // Fetch jobs with polling
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`/api/batches/${batchId}/jobs`)
        if (response.ok) {
          const result = await response.json()
          const jobsData = Array.isArray(result.data) ? result.data :
                          Array.isArray(result.jobs) ? result.jobs :
                          Array.isArray(result) ? result : []
          setJobs(jobsData)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching jobs:', error)
        setLoading(false)
      }
    }

    fetchJobs()
    const interval = setInterval(fetchJobs, pollInterval)
    return () => clearInterval(interval)
  }, [batchId, pollInterval])

  // Fetch details for running jobs
  useEffect(() => {
    const runningJobs = jobs.filter(j => j.status === 'running')

    runningJobs.forEach(async (job) => {
      if (!jobDetails[job.id]) {
        try {
          const response = await fetch(`/api/jobs/${job.id}/details`)
          if (response.ok) {
            const data = await response.json()
            setJobDetails(prev => ({
              ...prev,
              [job.id]: data
            }))
          }
        } catch (error) {
          console.error('Error fetching job details:', error)
        }
      }
    })
  }, [jobs.map(j => j.id).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  // Separate input and output columns
  const inputColumns = columnSchema.filter(col => !col.isGroundTruth)
  const outputColumns = columnSchema.filter(col => col.isGroundTruth)

  // Get unique output keys from jobs
  const outputKeys = Array.from(
    new Set(
      jobs.flatMap(job =>
        job.groundTruthData ? Object.keys(job.groundTruthData) : []
      )
    )
  )

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const toggleJobSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const selectAllJobs = () => {
    setSelectedJobs(new Set(jobs.map(j => j.id)))
  }

  const deselectAllJobs = () => {
    setSelectedJobs(new Set())
  }

  const handleRunningJobClick = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedJobId(jobId)
    if (onRunningJobClick) {
      onRunningJobClick(jobId)
    }
  }

  const handleCloseDrawer = () => {
    setSelectedJobId(null)
  }

  const handleExport = () => {
    setExporting(true)
    try {
      // Prepare CSV data
      const headers = ['Job ID', 'Site URL', 'Site Name', 'Status', 'Match %']
      const rows = sortedJobs.map(job => [
        job.id,
        job.siteUrl,
        job.siteName || '',
        job.status,
        calculateAccuracy(job)?.toString() || 'N/A'
      ])

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `jobs-export-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } finally {
      setExporting(false)
    }
  }

  // Calculate accuracy percentage for a job
  const calculateAccuracy = (job: Job): number | null => {
    if (gtColumns.length === 0 || !job.groundTruthData || !job.extractedData) {
      return null
    }

    let matches = 0
    let total = 0

    gtColumns.forEach((col) => {
      const gtValue = job.groundTruthData?.[col.name]
      const extractedValue = job.extractedData?.[col.name]

      if (gtValue !== undefined && gtValue !== null && gtValue !== '') {
        total++
        if (String(gtValue).trim().toLowerCase() === String(extractedValue || '').trim().toLowerCase()) {
          matches++
        }
      }
    })

    return total > 0 ? Math.round((matches / total) * 100) : null
  }

  // Filter jobs by running status and search query
  let filteredJobs = showOnlyRunning ? jobs.filter(j => j.status === 'running') : jobs

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filteredJobs = filteredJobs.filter(job =>
      job.siteUrl.toLowerCase().includes(query) ||
      job.siteName?.toLowerCase().includes(query) ||
      job.inputId.toLowerCase().includes(query) ||
      job.id.toLowerCase().includes(query)
    )
  }

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let aVal: any = a[sortColumn as keyof Job]
    let bVal: any = b[sortColumn as keyof Job]

    // Handle special sort columns
    if (sortColumn === 'accuracy') {
      aVal = calculateAccuracy(a) ?? -1
      bVal = calculateAccuracy(b) ?? -1
    } else if (sortColumn === 'siteUrl') {
      aVal = a.siteUrl
      bVal = b.siteUrl
    } else if (!aVal && !bVal) {
      // Handle sorting by column name for dynamic columns
      const col = inputColumns.find(c => c.name === sortColumn)
      if (col) {
        aVal = col.isUrl ? a.siteUrl : (col.name.toLowerCase().includes('name') ? a.siteName : a.inputId)
        bVal = col.isUrl ? b.siteUrl : (col.name.toLowerCase().includes('name') ? b.siteName : b.inputId)
      }
    }

    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    const comparison = aVal < bVal ? -1 : 1
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const runningJobsCount = jobs.filter(j => j.status === 'running').length
  const selectedJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) : null
  const selectedJobData = selectedJobId && selectedJob
    ? {
        id: selectedJobId,
        siteName: selectedJob.siteName ?? undefined,
        siteUrl: selectedJob.siteUrl,
        status: selectedJob.status,
        progressPercentage: selectedJob.progressPercentage || 0,
        currentStep: selectedJob.currentStep ?? undefined,
        streamingUrl: jobDetails[selectedJobId]?.session?.streamingUrl,
        startedAt: selectedJob.startedAt ? new Date(selectedJob.startedAt) : undefined,
      }
    : null

  if (loading && jobs.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <p className="mt-4 text-sm text-gray-600">Loading jobs...</p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-sm text-gray-600">No jobs found</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {/* Enhanced Table Header with Search and Export */}
        <EnhancedTableHeader
          onSearch={setSearchQuery}
          onExport={handleExport}
          searchValue={searchQuery}
          exporting={exporting}
          placeholder="Search by site URL, job ID, or site name..."
          filterBadges={showOnlyRunning ? [
            {
              label: 'Status',
              value: 'Running',
              onRemove: () => setShowOnlyRunning(false)
            }
          ] : []}
        />

        {/* Selection Controls */}
        {jobs.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={selectAllJobs}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAllJobs}
                className="text-xs font-medium text-gray-600 hover:text-gray-700 transition-colors"
              >
                Deselect All
              </button>
              {selectedJobs.size > 0 && (
                <span className="text-xs text-gray-600">
                  {selectedJobs.size} selected
                </span>
              )}
            </div>

            {/* Running Jobs Filter */}
            {runningJobsCount > 0 && (
              <button
                onClick={() => setShowOnlyRunning(!showOnlyRunning)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  showOnlyRunning
                    ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <Activity className={`h-3.5 w-3.5 ${showOnlyRunning ? 'animate-pulse text-emerald-600' : ''}`} />
                Show Only Running ({runningJobsCount})
              </button>
            )}
          </div>
        )}

        {/* Jobs Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* Checkbox */}
                <th className="w-10 px-3 py-3"></th>

                {/* Status Indicator - Visual dot for fast scanning */}
                <th className="w-12 px-2 py-3">
                  <div className="text-[10px] font-semibold text-gray-700 uppercase text-center">
                    •
                  </div>
                </th>

                {/* Site - Primary identifier */}
                <th className="px-4 py-3 text-left min-w-[200px]">
                  <button
                    onClick={() => handleSort('siteUrl')}
                    className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 uppercase hover:text-emerald-600 transition-colors"
                  >
                    SITE
                    <span className={sortColumn === 'siteUrl' ? 'text-emerald-600' : 'text-gray-400'}>
                      {sortColumn === 'siteUrl' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </button>
                </th>

                {/* Match % - Only if ground truth exists */}
                {gtColumns.length > 0 && (
                  <th className="px-4 py-3 text-left w-24">
                    <button
                      onClick={() => handleSort('accuracy')}
                      className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 uppercase hover:text-emerald-600 transition-colors"
                    >
                      MATCH
                      <span className={sortColumn === 'accuracy' ? 'text-emerald-600' : 'text-gray-400'}>
                        {sortColumn === 'accuracy' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  </th>
                )}

                {/* Status Column */}
                <th className="px-4 py-3 text-left w-28">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 uppercase hover:text-emerald-600 transition-colors"
                  >
                    STATUS
                    <span className={sortColumn === 'status' ? 'text-emerald-600' : 'text-gray-400'}>
                      {sortColumn === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </button>
                </th>

                {/* Progress - Only when real-time updates active */}
                {realTimeUpdates && (
                  <th className="px-4 py-3 text-left w-32">
                    <div className="text-[10px] font-semibold text-gray-700 uppercase">
                      PROGRESS
                    </div>
                  </th>
                )}

                {/* Data Preview - First 2 extracted columns only */}
                {outputKeys.slice(0, 2).map((key) => (
                  <th key={`preview-${key}`} className="px-4 py-3 text-left max-w-[150px]">
                    <div className="text-[10px] font-semibold text-emerald-700 uppercase truncate">
                      {key}
                    </div>
                  </th>
                ))}

                {/* Actions */}
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedJobs.slice(0, 50).map((job) => {
                const isSelected = selectedJobs.has(job.id)
                const isRunning = job.status === 'running'

                // Map job status to badge variant
                let badgeVariant: 'complete' | 'incomplete' | 'error' = 'incomplete'
                let statusText = job.status.charAt(0).toUpperCase() + job.status.slice(1)

                if (job.status === 'completed') {
                  badgeVariant = 'complete'
                  statusText = 'Completed'
                } else if (job.status === 'error') {
                  badgeVariant = 'error'
                  statusText = 'Error'
                } else if (job.status === 'running') {
                  badgeVariant = 'incomplete'
                  statusText = 'Running'
                } else if (job.status === 'queued') {
                  badgeVariant = 'incomplete'
                  statusText = 'Queued'
                }

                // Calculate accuracy for this job
                const accuracy = calculateAccuracy(job)

                // Get display site name/URL
                const displaySite = job.siteName || job.siteUrl
                const siteUrl = job.siteUrl

                return (
                  <tr
                    key={job.id}
                    className={`table-row-hover ${
                      isRunning
                        ? 'bg-emerald-50 hover:bg-emerald-100 cursor-pointer'
                        : 'cursor-pointer'
                    }`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
                        return
                      }
                      if (isRunning) {
                        handleRunningJobClick(job.id, e)
                      } else {
                        window.location.href = `/projects/${projectId}/jobs/${job.id}`
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleJobSelection(job.id)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* Status Indicator - Visual dot for fast scanning */}
                    <td className="px-2 py-3">
                      <div className="flex justify-center">
                        {job.status === 'running' && (
                          <div className="relative">
                            <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 h-3 w-3 bg-blue-400 rounded-full animate-ping"></div>
                          </div>
                        )}
                        {job.status === 'completed' && (
                          <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                        )}
                        {job.status === 'failed' && (
                          <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                        )}
                        {job.status === 'queued' && (
                          <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </td>

                    {/* Site - Primary identifier */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate max-w-[250px]">
                          {displaySite}
                        </span>
                        {job.siteName && (
                          <a
                            href={siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline truncate max-w-[250px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {siteUrl}
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Match % - Only if ground truth exists */}
                    {gtColumns.length > 0 && (
                      <td className="px-4 py-3">
                        {accuracy !== null ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-bold ${
                              accuracy === 100 ? 'text-emerald-600' :
                              accuracy >= 80 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {accuracy}%
                            </span>
                            {accuracy === 100 ? (
                              <span className="text-emerald-600 text-base">✓</span>
                            ) : (
                              <span className="text-red-600 text-base">✗</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    )}

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <Badge variant={badgeVariant}>
                        {statusText}
                      </Badge>
                    </td>

                    {/* Progress Bar - Only when running */}
                    {realTimeUpdates && (
                      <td className="px-4 py-3">
                        {isRunning && (
                          <div className="w-28">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${job.progressPercentage || 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-emerald-700 w-9 text-right">
                                {job.progressPercentage || 0}%
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Data Preview - First 2 columns only */}
                    {outputKeys.slice(0, 2).map((key) => (
                      <td key={`preview-${job.id}-${key}`} className="px-4 py-3 text-xs text-gray-900">
                        {job.status === 'completed' && job.extractedData?.[key] ? (
                          <span className="font-mono text-gray-900 truncate block max-w-[150px]" title={String(job.extractedData[key])}>
                            {String(job.extractedData[key])}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">
                            {job.status === 'running' ? '...' : job.status === 'queued' ? '—' : '—'}
                          </span>
                        )}
                      </td>
                    ))}

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {isRunning ? (
                          <button
                            onClick={(e) => handleRunningJobClick(job.id, e)}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title="View live execution"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        ) : (
                          <Link
                            href={`/projects/${projectId}/jobs/${job.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="View job details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {jobs.length > 50 && (
          <p className="text-sm text-gray-500 text-center">
            Showing 50 of {jobs.length} jobs
          </p>
        )}
      </div>

      {/* Agent Detail Drawer */}
      {selectedJobId && selectedJobData && (
        <AgentDetailDrawer
          isOpen={true}
          onClose={handleCloseDrawer}
          jobId={selectedJobId}
          jobData={selectedJobData}
        />
      )}
    </>
  )
}
