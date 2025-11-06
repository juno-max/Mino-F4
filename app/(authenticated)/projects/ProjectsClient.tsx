'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, LayoutGrid, Search, Upload } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { SidebarToggle } from '@/components/navigation/SidebarToggle'
import { ViewSwitcher } from '@/components/projects/ViewSwitcher'
import { ProjectsGridView } from '@/components/projects/ProjectsGridView'
import { ProjectsListView } from '@/components/projects/ProjectsListView'
import { BatchUploadDrawer } from '@/components/batch-creation/BatchUploadDrawer'

interface ProjectsClientProps {
  projects: any[]
}

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const projectsWithStats = projects.map(p => ({
    ...p,
    status: 'ACTIVE' as const,
    progress: { current: 0, total: 0, percentage: 0, validated: 0 },
    successRate: 0,
    lastRun: { time: 'Never' }
  }))

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projectsWithStats

    const query = searchQuery.toLowerCase()
    return projectsWithStats.filter((project) =>
      project.name.toLowerCase().includes(query) ||
      (project.description?.toLowerCase().includes(query))
    )
  }, [projectsWithStats, searchQuery])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Ultra-Compact Single-Line Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SidebarToggle />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">Projects</h1>
            <span className="text-xs text-gray-500">
              ({filteredProjects.length}{filteredProjects.length !== projects.length && ` of ${projects.length}`})
            </span>

            {/* Inline Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name or description..."
                className="pl-9 bg-white text-sm h-9 border-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ViewSwitcher onViewChange={setViewMode} />
            <Button
              variant="primary"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setIsUploadDrawerOpen(true)}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Upload CSV
            </Button>
          </div>
        </div>

        {/* Projects Display */}
        {projects.length === 0 ? (
          <Card padding="lg" className="text-center bg-white">
            <div className="max-w-md mx-auto py-12">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No projects yet
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Create your first project to start building automation workflows
              </p>
              <Link href="/projects/new">
                <Button variant="primary" size="md">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </div>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card padding="lg" className="text-center bg-white">
            <div className="max-w-md mx-auto py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Try adjusting your search query
              </p>
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </div>
          </Card>
        ) : viewMode === 'grid' ? (
          <ProjectsGridView projects={filteredProjects} />
        ) : (
          <ProjectsListView projects={filteredProjects} />
        )}
      </div>

      {/* Batch Upload Drawer */}
      <BatchUploadDrawer
        isOpen={isUploadDrawerOpen}
        onClose={() => setIsUploadDrawerOpen(false)}
      />
    </div>
  )
}
