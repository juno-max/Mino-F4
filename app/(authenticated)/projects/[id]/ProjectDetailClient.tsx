'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, MoreHorizontal, BarChart3, Plus } from 'lucide-react'
import { ScrollResponsiveHeader } from '@/components/ScrollResponsiveHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { ProgressiveButtonGroup } from '@/components/ProgressiveButtonGroup'
import { Button } from '@/components/Button'
import { formatDistanceToNow } from 'date-fns'

interface Batch {
  id: string
  name: string
  description: string | null
  totalSites: number
  hasGroundTruth: boolean
  createdAt: Date
  updatedAt: Date
  status: 'running' | 'completed' | 'failed' | 'queued' | 'idle'
  stats: {
    totalJobs: number
    completedJobs: number
    runningJobs: number
    failedJobs: number
    passRate: number | null
    completionPercentage: number
  }
}

interface ProjectDetailClientProps {
  project: any
  batches: Batch[]
}

/**
 * ProjectDetailClient - Batch-Centric Project View
 *
 * Core UX Principle: Batch-Centric Project View
 * - Status badges prominent and color-coded
 * - Quick metrics inline
 * - Sortable by status, last run, pass rate
 * - Icon-only actions with hover labels
 */
export function ProjectDetailClient({ project, batches }: ProjectDetailClientProps) {
  const [sortBy, setSortBy] = useState<'status' | 'name' | 'updated' | 'passRate'>('updated')

  // Sort batches
  const sortedBatches = [...batches].sort((a, b) => {
    switch (sortBy) {
      case 'status':
        const statusOrder = { running: 0, failed: 1, queued: 2, completed: 3, idle: 4 }
        return statusOrder[a.status] - statusOrder[b.status]
      case 'name':
        return a.name.localeCompare(b.name)
      case 'passRate':
        const aRate = a.stats.passRate ?? -1
        const bRate = b.stats.passRate ?? -1
        return bRate - aRate
      case 'updated':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compressed Header */}
      <ScrollResponsiveHeader
        backHref="/projects"
        backLabel="Projects"
        title={project.name}
        subtitle={project.description}
        metadata={[
          { label: 'batches', value: batches.length },
        ]}
        actions={
          <Link href={`/projects/${project.id}/batches/new`}>
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Batch
            </Button>
          </Link>
        }
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="updated">Last Updated</option>
              <option value="status">Status</option>
              <option value="name">Name</option>
              <option value="passRate">Pass Rate</option>
            </select>
          </div>
        </div>

        {/* Batch Status Table */}
        {batches.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">No batches yet</p>
            <Link href={`/projects/${project.id}/batches/new`}>
              <Button variant="primary" size="md">
                <Plus className="h-4 w-4 mr-2" />
                Create First Batch
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table */}
            <div className="divide-y divide-gray-200">
              {sortedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <StatusBadge status={batch.status} size="sm" />
                  </div>

                  {/* Batch Name & Description */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/projects/${project.id}/batches/${batch.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors block truncate"
                    >
                      {batch.name}
                    </Link>
                    {batch.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{batch.description}</p>
                    )}
                  </div>

                  {/* Inline Metrics */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    {/* Jobs Count */}
                    <span className="font-mono whitespace-nowrap">
                      {batch.stats.completedJobs}/{batch.stats.totalJobs} jobs
                    </span>

                    {/* Pass Rate */}
                    {batch.stats.passRate !== null && (
                      <span className={`font-semibold whitespace-nowrap ${
                        batch.stats.passRate >= 90 ? 'text-emerald-600' :
                        batch.stats.passRate >= 70 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {batch.stats.passRate}% pass
                      </span>
                    )}

                    {/* Last Updated */}
                    <span className="text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(batch.updatedAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Actions - Icon Only */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ProgressiveButtonGroup
                      size="sm"
                      buttons={[
                        {
                          icon: Play,
                          label: 'Run',
                          onClick: () => {
                            // TODO: Implement run
                          },
                          variant: 'ghost',
                        },
                        {
                          icon: BarChart3,
                          label: 'Analytics',
                          onClick: () => {
                            window.location.href = `/projects/${project.id}/batches/${batch.id}/analytics`
                          },
                          variant: 'ghost',
                          disabled: !batch.hasGroundTruth,
                        },
                        {
                          icon: MoreHorizontal,
                          label: 'More',
                          onClick: () => {
                            // TODO: Implement more actions menu
                          },
                          variant: 'ghost',
                        },
                      ]}
                    />
                  </div>

                  {/* Progress Bar (if running) */}
                  {batch.status === 'running' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${batch.stats.completionPercentage}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
