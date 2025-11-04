'use client'

import { X, Folder, FileText, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Project, Batch } from '@/lib/menu-data'
import { Button } from '@/components/Button'
import { Progress } from '@/components/Progress'

interface MenuPanelProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  stealthMode?: boolean
  onStealthToggle?: (enabled: boolean) => void
}

interface BatchItemProps {
  batch: Batch
}

function BatchItem({ batch }: BatchItemProps) {
  const router = useRouter()

  const handleClick = () => {
    // Navigate to batch page - you'll need to implement this route
    // router.push(`/projects/${projectId}/batches/${batch.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className="pl-8 mb-2 bg-stone-50 rounded-lg p-3 hover:bg-stone-100 cursor-pointer transition-fintech border border-stone-200"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="h-4 w-4 text-stone-500 flex-shrink-0" />
          <span className="font-mono text-sm font-medium truncate">{batch.name}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-stone-600 mb-2">
        <span>{(batch.itemCount || 0).toLocaleString()} items</span>
        <span>{batch.completionPercentage || 0}% completed</span>
      </div>
      <Progress value={batch.completionPercentage} className="h-1.5" />
    </div>
  )
}

interface ProjectItemProps {
  project: Project
  isExpanded: boolean
  onToggle: () => void
}

function ProjectItem({ project, isExpanded, onToggle }: ProjectItemProps) {
  const router = useRouter()

  const handleProjectClick = () => {
    router.push(`/projects/${project.id}`)
  }

  // Card variant (matches image)
  return (
    <div className="mb-3">
      <div
        onClick={onToggle}
        className="bg-stone-50 rounded-lg p-4 hover:bg-stone-100 cursor-pointer transition-fintech border border-stone-200"
      >
        <div className="flex items-center gap-3 mb-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-stone-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-stone-500" />
          )}
          <Folder className="h-5 w-5 text-green-600" />
          <span className="font-semibold flex-1">{project.name}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-stone-600 mb-2 pl-7">
          <span>{(project.itemCount || 0).toLocaleString()} items</span>
          <span>{(project.completionPercentage || 0).toFixed(1)}% completed</span>
        </div>
        <div className="pl-7 mb-3">
          <Progress value={project.completionPercentage} className="h-2" />
        </div>
        {isExpanded && (
          <div className="mt-3 space-y-2">
            {project.batches.map((batch) => (
              <BatchItem key={batch.id} batch={batch} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function MenuPanel({
  isOpen,
  onClose,
  projects,
  stealthMode = false,
  onStealthToggle
}: MenuPanelProps) {
  const router = useRouter()
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set([projects[0]?.id]) // First project expanded by default
  )

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed left-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-stone-900">Menu</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center hover:bg-stone-100 rounded transition-fintech"
          >
            <X className="h-5 w-5 text-stone-600" />
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 space-y-3 border-b border-stone-200">
          <Button
            variant="outline"
            onClick={() => router.push('/projects')}
            className="w-full justify-start border-green-200 bg-green-50 hover:bg-green-100"
          >
            <Eye className="h-4 w-4 mr-2 text-green-600" />
            View all projects
          </Button>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">Stealth</span>
            <button
              onClick={() => onStealthToggle?.(!stealthMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-fintech ${
                stealthMode ? 'bg-green-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  stealthMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div className="px-6 py-4">
          {projects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              isExpanded={expandedProjects.has(project.id)}
              onToggle={() => toggleProject(project.id)}
            />
          ))}
        </div>
      </div>
    </>
  )
}
