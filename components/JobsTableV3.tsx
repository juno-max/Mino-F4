'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react'
import { StatusColumn } from './table/StatusColumn'
import { WebsiteColumn } from './table/WebsiteColumn'
import { ProgressOutcomeColumn } from './table/ProgressOutcomeColumn'
import { AccuracyColumn } from './table/AccuracyColumn'
import { DataPreviewColumn } from './table/DataPreviewColumn'
import { DurationColumn } from './table/DurationColumn'
import { ActionsColumn } from './table/ActionsColumn'
import { SmartFilters, FilterPreset } from './table/SmartFilters'
import { BulkActionsToolbar } from './table/BulkActionsToolbar'
import { JobTableSkeleton } from './batch-dashboard/SkeletonLoaders'
import { VirtualizedJobsTable } from './batch-dashboard/VirtualizedJobsTable'

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
  completedAt?: Date | string | null
  streamingUrl?: string | null
  error?: string | null
}

interface JobsTableV3Props {
  projectId: string
  batchId: string
  columnSchema?: ColumnInfo[]
  initialJobs?: Job[]
  pollInterval?: number
  priorityFields?: string[]
  onRetry?: (jobId: string) => void
  onDelete?: (jobId: string) => void
  onDownload?: (jobId: string) => void
  enableVirtualization?: boolean // Auto-enable for 100+ jobs
  virtualizationThreshold?: number
}

export function JobsTableV3({
  projectId,
  batchId,
  columnSchema = [],
  initialJobs = [],
  pollInterval = 2000,
  priorityFields = [],
  onRetry,
  onDelete,
  onDownload,
  enableVirtualization,
  virtualizationThreshold = 100
}: JobsTableV3Props) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterPreset>('all')

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

  // Calculate accuracy based on ground truth
  const calculateAccuracy = (job: Job): number => {
    if (!job.groundTruthData || !job.extractedData) return 0

    const gtKeys = Object.keys(job.groundTruthData)
    if (gtKeys.length === 0) return 0

    let matches = 0
    gtKeys.forEach(key => {
      const gtValue = String(job.groundTruthData![key] || '').trim().toLowerCase()
      const extractedValue = String(job.extractedData![key] || '').trim().toLowerCase()
      if (gtValue === extractedValue) matches++
    })

    return Math.round((matches / gtKeys.length) * 100)
  }

  // Toggle row selection
  const toggleJobSelection = (jobId: string) => {
    const newSelection = new Set(selectedJobs)
    if (newSelection.has(jobId)) {
      newSelection.delete(jobId)
    } else {
      newSelection.add(jobId)
    }
    setSelectedJobs(newSelection)
  }

  // Toggle row expansion
  const toggleRowExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedRows(newExpanded)
  }

  // Calculate filter counts
  const filterCounts = {
    all: jobs.length,
    needsAttention: jobs.filter(j => {
      const status = j.status.toLowerCase()
      if (status === 'failed') return true
      if (status === 'completed') {
        const accuracy = calculateAccuracy(j)
        return accuracy < 90
      }
      return false
    }).length,
    running: jobs.filter(j => j.status.toLowerCase() === 'running' || j.status.toLowerCase() === 'validating').length,
    perfect: jobs.filter(j => {
      if (j.status.toLowerCase() !== 'completed') return false
      return calculateAccuracy(j) >= 95
    }).length,
    failed: jobs.filter(j => j.status.toLowerCase() === 'failed').length
  }

  // Apply active filter
  const filteredJobs = jobs.filter(job => {
    if (activeFilter === 'all') return true

    const status = job.status.toLowerCase()
    const accuracy = calculateAccuracy(job)

    switch (activeFilter) {
      case 'needs-attention':
        return status === 'failed' || (status === 'completed' && accuracy < 90)
      case 'running':
        return status === 'running' || status === 'validating'
      case 'perfect':
        return status === 'completed' && accuracy >= 95
      case 'failed':
        return status === 'failed'
      default:
        return true
    }
  })

  // Toggle all selections (only for filtered jobs)
  const toggleAllSelections = () => {
    const filteredJobIds = filteredJobs.map(j => j.id)
    const allFilteredSelected = filteredJobIds.every(id => selectedJobs.has(id))

    if (allFilteredSelected) {
      // Deselect all filtered jobs
      const newSelection = new Set(selectedJobs)
      filteredJobIds.forEach(id => newSelection.delete(id))
      setSelectedJobs(newSelection)
    } else {
      // Select all filtered jobs
      const newSelection = new Set(selectedJobs)
      filteredJobIds.forEach(id => newSelection.add(id))
      setSelectedJobs(newSelection)
    }
  }

  // Check if all filtered jobs are selected
  const allFilteredSelected = filteredJobs.length > 0 &&
    filteredJobs.every(job => selectedJobs.has(job.id))

  // Determine if virtualization should be enabled
  const shouldVirtualize = enableVirtualization !== undefined
    ? enableVirtualization
    : filteredJobs.length >= virtualizationThreshold

  // Bulk action handlers
  const handleBulkRetry = () => {
    if (onRetry) {
      selectedJobs.forEach(jobId => onRetry(jobId))
      setSelectedJobs(new Set())
    }
  }

  const handleBulkDelete = () => {
    if (onDelete) {
      if (confirm(`Are you sure you want to delete ${selectedJobs.size} jobs?`)) {
        selectedJobs.forEach(jobId => onDelete(jobId))
        setSelectedJobs(new Set())
      }
    }
  }

  const handleBulkExport = () => {
    const selectedJobsData = jobs.filter(j => selectedJobs.has(j.id))
    const headers = ['Job ID', 'Site URL', 'Status', 'Accuracy', 'Duration']
    const rows = selectedJobsData.map(job => [
      job.id,
      job.siteUrl,
      job.status,
      `${calculateAccuracy(job)}%`,
      calculateDuration(job)
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `jobs-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    setSelectedJobs(new Set())
  }

  const calculateDuration = (job: Job): string => {
    if (!job.startedAt) return '—'
    const start = new Date(job.startedAt).getTime()
    const end = job.completedAt ? new Date(job.completedAt).getTime() : Date.now()
    const durationMs = end - start
    const seconds = Math.floor(durationMs / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex gap-2">
          {['all', 'needs-attention', 'running', 'perfect', 'failed'].map((filter) => (
            <div key={filter} className="px-4 py-2 rounded-lg bg-gray-100 w-32 h-10 animate-pulse" />
          ))}
        </div>
        <JobTableSkeleton rows={8} />
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Smart Filters */}
      <SmartFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
      />

      {/* Performance Badge */}
      {shouldVirtualize && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span>
            High-performance mode active — rendering {filteredJobs.length} jobs efficiently
          </span>
        </div>
      )}

      {/* Table - Virtualized or Standard */}
      {shouldVirtualize ? (
        <VirtualizedJobsTable
          jobs={filteredJobs}
          columnSchema={columnSchema}
          priorityFields={priorityFields}
          selectedJobs={selectedJobs}
          expandedRows={expandedRows}
          onToggleSelection={toggleJobSelection}
          onToggleExpansion={toggleRowExpansion}
          onToggleAllSelections={toggleAllSelections}
          allSelected={allFilteredSelected}
          calculateAccuracy={calculateAccuracy}
          onRetry={onRetry}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      ) : (
        <div className="w-full overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="w-12 px-2 py-3 text-center text-xs font-semibold text-gray-600">#</th>
            <th className="w-10 px-3 py-3">
              <button
                onClick={toggleAllSelections}
                className="text-gray-600 hover:text-gray-900"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </th>
            <th className="w-16 px-3 py-3"></th>
            <th className="w-16 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="w-60 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Website
            </th>
            <th className="w-72 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Progress / Outcome
            </th>
            <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Accuracy
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Key Data
            </th>
            <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Duration
            </th>
            <th className="w-20 px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {filteredJobs.map((job, index) => {
            const isExpanded = expandedRows.has(job.id)
            const isSelected = selectedJobs.has(job.id)
            const accuracy = calculateAccuracy(job)
            const rowNumber = index + 1

            // Alternating row background
            const rowBg = isSelected
              ? 'bg-emerald-50/30'
              : index % 2 === 0
              ? 'bg-white'
              : 'bg-gray-50/50'

            return (
              <>
                {/* Main Row */}
                <tr
                  key={job.id}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-100/80 ${rowBg}`}
                >
                  {/* Row Number */}
                  <td className="px-2 py-3 text-center">
                    <span className="text-xs text-gray-400 font-mono">
                      {rowNumber}
                    </span>
                  </td>

                  {/* Checkbox */}
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleJobSelection(job.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>

                  {/* Expand Button */}
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleRowExpansion(job.id)}
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </td>

                  {/* 1. Status Column (60px) */}
                  <td className="px-3 py-3">
                    <StatusColumn status={job.status} />
                  </td>

                  {/* 2. Website Column (240px) */}
                  <td className="px-3 py-3">
                    <WebsiteColumn
                      siteUrl={job.siteUrl}
                      siteName={job.siteName}
                      jobId={job.id}
                      inputData={job.groundTruthData || undefined}
                    />
                  </td>
                  {/* 3. Progress/Outcome Column (280px) */}
                  <td className="px-3 py-3">
                    <ProgressOutcomeColumn
                      status={job.status}
                      progress={job.progressPercentage}
                      error={job.error}
                      streamingUrl={job.streamingUrl}
                      currentStep={job.currentStep}
                      currentUrl={job.siteName || job.siteUrl}
                      lastActivityAt={job.startedAt}
                      startedAt={job.startedAt}
                      extractedData={job.extractedData}
                      groundTruthData={job.groundTruthData}
                      columnSchema={columnSchema}
                      accuracy={accuracy}
                    />
                  </td>

                  {/* 4. Accuracy Column (120px) */}
                  <td className="px-3 py-3">
                    {job.status.toLowerCase() === 'completed' ? (
                      <AccuracyColumn accuracy={accuracy} showTrend />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* 5. Key Data Preview Column (flex) */}
                  <td className="px-3 py-3">
                    <DataPreviewColumn
                      data={job.extractedData ?? null}
                      maxFields={3}
                      priorityFields={priorityFields}
                    />
                  </td>

                  {/* 6. Duration Column (90px) */}
                  <td className="px-3 py-3">
                    <DurationColumn
                      startTime={job.startedAt}
                      endTime={job.completedAt}
                    />
                  </td>

                  {/* 7. Actions Column (80px) */}
                  <td className="px-3 py-3">
                    <ActionsColumn
                      jobId={job.id}
                      siteUrl={job.siteUrl}
                      status={job.status}
                      onRetry={onRetry}
                      onDelete={onDelete}
                      onDownload={onDownload}
                      onViewDetails={() => toggleRowExpansion(job.id)}
                    />
                  </td>
                </tr>

                {/* Expanded Row - Full Details */}
                {isExpanded && (
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <td colSpan={10} className="px-3 py-4">
                      <ExpandedJobDetails
                        job={job}
                        columnSchema={columnSchema}
                        accuracy={accuracy}
                      />
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>

      {filteredJobs.length === 0 && jobs.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          No jobs match the selected filter
        </div>
      )}

      {jobs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No jobs found
        </div>
      )}
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedJobs.size}
        onRetrySelected={onRetry ? handleBulkRetry : undefined}
        onDeleteSelected={onDelete ? handleBulkDelete : undefined}
        onExportSelected={handleBulkExport}
        onClearSelection={() => setSelectedJobs(new Set())}
      />
    </div>
  )
}

// Expanded row details component
function ExpandedJobDetails({
  job,
  columnSchema,
  accuracy
}: {
  job: Job
  columnSchema: ColumnInfo[]
  accuracy: number
}) {
  const gtColumns = columnSchema.filter(col => col.isGroundTruth)

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left Column - Ground Truth Data */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Ground Truth</h4>
        {gtColumns.length > 0 ? (
          <div className="space-y-2">
            {gtColumns.map((col) => {
              const gtValue = job.groundTruthData?.[col.name]
              const extractedValue = job.extractedData?.[col.name]
              const matches = String(gtValue || '').trim().toLowerCase() ===
                            String(extractedValue || '').trim().toLowerCase()

              return (
                <div key={col.name} className="flex items-start gap-2">
                  <div
                    className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                      matches ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 mb-0.5">
                      {col.name}
                    </div>
                    <div className="text-sm text-gray-900 break-words">
                      {String(gtValue || '—')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No ground truth data</p>
        )}

        {/* Job Metadata */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Job ID:</span>
            <span className="font-mono text-gray-900">{job.id.slice(0, 16)}...</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Input ID:</span>
            <span className="font-mono text-gray-900">{job.inputId}</span>
          </div>
          {job.currentStep && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Current Step:</span>
              <span className="text-gray-900">{job.currentStep}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Extracted Data */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Extracted Data
          <span className="ml-2 text-xs font-normal text-gray-500">
            ({accuracy}% match)
          </span>
        </h4>
        {job.extractedData && Object.keys(job.extractedData).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(job.extractedData).map(([key, value]) => {
              const gtValue = job.groundTruthData?.[key]
              const matches = gtValue !== undefined &&
                            String(gtValue || '').trim().toLowerCase() ===
                            String(value || '').trim().toLowerCase()

              return (
                <div key={key} className="flex items-start gap-2">
                  {gtValue !== undefined && (
                    <div
                      className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                        matches ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 mb-0.5">
                      {key}
                    </div>
                    <div className="text-sm text-gray-900 break-words">
                      {String(value || '—')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No data extracted yet</p>
        )}

        {/* Error message if failed */}
        {job.error && (
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs font-medium text-red-600 mb-1">Error:</div>
            <div className="text-sm text-red-700 bg-red-50 rounded p-2 break-words">
              {job.error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
