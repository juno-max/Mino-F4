import { NextResponse } from 'next/server'
import { db, projects, batches, jobs } from '@/db'
import { desc, eq, and, sql, count } from 'drizzle-orm'
import { getUserWithOrganization } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface BatchMetrics {
  totalJobs: number
  completedJobs: number
  runningJobs: number
  errorJobs: number
  accuracy: number
  health: 'excellent' | 'good' | 'warning' | 'error'
}

interface BatchNode {
  id: string
  name: string
  projectId: string
  type: 'batch'
  metrics: BatchMetrics
  createdAt: Date
  updatedAt: Date
}

interface ProjectNode {
  id: string
  name: string
  description: string | null
  type: 'project'
  batches: BatchNode[]
  metrics: {
    totalBatches: number
    totalJobs: number
    completedJobs: number
    runningJobs: number
    accuracy: number
    health: 'excellent' | 'good' | 'warning' | 'error'
  }
  createdAt: Date
  updatedAt: Date
}

export async function GET() {
  try {
    // Get authenticated user with organization
    const user = await getUserWithOrganization()

    // Fetch all projects for the user's organization
    const allProjects = await db.query.projects.findMany({
      where: eq(projects.organizationId, user.organizationId),
      orderBy: [desc(projects.updatedAt)],
    })

    // Build tree with metrics
    const tree: ProjectNode[] = await Promise.all(
      allProjects.map(async (project) => {
        // Fetch batches for this project
        const projectBatches = await db.query.batches.findMany({
          where: eq(batches.projectId, project.id),
          orderBy: [desc(batches.createdAt)],
        })

        // Calculate metrics for each batch
        const batchNodes: BatchNode[] = await Promise.all(
          projectBatches.map(async (batch) => {
            // Get job stats for this batch
            const jobStats = await db
              .select({
                totalJobs: count(),
                completedJobs: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'completed' THEN 1 END)`,
                runningJobs: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'running' THEN 1 END)`,
                errorJobs: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'error' THEN 1 END)`,
              })
              .from(jobs)
              .where(eq(jobs.batchId, batch.id))
              .then(rows => rows[0] || { totalJobs: 0, completedJobs: 0, runningJobs: 0, errorJobs: 0 })

            // Calculate accuracy (completed success rate)
            const accuracy = jobStats.totalJobs > 0
              ? Math.round(((jobStats.completedJobs - jobStats.errorJobs) / jobStats.totalJobs) * 100)
              : 0

            // Determine health
            let health: 'excellent' | 'good' | 'warning' | 'error' = 'excellent'
            if (accuracy < 70) health = 'error'
            else if (accuracy < 85) health = 'warning'
            else if (accuracy < 95) health = 'good'

            return {
              id: batch.id,
              name: batch.name,
              projectId: project.id,
              type: 'batch' as const,
              metrics: {
                totalJobs: Number(jobStats.totalJobs),
                completedJobs: Number(jobStats.completedJobs),
                runningJobs: Number(jobStats.runningJobs),
                errorJobs: Number(jobStats.errorJobs),
                accuracy,
                health,
              },
              createdAt: batch.createdAt,
              updatedAt: batch.updatedAt,
            }
          })
        )

        // Calculate project-level metrics (aggregate from batches)
        const projectMetrics = batchNodes.reduce(
          (acc, batch) => ({
            totalBatches: acc.totalBatches + 1,
            totalJobs: acc.totalJobs + batch.metrics.totalJobs,
            completedJobs: acc.completedJobs + batch.metrics.completedJobs,
            runningJobs: acc.runningJobs + batch.metrics.runningJobs,
            accuracy: 0, // Will calculate after
          }),
          { totalBatches: 0, totalJobs: 0, completedJobs: 0, runningJobs: 0, accuracy: 0 }
        )

        // Calculate overall project accuracy
        projectMetrics.accuracy = projectMetrics.totalJobs > 0
          ? Math.round((projectMetrics.completedJobs / projectMetrics.totalJobs) * 100)
          : 0

        // Determine project health
        let projectHealth: 'excellent' | 'good' | 'warning' | 'error' = 'excellent'
        if (projectMetrics.accuracy < 70) projectHealth = 'error'
        else if (projectMetrics.accuracy < 85) projectHealth = 'warning'
        else if (projectMetrics.accuracy < 95) projectHealth = 'good'

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          type: 'project' as const,
          batches: batchNodes,
          metrics: {
            ...projectMetrics,
            health: projectHealth,
          },
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        }
      })
    )

    return NextResponse.json({ tree })
  } catch (error) {
    console.error('Error fetching navigation tree:', error)
    return NextResponse.json(
      { error: 'Failed to fetch navigation tree' },
      { status: 500 }
    )
  }
}
