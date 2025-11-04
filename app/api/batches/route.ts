import { NextRequest, NextResponse } from 'next/server'
import { db, batches, projects } from '@/db'
import { eq, and } from 'drizzle-orm'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/batches?project_id={id} - List batches for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json(
        { message: 'project_id query parameter is required' },
        { status: 400 }
      )
    }

    const projectBatches = await db.query.batches.findMany({
      where: eq(batches.projectId, projectId),
      orderBy: (batches, { desc }) => [desc(batches.createdAt)],
    })

    return NextResponse.json(projectBatches, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error fetching batches:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch batches' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/batches - Create a new batch from CSV upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const project_id = formData.get('project_id') as string
    const name = formData.get('name') as string
    const goal = formData.get('goal') as string
    const csv_file = formData.get('csv_file') as File

    if (!project_id || !name || !csv_file) {
      return NextResponse.json(
        { message: 'project_id, name, and csv_file are required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, project_id),
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      )
    }

    // Parse CSV file
    const csvText = await csv_file.text()
    const lines = csvText.trim().split('\n')

    if (lines.length === 0) {
      return NextResponse.json(
        { message: 'CSV file is empty' },
        { status: 400 }
      )
    }

    // Extract headers
    const headers = lines[0].split(',').map(h => h.trim())

    // Parse CSV rows
    const csvData = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim())
      const row: any = { id: `row_${index}` }
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      return row
    })

    // Create column schema
    const columnSchema = headers.map(header => {
      const lowerHeader = header.toLowerCase()
      const isUrl = lowerHeader.includes('url') || lowerHeader.includes('website')
      const isGroundTruth = lowerHeader.startsWith('gt_') || lowerHeader.endsWith('_gt')

      return {
        name: header,
        type: (isUrl ? 'url' : 'text') as 'text' | 'number' | 'url',
        isUrl,
        isGroundTruth,
      }
    })

    // Calculate ground truth status
    const gtColumns = columnSchema.filter(c => c.isGroundTruth)
    const hasGroundTruth = gtColumns.length > 0

    const [batch] = await db.insert(batches).values({
      projectId: project_id,
      name,
      description: goal || null,
      csvData,
      columnSchema,
      hasGroundTruth,
      groundTruthColumns: gtColumns.map(c => c.name),
      totalSites: csvData.length,
    }).returning()

    console.log('[Batch Created]', batch.id, batch.name)
    return NextResponse.json(batch, { status: 201, headers: corsHeaders })
  } catch (error: any) {
    console.error('Error creating batch:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to create batch' },
      { status: 500, headers: corsHeaders }
    )
  }
}
