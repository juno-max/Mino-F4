'use client'

/**
 * Virtualized Jobs Table
 * High-performance table that only renders visible rows
 * Dramatically improves performance for 1000+ jobs
 */

import { useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react'
import { StatusColumn } from '../table/StatusColumn'
import { WebsiteColumn } from '../table/WebsiteColumn'
import { ProgressOutcomeColumn } from '../table/ProgressOutcomeColumn'
import { AccuracyColumn } from '../table/AccuracyColumn'
import { DataPreviewColumn } from '../table/DataPreviewColumn'
import { DurationColumn } from '../table/DurationColumn'
import { ActionsColumn } from '../table/ActionsColumn'

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

interface VirtualizedJobsTableProps {
  jobs: Job[]
  columnSchema: ColumnInfo[]
  priorityFields?: string[]
  selectedJobs: Set<string>
  expandedRows: Set<string>
  onToggleSelection: (jobId: string) => void
  onToggleExpansion: (jobId: string) => void
  onToggleAllSelections: () => void
  allSelected: boolean
  calculateAccuracy: (job: Job) => number
  onRetry?: (jobId: string) => void
  onDelete?: (jobId: string) => void
  onDownload?: (jobId: string) => void
}

export function VirtualizedJobsTable({
  jobs,
  columnSchema,
  priorityFields = [],
  selectedJobs,
  expandedRows,
  onToggleSelection,
  onToggleExpansion,
  onToggleAllSelections,
  allSelected,
  calculateAccuracy,
  onRetry,
  onDelete,
  onDownload,
}: VirtualizedJobsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate dynamic row height based on expansion
  const estimateSize = (index: number) => {
    const job = jobs[index]
    const isExpanded = expandedRows.has(job.id)
    // Base row: 56px, Expanded row: +200px
    return isExpanded ? 256 : 56
  }

  const rowVirtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // Render 5 extra rows above and below viewport
    measureElement: typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
      ? element => element?.getBoundingClientRect().height
      : undefined,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      {/* Fixed Table Header */}
      <div className="overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-12 px-2 py-3 text-center text-xs font-semibold text-gray-600">#</th>
              <th className="w-10 px-3 py-3">
                <button
                  onClick={onToggleAllSelections}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {allSelected ? (
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
        </table>
      </div>

      {/* Virtualized Table Body */}
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-fintech"
        style={{ height: '600px' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <table className="w-full border-collapse">
            <tbody>
              {virtualItems.map((virtualRow) => {
                const job = jobs[virtualRow.index]
                const isExpanded = expandedRows.has(job.id)
                const isSelected = selectedJobs.has(job.id)
                const accuracy = calculateAccuracy(job)
                const rowNumber = virtualRow.index + 1

                const rowBg = isSelected
                  ? 'bg-emerald-50/30'
                  : virtualRow.index % 2 === 0
                  ? 'bg-white'
                  : 'bg-gray-50/50'

                return (
                  <tr
                    key={job.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <td colSpan={10} className="p-0">
                      <table className="w-full border-collapse">
                        <tbody>
                          {/* Main Row */}
                          <tr
                            className={`border-b border-gray-100 transition-colors hover:bg-gray-100/80 ${rowBg}`}
                          >
                            {/* Row Number */}
                            <td className="w-12 px-2 py-3 text-center">
                              <span className="text-xs text-gray-400 font-mono">
                                {rowNumber}
                              </span>
                            </td>

                            {/* Checkbox */}
                            <td className="w-10 px-3 py-3">
                              <button
                                onClick={() => onToggleSelection(job.id)}
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
                            <td className="w-16 px-3 py-3">
                              <button
                                onClick={() => onToggleExpansion(job.id)}
                                className="text-gray-400 hover:text-gray-700 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            </td>

                            {/* Status Column */}
                            <td className="w-16 px-3 py-3">
                              <StatusColumn status={job.status} />
                            </td>

                            {/* Website Column */}
                            <td className="w-60 px-3 py-3">
                              <WebsiteColumn
                                siteUrl={job.siteUrl}
                                siteName={job.siteName}
                                jobId={job.id}
                                inputData={job.groundTruthData || undefined}
                              />
                            </td>

                            {/* Progress/Outcome Column */}
                            <td className="w-72 px-3 py-3">
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

                            {/* Accuracy Column */}
                            <td className="w-32 px-3 py-3">
                              {job.status.toLowerCase() === 'completed' ? (
                                <AccuracyColumn accuracy={accuracy} showTrend />
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>

                            {/* Key Data Preview Column */}
                            <td className="px-3 py-3">
                              <DataPreviewColumn
                                data={job.extractedData ?? null}
                                maxFields={3}
                                priorityFields={priorityFields}
                              />
                            </td>

                            {/* Duration Column */}
                            <td className="w-24 px-3 py-3">
                              <DurationColumn
                                startTime={job.startedAt}
                                endTime={job.completedAt}
                              />
                            </td>

                            {/* Actions Column */}
                            <td className="w-20 px-3 py-3">
                              <ActionsColumn
                                jobId={job.id}
                                siteUrl={job.siteUrl}
                                status={job.status}
                                onRetry={onRetry}
                                onDelete={onDelete}
                                onDownload={onDownload}
                                onViewDetails={() => onToggleExpansion(job.id)}
                              />
                            </td>
                          </tr>

                          {/* Expanded Row */}
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
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
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
