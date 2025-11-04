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

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const allProjects = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    })

    return NextResponse.json(allProjects, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch projects' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, instructions } = body

    if (!name || !instructions) {
      return NextResponse.json(
        { message: 'Name and instructions are required' },
        { status: 400 }
      )
    }

    const [project] = await db.insert(projects).values({
      name,
      description: description || null,
      instructions,
    }).returning()

    return NextResponse.json(project, { status: 201, headers: corsHeaders })
  } catch (error: any) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to create project' },
      { status: 500, headers: corsHeaders }
    )
  }
}
