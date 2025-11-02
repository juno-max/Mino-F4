import { db, projects } from '@/db'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, FileText, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { formatDistance } from 'date-fns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProjectsPage() {
  let allProjects = []

  try {
    allProjects = await db.query.projects.findMany({
      orderBy: [desc(projects.updatedAt)],
    })
  } catch (error) {
    console.error('Database error:', error)
    // Return empty array if database not connected
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Projects</h1>
              <p className="text-sm text-stone-600 mt-1">
                Create and manage web automation workflows
              </p>
            </div>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {allProjects.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-stone-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-900 mb-2">No projects yet</h3>
            <p className="text-stone-600 mb-6">
              Create your first project to start building automation workflows
            </p>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-stone-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Updated {formatDistance(project.updatedAt, new Date(), { addSuffix: true })}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
