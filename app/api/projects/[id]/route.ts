import { NextRequest, NextResponse } from 'next/server'
import { db, projects } from '@/db'
import { eq } from 'drizzle-orm'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, params.id),
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json(project, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch project' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, instructions } = body

    const [updatedProject] = await db
      .update(projects)
      .set({
        name,
        description: description || null,
        instructions,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, params.id))
      .returning()

    if (!updatedProject) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json(updatedProject, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to update project' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(projects).where(eq(projects.id, params.id))

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to delete project' },
      { status: 500, headers: corsHeaders }
    )
  }
}
