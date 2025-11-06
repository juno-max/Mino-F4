import { db, batches, projects } from '@/db'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import { Button } from '@/components/Button'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import { BatchesListClient } from '@/components/batches/BatchesListClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BatchesPage() {
  const user = await getUserWithOrganization()

  // Get all projects for this organization first
  const orgProjects = await db.query.projects.findMany({
    where: eq(projects.organizationId, user.organizationId),
  })
  const orgProjectIds = orgProjects.map(p => p.id)

  // Get all batches that belong to this organization's projects
  const allBatches = await db.query.batches.findMany({
    orderBy: [desc(batches.createdAt)],
  }).then(batchList => batchList.filter(b => orgProjectIds.includes(b.projectId)))

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
      organizationId: user.organizationId,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <BatchesListClient batches={batchesWithProjects} />
      </div>
    </div>
  )
}
