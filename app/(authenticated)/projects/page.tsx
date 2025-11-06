import { db, projects } from '@/db'
import { desc, eq } from 'drizzle-orm'
import { ProjectsClient } from './ProjectsClient'
import { getUserWithOrganization } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProjectsPage() {
  let allProjects: any[] = []

  try {
    // Get authenticated user with organization
    const user = await getUserWithOrganization()

    // Fetch all projects for the user's organization
    allProjects = await db.query.projects.findMany({
      where: eq(projects.organizationId, user.organizationId),
      orderBy: [desc(projects.updatedAt)],
    })
  } catch (error) {
    console.error('Database error:', error)
  }

  return <ProjectsClient projects={allProjects} />
}
