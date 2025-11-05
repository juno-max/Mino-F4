import { NextRequest, NextResponse } from 'next/server'
import { db, projects } from '@/db'
import { eq } from 'drizzle-orm'
import { validateRequest, handleApiError, errorResponse } from '@/lib/api-helpers'
import { createProjectSchema } from '@/lib/validation-schemas'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const allProjects = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    })

    return NextResponse.json(allProjects, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return handleApiError(error)
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, createProjectSchema)
    if (!validation.success) {
      return validation.response
    }
    const { name, description, instructions } = validation.data

    const [project] = await db.insert(projects).values({
      name,
      description: description || null,
      instructions,
    }).returning()

    return NextResponse.json(project, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error('Error creating project:', error)
    return handleApiError(error)
  }
}
