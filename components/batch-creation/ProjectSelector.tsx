'use client'

/**
 * Project Selector - Step 2 of batch creation
 * Allows users to select which project to assign the batch to
 * Shows recent projects first, with context awareness
 */

import { useState, useEffect } from 'react'
import { ChevronDown, FolderOpen, Plus, Clock, CheckCircle } from 'lucide-react'
import { CSVAnalysis } from '@/components/quick-start/UniversalDropZone'

interface Project {
  id: string
  name: string
  instructions?: string
  lastUsed?: string
  batchCount?: number
  successRate?: number
  createdAt: string
}

interface ProjectSelectorProps {
  csvAnalysis: CSVAnalysis
  selectedProjectId: string | null
  onProjectSelect: (projectId: string | null) => void
  initialProjectId?: string
  initialProjectName?: string
}

export function ProjectSelector({
  csvAnalysis,
  selectedProjectId,
  onProjectSelect,
  initialProjectId,
  initialProjectName,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])

          // Auto-select if initial project provided
          if (initialProjectId && !selectedProjectId) {
            onProjectSelect(initialProjectId)
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [initialProjectId, selectedProjectId, onProjectSelect])

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  const handleCreateNewProject = async () => {
    if (!newProjectName.trim()) return

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          instructions: `Extract ${csvAnalysis.groundTruthColumns.join(', ')} from each website`,
          autoCreated: true,
        }),
      })

      if (response.ok) {
        const project = await response.json()
        setProjects([project, ...projects])
        onProjectSelect(project.id)
        setIsCreatingNew(false)
        setNewProjectName('')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  // Sort projects: recent first
  const sortedProjects = [...projects].sort((a, b) => {
    const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : new Date(a.createdAt).getTime()
    const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : new Date(b.createdAt).getTime()
    return bTime - aTime
  })

  const recentProjects = sortedProjects.slice(0, 3)
  const olderProjects = sortedProjects.slice(3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Assign to Project</h3>
        <p className="text-sm text-gray-600">
          Select which project this batch belongs to. The batch will inherit the project's workflow.
        </p>
      </div>

      {/* CSV Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span className="font-medium">{csvAnalysis.filename}</span>
          <span className="text-gray-500">•</span>
          <span>{csvAnalysis.rowCount} websites</span>
        </div>
      </div>

      {/* Project Selection */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected Project or Dropdown */}
          {!isCreatingNew && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {selectedProject ? selectedProject.name : 'Select a project...'}
                  </span>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {/* Recent Projects */}
                    {recentProjects.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0">
                          Recent Projects
                        </div>
                        {recentProjects.map(project => (
                          <button
                            key={project.id}
                            onClick={() => {
                              onProjectSelect(project.id)
                              setDropdownOpen(false)
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                              selectedProjectId === project.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <FolderOpen className="h-5 w-5 text-gray-500 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900">{project.name}</div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  {project.lastUsed && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatRelativeTime(project.lastUsed)}
                                    </span>
                                  )}
                                  {project.batchCount !== undefined && (
                                    <span>{project.batchCount} {project.batchCount === 1 ? 'batch' : 'batches'}</span>
                                  )}
                                  {project.successRate !== undefined && (
                                    <span className="text-emerald-600">{project.successRate}% success</span>
                                  )}
                                </div>
                              </div>
                              {selectedProjectId === project.id && (
                                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* All Projects */}
                    {olderProjects.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0 border-t border-gray-200">
                          All Projects
                        </div>
                        {olderProjects.map(project => (
                          <button
                            key={project.id}
                            onClick={() => {
                              onProjectSelect(project.id)
                              setDropdownOpen(false)
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                              selectedProjectId === project.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FolderOpen className="h-5 w-5 text-gray-500" />
                                <span className="font-medium text-gray-900">{project.name}</span>
                              </div>
                              {selectedProjectId === project.id && (
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Create New Project */}
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => {
                          setIsCreatingNew(true)
                          setDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-blue-600 font-medium"
                      >
                        <Plus className="h-5 w-5" />
                        Create New Project
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Create New Project Form */}
          {isCreatingNew && (
            <div className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Lead Generation Q4 2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewProject()
                    } else if (e.key === 'Escape') {
                      setIsCreatingNew(false)
                      setNewProjectName('')
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  A project groups related batches and shares workflow configuration
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateNewProject}
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Project
                </button>
                <button
                  onClick={() => {
                    setIsCreatingNew(false)
                    setNewProjectName('')
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Selected Project Info */}
          {selectedProject && !isCreatingNew && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Batch will be added to "{selectedProject.name}"
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Will inherit project's workflow by default (you can customize in the next step)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {projects.length === 0 && !isCreatingNew && (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No projects yet</p>
              <button
                onClick={() => setIsCreatingNew(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Project
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}
