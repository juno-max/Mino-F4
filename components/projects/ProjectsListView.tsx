'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { formatDistance } from 'date-fns'
import { ProjectActions } from './ProjectActions'

interface Project {
  id: string
  name: string
  description: string | null
  instructions: string | null
  status: string
  progress: {
    current: number
    total: number
    percentage: number
    validated: number
  }
  successRate: number
  lastRun: { time: string }
  updatedAt: Date
  batchCount?: number
}

interface ProjectsListViewProps {
  projects: Project[]
}

type SortField = 'name' | 'jobs' | 'complete' | 'successRate'
type SortDirection = 'asc' | 'desc'

export function ProjectsListView({ projects }: ProjectsListViewProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedProjects = [...projects].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'jobs':
        comparison = a.progress.total - b.progress.total
        break
      case 'complete':
        comparison = a.progress.percentage - b.progress.percentage
        break
      case 'successRate':
        comparison = a.successRate - b.successRate
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500'
      case 'PAUSED': return 'bg-amber-500'
      case 'COMPLETED': return 'bg-gray-400'
      default: return 'bg-gray-300'
    }
  }

  const getAccuracyColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-600'
    if (rate >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  const getAccuracyIcon = (rate: number) => {
    if (rate >= 90) return '✓'
    if (rate >= 70) return '⚠'
    return '✗'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-fintech-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 transition-colors"
                >
                  Project
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-3 py-2 text-left">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                  Description
                </span>
              </th>
              <th className="px-3 py-2 text-right">
                <button
                  onClick={() => handleSort('jobs')}
                  className="flex items-center gap-1 ml-auto text-[10px] font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 transition-colors"
                >
                  Jobs
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-3 py-2 text-right">
                <button
                  onClick={() => handleSort('complete')}
                  className="flex items-center gap-1 ml-auto text-[10px] font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 transition-colors"
                >
                  Complete
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-3 py-2 text-right">
                <button
                  onClick={() => handleSort('successRate')}
                  className="flex items-center gap-1 ml-auto text-[10px] font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 transition-colors"
                >
                  Accuracy
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-3 py-2 text-left">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                  Last Activity
                </span>
              </th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedProjects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-3 py-2">
                  <Link href={`/projects/${project.id}`} className="block">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor(project.status)} flex-shrink-0`} />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{project.name}</div>
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/projects/${project.id}`} className="block">
                    <div className="text-xs text-gray-600 max-w-xs truncate">
                      {project.description || 'No description'}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/projects/${project.id}`} className="block">
                    <div className="text-sm font-mono font-bold text-gray-900">
                      {project.progress.total}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/projects/${project.id}`} className="block">
                    <div className="text-xs font-mono text-gray-900">
                      {project.progress.current}/{project.progress.total} <span className="text-gray-500">({project.progress.percentage}%)</span>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/projects/${project.id}`} className="block">
                    <div className={`text-xs font-semibold ${getAccuracyColor(project.successRate)}`}>
                      {project.successRate}% {getAccuracyIcon(project.successRate)}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/projects/${project.id}`} className="block">
                    <div className="text-xs text-gray-600 truncate">
                      {formatDistance(project.updatedAt, new Date(), { addSuffix: true })}
                    </div>
                  </Link>
                </td>
                <td className="px-2 py-2 text-right">
                  <ProjectActions
                    project={{
                      id: project.id,
                      name: project.name,
                      description: project.description,
                      instructions: project.instructions,
                      batchCount: project.batchCount,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
