import { NextRequest, NextResponse } from 'next/server'
import { db, executions } from '@/db'
import { eq, desc } from 'drizzle-orm'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/projects/[id]/executions - Get all executions for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const allExecutions = await db.query.executions.findMany({
      where: eq(executions.projectId, params.id),
      orderBy: [desc(executions.createdAt)],
    })

    return NextResponse.json(allExecutions, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error fetching executions:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch executions' },
      { status: 500, headers: corsHeaders }
    )
  }
}
