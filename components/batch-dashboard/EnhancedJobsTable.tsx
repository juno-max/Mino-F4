'use client'

/**
 * Enhanced Jobs Table Component
 * Primary interface for job management with filters, search, and bulk actions
 * DATA-FIRST DESIGN: Shows extracted data as primary focus
 * Uses fintech UI design system
 */

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, Filter, CheckCircle2, XCircle, Clock, Zap, MoreHorizontal, Download, RotateCcw, X, Eye, Columns } from 'lucide-react'
import { Button } from '@/components/Button'
import { DynamicTableHeader } from './DynamicTableHeader'
import { DataCell } from './DataCell'
import { AccuracyCell } from './AccuracyCell'
import { LiveBadge } from './LiveBadge'
import { JobQuickViewModal } from './JobQuickViewModal'
import { useWebSocket } from '@/lib/useWebSocket'
import type { ExecutionEvent } from '@/lib/execution-events'

type JobStatus = 'queued' | 'running' | 'completed' | 'failed'
type JobFilter = 'all' | JobStatus

interface Job {
  id: string
  inputId: string | null
  siteUrl: string
  status: JobStatus
  progressPercentage: number | null
  currentStep: string | null
  executionDurationMs: number | null
  lastActivityAt: Date | null
  error: string | null
  extractedData: Record<string, any> | null
  groundTruthData: Record<string, any> | null
}

export interface EnhancedJobsTableProps {
  projectId: string
  batchId: string
  initialJobs: any[]
  columnSchema: any[]
}

export function EnhancedJobsTable({
  projectId,
  batchId,
  initialJobs,
  columnSchema,
}: EnhancedJobsTableProps) {
  const [jobs, setJobs] = useState<Job[]>(
    initialJobs.map((job) => ({
      ...job,
      lastActivityAt: job.lastActivityAt ? new Date(job.lastActivityAt) : null,
    }))
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobFilter>('all')
  const [accuracyFilter, setAccuracyFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [durationFilter, setDurationFilter] = useState<'all' | 'fast' | 'medium' | 'slow'>('all')
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showColumnControls, setShowColumnControls] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedJobForQuickView, setSelectedJobForQuickView] = useState<Job | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columnSchema.filter(col => !col.isUrl && !col.isGroundTruth).map(col => col.name))
  )

  // Get extracted data columns for display
  const dataColumns = useMemo(() => {
    return columnSchema.filter(col => !col.isUrl && !col.isGroundTruth)
  }, [columnSchema])

  const gtColumns = useMemo(() => {
    return columnSchema.filter(col => col.isGroundTruth)
  }, [columnSchema])

  // Toggle column visibility
  const handleToggleColumn = (columnName: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(columnName)) {
        newSet.delete(columnName)
      } else {
        newSet.add(columnName)
      }
      return newSet
    })
  }

  // WebSocket real-time updates
  const { status: wsStatus, subscribe } = useWebSocket()

  useEffect(() => {
    // Subscribe to WebSocket events
    const unsubscribe = subscribe((event: ExecutionEvent) => {
      // Only process events for this batch
      if (event.data?.batchId !== batchId) return

      // Handle different event types
      if (event.type === 'job_started' || event.type === 'job_progress' || event.type === 'job_completed' || event.type === 'job_failed') {
        setJobs(prevJobs => {
          const jobIndex = prevJobs.findIndex(j => j.id === event.data?.jobId)
          if (jobIndex === -1) return prevJobs

          const updatedJobs = [...prevJobs]
          const currentJob = updatedJobs[jobIndex]

          // Update job based on event type
          if (event.type === 'job_started') {
            updatedJobs[jobIndex] = {
              ...currentJob,
              status: 'running' as JobStatus,
              lastActivityAt: new Date(),
            }
          } else if (event.type === 'job_progress' && event.data) {
            updatedJobs[jobIndex] = {
              ...currentJob,
              progressPercentage: event.data.progressPercentage || currentJob.progressPercentage,
              currentStep: event.data.currentStep || currentJob.currentStep,
              lastActivityAt: new Date(),
            }
          } else if (event.type === 'job_completed' && event.data) {
            updatedJobs[jobIndex] = {
              ...currentJob,
              status: 'completed' as JobStatus,
              progressPercentage: 100,
              extractedData: event.data.extractedData || currentJob.extractedData,
              executionDurationMs: event.data.duration || currentJob.executionDurationMs,
              lastActivityAt: new Date(),
            }
          } else if (event.type === 'job_failed' && event.data) {
            updatedJobs[jobIndex] = {
              ...currentJob,
              status: 'failed' as JobStatus,
              error: event.data.error || currentJob.error,
              lastActivityAt: new Date(),
            }
          }

          return updatedJobs
        })
      }
    })

    return () => unsubscribe()
  }, [batchId, subscribe])

  // Calculate accuracy for a job
  const calculateJobAccuracy = (job: Job) => {
    if (!job.extractedData || !job.groundTruthData || gtColumns.length === 0) {
      return { correctFields: 0, totalFields: 0, hasGroundTruth: false }
    }

    let correctFields = 0
    let totalFields = 0

    gtColumns.forEach(gtCol => {
      const extractedValue = job.extractedData?.[gtCol.name]
      const gtValue = job.groundTruthData?.[gtCol.name]

      if (gtValue !== null && gtValue !== undefined && gtValue !== '') {
        totalFields++
        const normalizedExtracted = String(extractedValue || '').trim().toLowerCase()
        const normalizedGT = String(gtValue).trim().toLowerCase()
        if (normalizedExtracted === normalizedGT) {
          correctFields++
        }
      }
    })

    return { correctFields, totalFields, hasGroundTruth: totalFields > 0 }
  }

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((job) => job.status === statusFilter)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((job) =>
        job.siteUrl.toLowerCase().includes(query)
      )
    }

    // Apply accuracy filter (if ground truth available)
    if (accuracyFilter !== 'all' && gtColumns.length > 0) {
      filtered = filtered.filter((job) => {
        const { correctFields, totalFields, hasGroundTruth } = calculateJobAccuracy(job)
        if (!hasGroundTruth || totalFields === 0) return false

        const accuracy = (correctFields / totalFields) * 100

        if (accuracyFilter === 'high') return accuracy >= 90
        if (accuracyFilter === 'medium') return accuracy >= 70 && accuracy < 90
        if (accuracyFilter === 'low') return accuracy < 70

        return true
      })
    }

    // Apply duration filter
    if (durationFilter !== 'all') {
      filtered = filtered.filter((job) => {
        if (!job.executionDurationMs) return false

        const seconds = job.executionDurationMs / 1000

        if (durationFilter === 'fast') return seconds < 60
        if (durationFilter === 'medium') return seconds >= 60 && seconds < 300
        if (durationFilter === 'slow') return seconds >= 300

        return true
      })
    }

    // Sort: running first, then queued, then completed/failed
    filtered.sort((a, b) => {
      const statusOrder = { running: 0, queued: 1, completed: 2, failed: 3 }
      return statusOrder[a.status] - statusOrder[b.status]
    })

    return filtered
  }, [jobs, searchQuery, statusFilter, accuracyFilter, durationFilter, gtColumns])

  // Count jobs by status
  const statusCounts = useMemo(() => {
    return jobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      },
      {} as Record<JobStatus, number>
    )
  }, [jobs])

  // Select/deselect all
  const handleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(filteredJobs.map((job) => job.id)))
    }
  }

  // Toggle single job selection
  const handleSelectJob = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  // Show bulk actions when jobs are selected
  useEffect(() => {
    setShowBulkActions(selectedJobs.size > 0)
  }, [selectedJobs])

  // Format duration
  const formatDuration = (ms: number | null) => {
    if (!ms) return '—'
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    const displays: Record<string, {
      icon: any
      color: string
      bg: string
      border: string
      label: string
    }> = {
      queued: {
        icon: Clock,
        color: 'text-gray-500',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        label: 'Queued',
      },
      running: {
        icon: Zap,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        label: 'Running',
      },
      completed: {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        label: 'Completed',
      },
      failed: {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        label: 'Failed',
      },
      error: {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        label: 'Error',
      },
    }
    return displays[status] || displays.failed // Default to failed if status unknown
  }

  const statusFilterOptions: Array<{ value: JobFilter; label: string }> = [
    { value: 'all', label: `All (${jobs.length})` },
    { value: 'running', label: `Running (${statusCounts.running || 0})` },
    { value: 'queued', label: `Queued (${statusCounts.queued || 0})` },
    { value: 'completed', label: `Completed (${statusCounts.completed || 0})` },
    { value: 'failed', label: `Failed (${statusCounts.failed || 0})` },
  ]

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Jobs</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(52,211,153)] focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as JobFilter)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[rgb(52,211,153)] focus:border-transparent appearance-none bg-white cursor-pointer transition-all"
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Filters Button */}
          <Button
            variant={showAdvancedFilters || accuracyFilter !== 'all' || durationFilter !== 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Advanced
            {(accuracyFilter !== 'all' || durationFilter !== 'all') && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                {(accuracyFilter !== 'all' ? 1 : 0) + (durationFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </Button>

          {/* Column Controls Toggle */}
          {dataColumns.length > 0 && (
            <Button
              variant={showColumnControls ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowColumnControls(!showColumnControls)}
            >
              <Columns className="h-4 w-4 mr-2" />
              Columns
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900">Advanced Filters</h3>
            <button
              onClick={() => {
                setAccuracyFilter('all')
                setDurationFilter('all')
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Accuracy Filter */}
            {gtColumns.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Accuracy
                </label>
                <select
                  value={accuracyFilter}
                  onChange={(e) => setAccuracyFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(52,211,153)] focus:border-transparent bg-white"
                >
                  <option value="all">All Accuracies</option>
                  <option value="high">High (≥90%)</option>
                  <option value="medium">Medium (70-89%)</option>
                  <option value="low">Low (&lt;70%)</option>
                </select>
              </div>
            )}

            {/* Duration Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Execution Time
              </label>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(52,211,153)] focus:border-transparent bg-white"
              >
                <option value="all">All Durations</option>
                <option value="fast">Fast (&lt;1min)</option>
                <option value="medium">Medium (1-5min)</option>
                <option value="slow">Slow (&gt;5min)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {selectedJobs.size} {selectedJobs.size === 1 ? 'job' : 'jobs'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Implement bulk export
                console.log('Export selected:', Array.from(selectedJobs))
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Implement bulk retry
                console.log('Retry selected:', Array.from(selectedJobs))
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedJobs(new Set())}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-fintech-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <DynamicTableHeader
              columnSchema={columnSchema}
              visibleColumns={visibleColumns}
              onToggleColumn={handleToggleColumn}
              showColumnControls={showColumnControls}
              allSelected={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
              onSelectAll={handleSelectAll}
            />
            <tbody className="divide-y divide-gray-100">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={100} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">No jobs found</p>
                      {searchQuery && (
                        <p className="text-xs mt-1">
                          Try adjusting your search or filter
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const statusDisplay = getStatusDisplay(job.status)
                  const StatusIcon = statusDisplay.icon
                  const isSelected = selectedJobs.has(job.id)
                  const isRunning = job.status === 'running'
                  const accuracy = calculateJobAccuracy(job)

                  return (
                    <tr
                      key={job.id}
                      className={`
                        hover:bg-gray-50 transition-colors
                        ${isSelected ? 'bg-blue-50/50' : ''}
                        ${isRunning ? 'animate-pulse-subtle' : ''}
                      `}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectJob(job.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[rgb(52,211,153)] focus:ring-[rgb(52,211,153)] cursor-pointer"
                        />
                      </td>

                      {/* Status - COMPACT */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${statusDisplay.bg} ${statusDisplay.border} border`}>
                              <StatusIcon className={`h-3 w-3 ${statusDisplay.color}`} />
                              <span className={`text-xs font-medium ${statusDisplay.color}`}>
                                {statusDisplay.label}
                              </span>
                            </div>
                            {isRunning && <LiveBadge />}
                          </div>
                          {job.currentStep && isRunning && (
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">
                              → {job.currentStep}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Accuracy (if ground truth available) */}
                      {gtColumns.length > 0 && (
                        <td className="px-4 py-4">
                          <AccuracyCell
                            correctFields={accuracy.correctFields}
                            totalFields={accuracy.totalFields}
                            hasGroundTruth={accuracy.hasGroundTruth}
                          />
                        </td>
                      )}

                      {/* EXTRACTED DATA COLUMNS - PRIMARY FOCUS */}
                      {dataColumns
                        .filter(col => visibleColumns.has(col.name))
                        .map((col) => {
                          const extractedValue = job.extractedData?.[col.name]
                          const gtValue = job.groundTruthData?.[col.name]
                          return (
                            <td key={col.name} className="px-4 py-4">
                              <DataCell
                                value={extractedValue}
                                groundTruth={gtValue}
                                fieldName={col.name}
                                fieldType={col.type}
                              />
                            </td>
                          )
                        })}

                      {/* URL - SECONDARY, COMPACT */}
                      <td className="px-4 py-4">
                        <div className="max-w-[200px]">
                          <a
                            href={job.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-600 hover:text-[rgb(52,211,153)] transition-colors truncate block"
                          >
                            {job.siteUrl}
                          </a>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-4">
                        {job.progressPercentage !== null ? (
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${statusDisplay.color.replace('text-', 'bg-')} transition-all duration-500`}
                                style={{ width: `${job.progressPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 w-10 text-right">
                              {job.progressPercentage}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-500">
                          {formatDuration(job.executionDurationMs)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedJobForQuickView(job)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {job.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement retry
                                console.log('Retry job:', job.id)
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination/Load More */}
        {filteredJobs.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-center">
            <p className="text-sm text-gray-600">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </p>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {selectedJobForQuickView && (
        <JobQuickViewModal
          job={selectedJobForQuickView}
          projectId={projectId}
          columnSchema={columnSchema}
          onClose={() => setSelectedJobForQuickView(null)}
        />
      )}
    </div>
  )
}
