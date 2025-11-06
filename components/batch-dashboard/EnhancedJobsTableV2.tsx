'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, ExternalLink, RefreshCw, Eye } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { InlineDataPreview } from './InlineDataPreview'
import { SmartFilters } from './SmartFilters'
import { BulkActionsBar } from './BulkActionsBar'
import { Button } from '@/components/Button'

interface Job {
  id: string
  siteUrl: string
  siteName?: string | null
  status: string
  detailedStatus?: string | null
  blockedReason?: string | null
  completionPercentage?: number | null
  fieldsExtracted?: string[] | null
  fieldsMissing?: string[] | null
  groundTruthData?: Record<string, any> | null
  sessions?: Array<{
    extractedData?: Record<string, any> | null
  }>
}

interface EnhancedJobsTableV2Props {
  jobs: Job[]
  projectId: string
  batchId: string
  showGroundTruth?: boolean
}

export function EnhancedJobsTableV2({
  jobs,
  projectId,
  batchId,
  showGroundTruth = false,
}: EnhancedJobsTableV2Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState('all')

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts = {
      all: jobs.length,
      completed: 0,
      partial: 0,
      blocked: 0,
      blocked_captcha: 0,
      failed: 0,
      running: 0,
      queued: 0,
    }

    jobs.forEach((job) => {
      const status = job.detailedStatus || job.status

      if (status === 'completed') counts.completed++
      else if (status === 'partial') counts.partial++
      else if (status === 'blocked') {
        counts.blocked++
        if (job.blockedReason === 'captcha') counts.blocked_captcha++
      }
      else if (status === 'failed' || job.status === 'error') counts.failed++
      else if (job.status === 'running') counts.running++
      else if (job.status === 'queued') counts.queued++
    })

    return counts
  }, [jobs])

  // Filter jobs
  const filteredJobs = useMemo(() => {
    if (activeFilter === 'all') return jobs

    return jobs.filter((job) => {
      const status = job.detailedStatus || job.status

      switch (activeFilter) {
        case 'completed':
          return status === 'completed'
        case 'partial':
          return status === 'partial'
        case 'blocked':
          return status === 'blocked'
        case 'blocked_captcha':
          return status === 'blocked' && job.blockedReason === 'captcha'
        case 'failed':
          return status === 'failed' || job.status === 'error'
        case 'running':
          return job.status === 'running'
        case 'queued':
          return job.status === 'queued'
        case 'needs_attention':
          return ['blocked', 'failed', 'partial'].includes(status) || job.status === 'error'
        default:
          return true
      }
    })
  }, [jobs, activeFilter])

  const filters = [
    { id: 'all', label: 'All Jobs', count: filterCounts.all },
    { id: 'needs_attention', label: '⚠️ Needs Attention', count: filterCounts.blocked + filterCounts.failed + filterCounts.partial },
    { id: 'completed', label: '✅ Completed', count: filterCounts.completed },
    { id: 'partial', label: '⚠️ Partial', count: filterCounts.partial },
    { id: 'blocked', label: '🔒 Blocked', count: filterCounts.blocked },
    { id: 'blocked_captcha', label: '🔒 CAPTCHA', count: filterCounts.blocked_captcha },
    { id: 'failed', label: '❌ Failed', count: filterCounts.failed },
  ]

  const toggleRow = (jobId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedRows(newExpanded)
  }

  const toggleSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const selectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(filteredJobs.map(j => j.id)))
    }
  }

  const handleBulkRetry = () => {
    console.log('Retry jobs:', Array.from(selectedJobs))
    // TODO: Implement bulk retry
  }

  const handleBulkExport = () => {
    console.log('Export jobs:', Array.from(selectedJobs))
    // TODO: Implement bulk export
  }

  const handleBulkDelete = () => {
    console.log('Delete jobs:', Array.from(selectedJobs))
    // TODO: Implement bulk delete
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <SmartFilters
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                    onChange={selectAll}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Extracted Data
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No jobs found matching the current filter
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const isExpanded = expandedRows.has(job.id)
                  const isSelected = selectedJobs.has(job.id)
                  const extractedData = job.sessions?.[0]?.extractedData

                  return (
                    <>
                      <tr
                        key={job.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-emerald-50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(job.id)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Expand button */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleRow(job.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        </td>

                        {/* Site */}
                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            <div className="font-medium text-gray-900 truncate">
                              {job.siteName || new URL(job.siteUrl).hostname}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {job.siteUrl}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={job.status}
                            detailedStatus={job.detailedStatus as any}
                            blockedReason={job.blockedReason as any}
                            completionPercentage={job.completionPercentage}
                            showPercentage={job.detailedStatus === 'partial'}
                            size="sm"
                          />
                        </td>

                        {/* Inline Data Preview */}
                        <td className="px-4 py-3">
                          <InlineDataPreview
                            extractedData={extractedData || null}
                            groundTruthData={job.groundTruthData || null}
                            maxFields={3}
                            showGroundTruthComparison={showGroundTruth}
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/projects/${projectId}/jobs/${job.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            {(job.status === 'error' || job.detailedStatus === 'blocked' || job.detailedStatus === 'failed') && (
                              <Button size="sm" variant="outline">
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Retry
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="pl-12 space-y-3">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Extracted Data</h4>
                                {extractedData && Object.keys(extractedData).length > 0 ? (
                                  <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(extractedData).map(([key, value]) => {
                                      const gtValue = job.groundTruthData?.[key]
                                      const hasGT = showGroundTruth && gtValue !== undefined && gtValue !== null
                                      const matches = hasGT && String(value) === String(gtValue)

                                      return (
                                        <div key={key} className="bg-white border border-gray-200 rounded-lg p-3">
                                          <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                                            {key}
                                          </div>
                                          <div className={`text-sm font-mono ${
                                            hasGT && !matches ? 'text-red-600' : 'text-gray-900'
                                          }`}>
                                            {value !== null && value !== undefined && value !== ''
                                              ? String(value)
                                              : <span className="text-gray-400 italic">(missing)</span>
                                            }
                                          </div>
                                          {hasGT && (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                              <div className="text-xs text-gray-500">
                                                Expected: <span className="font-mono">{String(gtValue)}</span>
                                              </div>
                                              <div className={`text-xs font-medium mt-0.5 ${
                                                matches ? 'text-emerald-600' : 'text-red-600'
                                              }`}>
                                                {matches ? '✓ Match' : '✗ Mismatch'}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 italic">No data extracted</div>
                                )}
                              </div>

                              {job.fieldsMissing && job.fieldsMissing.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Missing Fields</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {job.fieldsMissing.map((field) => (
                                      <span
                                        key={field}
                                        className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200"
                                      >
                                        {field}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedJobs.size}
        onRetry={handleBulkRetry}
        onExport={handleBulkExport}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedJobs(new Set())}
      />
    </div>
  )
}
