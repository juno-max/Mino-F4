import { db, projects, batches, jobs } from '@/db'
import { eq, desc, sql } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { ProjectDetailClient } from './ProjectDetailClient'
import { getUserWithOrganization } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  try {
    // Get authenticated user
    const user = await getUserWithOrganization()

    // Fetch project
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, params.id),
    })

    if (!project) {
      notFound()
    }

    // Ensure user has access to this project
    if (project.organizationId !== user.organizationId) {
      notFound()
    }

    // Fetch all batches for this project with job stats
    const projectBatches = await db.query.batches.findMany({
      where: eq(batches.projectId, params.id),
      orderBy: [desc(batches.updatedAt)],
      with: {
        jobs: true,
      },
    })

    // Calculate stats for each batch
    const batchesWithStats = projectBatches.map(batch => {
      const batchJobs = batch.jobs || []
      const totalJobs = batchJobs.length
      const completedJobs = batchJobs.filter(j => j.status === 'completed').length
      const runningJobs = batchJobs.filter(j => j.status === 'running').length
      const failedJobs = batchJobs.filter(j => j.status === 'failed').length
      const queuedJobs = batchJobs.filter(j => j.status === 'queued').length

      // Calculate pass rate if GT exists
      let passRate: number | null = null
      if (batch.hasGroundTruth && completedJobs > 0) {
        const evaluatedJobs = batchJobs.filter(j => j.isEvaluated && j.evaluationResult !== null)
        if (evaluatedJobs.length > 0) {
          const passedJobs = evaluatedJobs.filter(j => j.evaluationResult === 'pass').length
          passRate = Math.round((passedJobs / evaluatedJobs.length) * 100)
        }
      }

      // Determine status
      let status: 'running' | 'completed' | 'failed' | 'queued' | 'idle' = 'idle'
      if (runningJobs > 0) status = 'running'
      else if (failedJobs > 0 && completedJobs === 0) status = 'failed'
      else if (completedJobs === totalJobs && totalJobs > 0) status = 'completed'
      else if (queuedJobs > 0) status = 'queued'

      // Calculate completion percentage
      const completionPercentage = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0

      return {
        ...batch,
        stats: {
          totalJobs,
          completedJobs,
          runningJobs,
          failedJobs,
          queuedJobs,
          passRate,
          completionPercentage,
        },
        status,
      }
    })

    return (
      <ProjectDetailClient
        project={project}
        batches={batchesWithStats}
      />
    )
  } catch (error) {
    console.error('Error loading project:', error)
    notFound()
  }
}
