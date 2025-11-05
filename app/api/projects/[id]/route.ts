import { NextRequest, NextResponse } from 'next/server'
import { db, projects } from '@/db'
import { eq } from 'drizzle-orm'
import { validateRequest, validateParams, handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { updateProjectSchema, projectIdSchema } from '@/lib/validation-schemas'

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate route parameters
    const paramsValidation = await validateParams(params, projectIdSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id } = paramsValidation.data

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    })

    if (!project) {
      return notFoundResponse('Project')
    }

    return NextResponse.json(project, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching project:', error)
    return handleApiError(error)
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate route parameters
    const paramsValidation = await validateParams(params, projectIdSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id } = paramsValidation.data

    // Validate request body
    const bodyValidation = await validateRequest(request, updateProjectSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    const { name, description, instructions } = bodyValidation.data

    const [updatedProject] = await db
      .update(projects)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(instructions && { instructions }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning()

    if (!updatedProject) {
      return notFoundResponse('Project')
    }

    return NextResponse.json(updatedProject, { headers: corsHeaders })
  } catch (error) {
    console.error('Error updating project:', error)
    return handleApiError(error)
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate route parameters
    const paramsValidation = await validateParams(params, projectIdSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id } = paramsValidation.data

    await db.delete(projects).where(eq(projects.id, id))

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error deleting project:', error)
    return handleApiError(error)
  }
}
