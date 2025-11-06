'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, RefreshCw, BarChart3, Filter, PlayCircle } from 'lucide-react'
import { Button } from '@/components/Button'

interface ResultsActionsToolbarProps {
  projectId: string
  batchId: string
  executionId: string
  totalJobs: number
  failedJobs: number
  onExport?: () => void
  onRerunFailed?: () => void
  onFilterChange?: (filter: 'all' | 'passed' | 'failed' | 'error') => void
}

export function ResultsActionsToolbar({
  projectId,
  batchId,
  executionId,
  totalJobs,
  failedJobs,
  onExport,
  onRerunFailed,
  onFilterChange,
}: ResultsActionsToolbarProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'passed' | 'failed' | 'error'>('all')

  const handleFilterChange = (filter: 'all' | 'passed' | 'failed' | 'error') => {
    setActiveFilter(filter)
    onFilterChange?.(filter)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-500" />
          <span className="text-sm font-medium text-stone-700 mr-2">Filter:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeFilter === 'all'
                  ? 'bg-amber-100 text-amber-900 font-medium'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              All ({totalJobs})
            </button>
            <button
              onClick={() => handleFilterChange('passed')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeFilter === 'passed'
                  ? 'bg-green-100 text-green-900 font-medium'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Passed
            </button>
            <button
              onClick={() => handleFilterChange('failed')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeFilter === 'failed'
                  ? 'bg-red-100 text-red-900 font-medium'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Failed
            </button>
            <button
              onClick={() => handleFilterChange('error')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeFilter === 'error'
                  ? 'bg-red-100 text-red-900 font-medium'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Errors ({failedJobs})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onExport && (
            <Button
              size="sm"
              variant="outline"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}

          {failedJobs > 0 && onRerunFailed && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRerunFailed}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rerun Failed ({failedJobs})
            </Button>
          )}

          <Link href={`/projects/${projectId}/batches/${batchId}/analytics`}>
            <Button size="sm" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>

          <Link href={`/projects/${projectId}/batches/${batchId}`}>
            <Button size="sm" variant="primary">
              <PlayCircle className="h-4 w-4 mr-2" />
              New Execution
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
