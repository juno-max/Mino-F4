import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { organizations, users, projects, jobs } from '@/db/schema'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/api-helpers'
import { eq, and, gte } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * GET /api/account/organization
 * Get current user's organization details and usage stats
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()

    // Get organization details with owner info
    const [orgData] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        plan: organizations.plan,
        maxProjects: organizations.maxProjects,
        maxJobsPerMonth: organizations.maxJobsPerMonth,
        createdAt: organizations.createdAt,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.ownerId, users.id))
      .where(eq(organizations.id, user.organizationId))

    if (!orgData) {
      return NextResponse.json(
        { error: { message: 'Organization not found' } },
        { status: 404 }
      )
    }

    // Count current projects
    const [projectsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.organizationId, user.organizationId))

    // Count jobs for current month
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const [jobsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(
        and(
          eq(jobs.organizationId, user.organizationId),
          gte(jobs.createdAt, firstDayOfMonth)
        )
      )

    return NextResponse.json({
      organization: {
        id: orgData.id,
        name: orgData.name,
        slug: orgData.slug,
        plan: orgData.plan,
        maxProjects: orgData.maxProjects,
        maxJobsPerMonth: orgData.maxJobsPerMonth,
        currentProjectsCount: projectsCount?.count || 0,
        currentMonthJobsCount: jobsCount?.count || 0,
        createdAt: orgData.createdAt,
        owner: {
          name: orgData.ownerName,
          email: orgData.ownerEmail,
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
