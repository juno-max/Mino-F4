import { db, projects } from '@/db'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, LayoutGrid, Search, MoreVertical } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Progress } from '@/components/Progress'
import { MenuClientWrapper } from './MenuClientWrapper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProjectsPage() {
  let allProjects: any[] = []
  let stats = { total: 0, active: 0, thisMonth: 0 }

  try {
    allProjects = await db.query.projects.findMany({
      orderBy: [desc(projects.updatedAt)],
    })
    stats = {
      total: allProjects.length,
      active: allProjects.length,
      thisMonth: 0
    }
  } catch (error) {
    console.error('Database error:', error)
  }

  const projectsWithStats = allProjects.map(p => ({
    ...p,
    status: 'ACTIVE' as const,
    progress: { current: 0, total: 0, percentage: 0, validated: 0 },
    successRate: 0,
    lastRun: { time: 'Never' }
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'PAUSED': return 'bg-amber-500'
      case 'COMPLETED': return 'bg-stone-400'
      default: return 'bg-stone-300'
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white shadow-fintech-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MenuClientWrapper />
              <div>
                <h1 className="text-3xl font-semibold text-stone-900">Projects</h1>
                <p className="text-sm text-stone-600 mt-1">
                  Manage your web automation projects
                </p>
              </div>
            </div>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Projects Grid */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Search */}
          <div className="flex items-center gap-4 mb-6 lg:mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-600 pointer-events-none" />
              <Input placeholder="Search projects..." className="pl-11" />
            </div>
          </div>

          {allProjects.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                  <LayoutGrid className="h-8 w-8 text-stone-600" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  No projects yet
                </h3>
                <p className="text-sm text-stone-600 mb-6">
                  Create your first project to start building automation workflows
                </p>
                <Link href="/projects/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projectsWithStats.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-fintech transition-fintech cursor-pointer h-full">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(project.status)}`} />
                          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                            {project.status}
                          </span>
                        </div>
                        <button className="h-8 w-8 flex items-center justify-center hover:bg-stone-100 rounded-lg transition-fintech">
                          <MoreVertical className="h-4 w-4 text-stone-600" />
                        </button>
                      </div>

                      {/* Project Name */}
                      <div>
                        <h3 className="text-xl font-semibold text-stone-900 mb-1">
                          {project.name}
                        </h3>
                        <p className="text-sm text-stone-600 line-clamp-2">
                          {project.description || 'No description'}
                        </p>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4 lg:gap-5 pt-3">
                        <div>
                          <p className="text-xs font-medium text-stone-500 mb-1.5">Progress</p>
                          <p className="metric-small text-stone-900 mb-0.5">
                            {project.progress.current}/{project.progress.total || '—'}
                          </p>
                          <p className="text-xs text-stone-500">
                            {project.progress.percentage}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-stone-500 mb-1.5">Success Rate</p>
                          <p className="metric-small text-green-600 mb-0.5">
                            {project.successRate}%
                          </p>
                          <p className="text-xs text-stone-500">
                            {project.progress.validated} validated
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <Progress value={project.progress.percentage} size="md" />

                      {/* Last Run */}
                      <div className="text-xs text-stone-500 pt-3 border-t border-stone-200">
                        Last run: {project.lastRun.time}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-80 border-l border-stone-200 bg-white px-5 lg:px-6 py-6 lg:py-8 shadow-fintech-sm">
          <h2 className="text-xl font-semibold text-stone-900 mb-6 lg:mb-8">Account Overview</h2>

          <div className="space-y-6 lg:space-y-8">
            <div className="pb-6 lg:pb-8 border-b border-stone-200">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                Total Projects
              </p>
              <p className="metric-large text-stone-900">{stats.total}</p>
            </div>

            <div className="pb-6 border-b border-stone-200">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                Active Jobs
              </p>
              <p className="metric-large text-stone-900">{stats.active}</p>
            </div>

            <div className="pb-6 border-b border-stone-200">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                This Month
              </p>
              <p className="metric-large text-stone-900">${stats.thisMonth.toFixed(2)}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-stone-900 mb-4">Recent Activity</h3>
              {allProjects.length === 0 ? (
                <p className="text-sm text-stone-500">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {allProjects.slice(0, 3).map((project) => (
                    <div key={project.id}>
                      <p className="text-sm font-medium text-stone-900">{project.name}</p>
                      <p className="text-xs text-stone-500">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
