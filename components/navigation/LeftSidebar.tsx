'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, Plus, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/Button'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useCmdOrCtrlKey } from '@/hooks/useKeyboardShortcut'

interface BatchMetrics {
  totalJobs: number
  completedJobs: number
  runningJobs: number
  errorJobs: number
  accuracy: number
  health: 'excellent' | 'good' | 'warning' | 'error'
}

interface BatchNode {
  id: string
  name: string
  projectId: string
  type: 'batch'
  metrics: BatchMetrics
}

interface ProjectNode {
  id: string
  name: string
  type: 'project'
  batches: BatchNode[]
  metrics: {
    totalBatches: number
    totalJobs: number
    completedJobs: number
    runningJobs: number
    accuracy: number
    health: 'excellent' | 'good' | 'warning' | 'error'
  }
}

export default function LeftSidebar() {
  const [isExpanded, setIsExpanded] = useLocalStorage('sidebar-expanded', false) // Default to collapsed
  const [isHovering, setIsHovering] = useState(false)
  const [projects, setProjects] = useState<ProjectNode[]>([])
  const [expandedProjects, setExpandedProjects] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Toggle sidebar with Cmd+\
  useCmdOrCtrlKey('\\', () => {
    setIsExpanded(!isExpanded)
  })

  // Fetch projects and batches
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/navigation/tree')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.tree || [])
          // Expand all projects by default
          setExpandedProjects(data.tree?.map((p: ProjectNode) => p.id) || [])
        }
      } catch (error) {
        console.error('Error fetching navigation tree:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()

    // Poll every 10 seconds for updates
    const interval = setInterval(fetchProjects, 10000)
    return () => clearInterval(interval)
  }, [])

  // Listen for external toggle events and notify layout wrapper when sidebar state changes
  useEffect(() => {
    const handleExternalToggle = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.expanded === 'boolean') {
        setIsExpanded(event.detail.expanded)
      }
    }

    window.addEventListener('sidebar-toggle', handleExternalToggle as EventListener)

    // Dispatch initial state
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { expanded: isExpanded } }))

    return () => {
      window.removeEventListener('sidebar-toggle', handleExternalToggle as EventListener)
    }
  }, [isExpanded])

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const getHealthIcon = (accuracy: number) => {
    if (accuracy >= 90) return '✓'
    if (accuracy >= 70) return '⚠'
    return '✗'
  }

  const getHealthColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-emerald-500'
    if (accuracy >= 70) return 'text-amber-500'
    return 'text-red-500'
  }

  // Show sidebar when explicitly expanded OR when hovering over collapsed state
  const shouldShow = isExpanded || isHovering

  return (
    <>
      {/* Hover trigger zone - only visible when collapsed */}
      {!isExpanded && (
        <div
          className="fixed left-0 top-16 bottom-0 w-2 z-50 cursor-pointer hover:bg-emerald-500/20 transition-colors"
          onMouseEnter={() => setIsHovering(true)}
          title="Hover to show navigation"
        />
      )}

      <aside
        className={`
          fixed left-0 top-16 bottom-0 z-40
          bg-white border-r border-gray-200 shadow-fintech-lg
          transition-all duration-300 ease-in-out
          ${shouldShow ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full'}
        `}
        onMouseLeave={() => {
          if (!isExpanded) setIsHovering(false)
        }}
      >
      <div className="flex flex-col h-full">
        {/* Header - Only show when expanded */}
        {isExpanded && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Projects</h2>
          </div>
        )}

        {/* Project Tree */}
        <div className={`flex-1 overflow-y-auto ${isExpanded ? 'py-2' : 'py-4'}`}>
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No projects yet
            </div>
          ) : (
            projects.map(project => {
            const isProjectExpanded = expandedProjects.includes(project.id)

            return (
              <div key={project.id} className="mb-1">
                {/* Project Header */}
                <button
                  onClick={() => toggleProject(project.id)}
                  className={`
                    w-full flex items-center px-3 py-2
                    hover:bg-gray-50 transition-colors
                    ${isExpanded ? 'justify-between' : 'justify-center'}
                  `}
                  title={!isExpanded ? project.name : undefined}
                >
                  {isExpanded ? (
                    <>
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {isProjectExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </span>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${
                        project.batches.length > 0 ? 'bg-emerald-500' : 'bg-gray-300'
                      }`} />
                    </>
                  ) : (
                    <div className="relative">
                      <span className="text-sm font-bold text-gray-700">
                        {project.name.charAt(0)}
                      </span>
                      <div className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full border border-white ${
                        project.batches.length > 0 ? 'bg-emerald-500' : 'bg-gray-300'
                      }`} />
                    </div>
                  )}
                </button>

                {/* Batches (only show when expanded) */}
                {isExpanded && isProjectExpanded && (
                  <div className="ml-6 border-l border-gray-200 pl-2 space-y-1 mt-1">
                    {project.batches.map(batch => (
                      <Link
                        key={batch.id}
                        href={`/projects/${project.id}/batches/${batch.id}`}
                        className="block px-3 py-2 hover:bg-gray-50 rounded-md transition-colors group"
                      >
                        <div className="text-xs font-medium text-gray-700 group-hover:text-gray-900 mb-1 truncate">
                          📄 {batch.name}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 font-mono">
                            {batch.metrics.completedJobs}/{batch.metrics.totalJobs}
                          </span>
                          <span className="text-gray-500 font-mono">
                            {batch.metrics.accuracy}%
                          </span>
                          <span className={`${getHealthColor(batch.metrics.accuracy)} font-semibold`}>
                            {getHealthIcon(batch.metrics.accuracy)}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              batch.metrics.runningJobs > 0 ? 'bg-blue-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${batch.metrics.totalJobs > 0 ? (batch.metrics.completedJobs / batch.metrics.totalJobs) * 100 : 0}%` }}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }))}
        </div>

        {/* Create Project Button - Only show when expanded */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-3">
            <Link href="/projects/new">
              <Button variant="primary" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
