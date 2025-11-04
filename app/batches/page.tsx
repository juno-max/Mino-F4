import { db, batches, projects } from '@/db'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, Upload, Calendar, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { formatDistance } from 'date-fns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BatchesPage() {
  // Get all batches with their projects
  const allBatches = await db.query.batches.findMany({
    orderBy: [desc(batches.createdAt)],
  })

  // Get all projects for the batches
  const batchesWithProjects = await Promise.all(
    allBatches.map(async (batch) => {
      const project = await db.query.projects.findFirst({
        where: (projects, { eq }) => eq(projects.id, batch.projectId),
      })
      return { ...batch, project }
    })
  )

  // Get or create default project for new batch creation
  let defaultProject = await db.query.projects.findFirst({
    orderBy: [desc(projects.createdAt)],
  })

  if (!defaultProject) {
    // Create default project
    const [newProject] = await db.insert(projects).values({
      name: 'Default Project',
      description: 'Auto-created project for batch testing',
      instructions: 'Extract data from the provided URLs',
    }).returning()
    defaultProject = newProject
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-stone-900">Batches</h1>
              <p className="text-sm text-stone-600 mt-1">
                Manage your CSV batches and test runs
              </p>
            </div>
            <Link href={`/projects/${defaultProject.id}/batches/new`}>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {allBatches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <Table className="h-8 w-8 text-stone-600" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                No batches yet
              </h3>
              <p className="text-sm text-stone-600 mb-6 max-w-md mx-auto">
                Upload a CSV file with URLs to start testing. Each batch will run tests on your websites and extract data.
              </p>
              <Link href={`/projects/${defaultProject.id}/batches/new`}>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First CSV
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {batchesWithProjects.map((batch) => (
              <Link key={batch.id} href={`/projects/${batch.projectId}/batches/${batch.id}`}>
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle>{batch.name}</CardTitle>
                          {batch.project && (
                            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                              {batch.project.name}
                            </span>
                          )}
                        </div>
                        <CardDescription>
                          {batch.description || 'No description'}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-stone-900">
                          {batch.totalSites}
                        </div>
                        <div className="text-xs text-stone-500">sites</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-stone-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDistance(batch.createdAt, new Date(), { addSuffix: true })}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-stone-500">
                          {(batch.columnSchema as any[]).length} columns
                        </div>
                        {batch.hasGroundTruth && (
                          <div className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                            Has Ground Truth
                          </div>
                        )}
                      </div>
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
