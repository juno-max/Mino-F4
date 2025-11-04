'use client'

import { Folder, FileText, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Project, Batch } from '@/lib/menu-data'
import { Button } from '@/components/Button'
import { Progress } from '@/components/Progress'

interface MenuSidebarProps {
  projects: Project[]
  stealthMode?: boolean
  onStealthToggle?: (enabled: boolean) => void
}

interface BatchItemProps {
  batch: Batch
  projectId: string
}

function BatchItem({ batch, projectId }: BatchItemProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/projects/${projectId}/batches/${batch.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className="pl-8 mb-2 bg-stone-50 rounded-lg p-3 hover:bg-stone-100 cursor-pointer transition-fintech border border-stone-300"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="h-4 w-4 text-stone-600 flex-shrink-0" />
          <span className="font-mono text-sm font-medium text-stone-900 truncate">{batch.name}</span>
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

  const handleProjectClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/projects/${project.id}`)
  }

  return (
    <div className="mb-3">
      <div
        onClick={onToggle}
        className="bg-stone-50 rounded-lg p-4 hover:bg-stone-100 cursor-pointer transition-fintech border border-stone-300"
      >
        <div className="flex items-center gap-3 mb-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-stone-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-stone-600" />
          )}
          <Folder className="h-5 w-5 text-green-500" />
          <span className="font-semibold flex-1 text-stone-900">{project.name}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-stone-600 mb-2 pl-7">
          <span>{(project.itemCount || 0).toLocaleString()} items</span>
          <span>{(project.completionPercentage || 0).toFixed(1)}% completed</span>
        </div>
        <div className="pl-7 mb-3">
          <Progress value={project.completionPercentage} className="h-1.5" />
        </div>
        {isExpanded && (
          <div className="mt-3 space-y-2">
            {project.batches.map((batch) => (
              <BatchItem key={batch.id} batch={batch} projectId={project.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function MenuSidebar({
  projects,
  stealthMode = false,
  onStealthToggle
}: MenuSidebarProps) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Actions */}
      <div className="flex-shrink-0 px-4 py-4 space-y-3 border-b border-stone-200">
        <Button
          variant="outline"
          onClick={() => router.push('/projects')}
          className="w-full justify-start border-green-600/50 bg-green-600/10 hover:bg-green-600/20 text-green-400 hover:text-green-300"
          size="sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          View all projects
        </Button>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">Stealth</span>
          <button
            onClick={() => onStealthToggle?.(!stealthMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-fintech ${
              stealthMode ? 'bg-green-500' : 'bg-stone-100'
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
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin-dark">
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
  )
}

