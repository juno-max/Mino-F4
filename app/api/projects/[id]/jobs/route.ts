import { NextRequest, NextResponse } from 'next/server'
import { db, jobs } from '@/db'
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

// GET /api/projects/[id]/jobs - Get all jobs for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const allJobs = await db.query.jobs.findMany({
      where: eq(jobs.projectId, params.id),
      orderBy: [desc(jobs.createdAt)],
    })

    return NextResponse.json(allJobs, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error fetching jobs:', error)

    // If it's a column doesn't exist error (old schema), return empty array
    // Check both error.message and error.cause (for Drizzle/Postgres errors)
    const errorMessage = error.message || ''
    const causeMessage = error.cause?.message || ''
    const causeCode = error.cause?.code || ''

    if (
      errorMessage.includes('csv_row_data') ||
      errorMessage.includes('does not exist') ||
      causeMessage.includes('csv_row_data') ||
      causeMessage.includes('does not exist') ||
      causeCode === '42703' // Postgres error code for "column does not exist"
    ) {
      console.log('Old schema detected for project', params.id, '- returning empty jobs array')
      return NextResponse.json([], { headers: corsHeaders })
    }

    return NextResponse.json(
      { message: error.message || 'Failed to fetch jobs' },
      { status: 500, headers: corsHeaders }
    )
  }
}
