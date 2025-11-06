'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { Card } from '@/components/Card'
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

interface ProjectsGridViewProps {
  projects: Project[]
}

export function ProjectsGridView({ projects }: ProjectsGridViewProps) {
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
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <Card variant="interactive" padding="sm" className="bg-white">
            {/* Single-Line Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor(project.status)} flex-shrink-0`} />
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  {project.status}
                </span>
              </div>
              <ProjectActions
                project={{
                  id: project.id,
                  name: project.name,
                  description: project.description,
                  instructions: project.instructions,
                  batchCount: project.batchCount,
                }}
              />
            </div>

            {/* Project Name - Single Line */}
            <h3 className="text-base font-semibold text-gray-900 mb-1 tracking-tight truncate">
              {project.name}
            </h3>
            <p className="text-xs text-gray-600 truncate mb-3">
              {project.description || 'No description'}
            </p>

            {/* Ultra-Dense Metrics - All on 2 lines */}
            <div className="space-y-2">
              {/* Jobs & Completion - Single Line */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900 font-mono">{project.progress.total}</span>
                  <span className="text-gray-500">jobs</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-gray-900">{project.progress.current}/{project.progress.total}</span>
                  <span className="text-gray-500">({project.progress.percentage}%)</span>
                </div>
              </div>

              {/* Progress Bar - Thinner */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${project.progress.percentage}%` }}
                />
              </div>

              {/* Accuracy & Time - Single Line */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-3 w-3 ${getAccuracyColor(project.successRate)}`} />
                  <span className={`font-semibold ${getAccuracyColor(project.successRate)}`}>
                    {project.successRate}% {getAccuracyIcon(project.successRate)}
                  </span>
                </div>
                <span className="text-gray-500 truncate">
                  {formatDistance(project.updatedAt, new Date(), { addSuffix: true })}
                </span>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
