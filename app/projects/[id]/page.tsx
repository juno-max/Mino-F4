import { db, projects, batches } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Plus, Table, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { formatDistance } from 'date-fns'
import { InstructionVersions } from '@/components/InstructionVersions'

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, params.id),
  })

  if (!project) {
    notFound()
  }

  const projectBatches = await db.query.batches.findMany({
    where: eq(batches.projectId, params.id),
    orderBy: [desc(batches.createdAt)],
  })

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/projects" className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-stone-600 mt-1">{project.description}</p>
              )}
            </div>
            <Link href={`/projects/${params.id}/batches/new`}>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Instructions</CardTitle>
            <CardDescription>Natural language description of what data to extract</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-mono text-sm text-stone-700 bg-stone-50 p-4 rounded-lg border border-stone-200">
              {project.instructions}
            </pre>
          </CardContent>
        </Card>

        {/* Instruction Version History */}
        <InstructionVersions
          projectId={params.id}
          currentInstructions={project.instructions}
        />

        {/* Batches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-900">Batches</h2>
            <Link href={`/projects/${params.id}/batches/new`}>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Batch
              </Button>
            </Link>
          </div>

          {projectBatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Table className="h-12 w-12 text-stone-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-900 mb-2">No batches yet</h3>
                <p className="text-stone-600 mb-6">
                  Upload a CSV file with URLs to start testing this workflow
                </p>
                <Link href={`/projects/${params.id}/batches/new`}>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projectBatches.map((batch) => (
                <Link key={batch.id} href={`/projects/${params.id}/batches/${batch.id}`}>
                  <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{batch.name}</CardTitle>
                          <CardDescription>{batch.description || 'No description'}</CardDescription>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold text-stone-900">{batch.totalSites} sites</div>
                          {batch.hasGroundTruth && (
                            <div className="text-amber-600 text-xs mt-1">
                              Has ground truth
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-stone-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created {formatDistance(batch.createdAt, new Date(), { addSuffix: true })}
                        </div>
                        <div className="text-stone-500">
                          {(batch.columnSchema as any[]).length} columns
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
    </div>
  )
}
