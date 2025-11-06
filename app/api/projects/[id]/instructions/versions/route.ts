import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, instructionVersions } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

/**
 * GET /api/projects/[id]/instructions/versions
 * List all instruction versions for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const versions = await db.query.instructionVersions.findMany({
      where: eq(instructionVersions.projectId, projectId),
      orderBy: [desc(instructionVersions.versionNumber)],
    })

    // Get project for current production instructions
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    return NextResponse.json({
      versions,
      currentInstructions: project?.instructions,
    })
  } catch (error: any) {
    console.error('Get versions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get versions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[id]/instructions/versions
 * Create a new instruction version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()

    const { instructions, changeDescription, setAsProduction = false } = body

    if (!instructions) {
      return NextResponse.json(
        { error: 'Instructions required' },
        { status: 400 }
      )
    }

    // Get latest version number
    const latestVersion = await db.query.instructionVersions.findFirst({
      where: eq(instructionVersions.projectId, projectId),
      orderBy: [desc(instructionVersions.versionNumber)],
    })

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1

    // Create version
    const [version] = await db
      .insert(instructionVersions)
      .values({
        projectId,
        instructions,
        versionNumber: nextVersionNumber,
        changeDescription: changeDescription || null,
      })
      .returning()

    // Update project if setting as production
    if (setAsProduction) {
      await db
        .update(projects)
        .set({ instructions, updatedAt: new Date() })
        .where(eq(projects.id, projectId))
    }

    return NextResponse.json({
      success: true,
      version,
    })
  } catch (error: any) {
    console.error('Create version error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create version' },
      { status: 500 }
    )
  }
}
