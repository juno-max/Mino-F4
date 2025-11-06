import { NextRequest, NextResponse } from 'next/server'
import { db, batches, projects, jobs } from '@/db'
import { eq } from 'drizzle-orm'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import { parse } from 'csv-parse/sync'

/**
 * POST /api/batches/quick-create
 * Quick-create endpoint for instant CSV → Extraction flow
 * Combines batch creation + job creation + execution start in one call
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()
    const formData = await request.formData()

    const file = formData.get('file') as File
    const batchName = formData.get('batchName') as string
    const projectId = formData.get('projectId') as string
    const instructions = formData.get('instructions') as string
    const mode = formData.get('mode') as string || 'test'
    const testSize = parseInt(formData.get('testSize') as string || '10', 10)

    if (!file || !batchName) {
      return NextResponse.json(
        { error: 'file and batchName are required' },
        { status: 400 }
      )
    }

    // Get or create project
    let project
    if (projectId && projectId !== 'uncategorized') {
      project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      })
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
    } else {
      // Create "Uncategorized" project if it doesn't exist
      const [uncategorized] = await db
        .insert(projects)
        .values({
          organizationId: user.organizationId,
          name: 'Uncategorized',
          instructions: instructions || 'Extract data from websites',
        })
        .onConflictDoNothing()
        .returning()

      project = uncategorized || await db.query.projects.findFirst({
        where: eq(projects.name, 'Uncategorized'),
      })
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Failed to create or find project' },
        { status: 500 }
      )
    }

    // Parse CSV
    const content = await file.text()
    let records: any[]

    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse CSV. Please check file format.' },
        { status: 400 }
      )
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      )
    }

    // Analyze columns
    const columnNames = Object.keys(records[0])
    const urlColumn = columnNames.find(name =>
      ['url', 'website', 'site', 'link', 'web', 'domain', 'page'].some(
        pattern => name.toLowerCase().includes(pattern)
      )
    )

    if (!urlColumn) {
      return NextResponse.json(
        { error: 'No URL column found in CSV' },
        { status: 400 }
      )
    }

    const groundTruthColumns = columnNames.filter(name => {
      const lowerName = name.toLowerCase()
      return (
        lowerName.startsWith('gt_') ||
        lowerName.endsWith('_gt') ||
        lowerName.includes('expected_') ||
        lowerName.includes('ground_truth')
      )
    })

    // Create column schema
    const columnSchema = columnNames.map(name => {
      const isUrl = name === urlColumn
      const isGroundTruth = groundTruthColumns.includes(name)

      return {
        name,
        type: (isUrl ? 'url' : 'text') as 'text' | 'number' | 'url',
        isUrl,
        isGroundTruth,
      }
    })

    // Limit records for test mode
    const sitesToProcess = mode === 'test' ? records.slice(0, testSize) : records

    // Create batch
    const [batch] = await db
      .insert(batches)
      .values({
        organizationId: user.organizationId,
        projectId: project.id,
        name: batchName,
        description: `Quick-start extraction (${mode === 'test' ? 'test' : 'full'})`,
        csvData: records,
        columnSchema,
        hasGroundTruth: groundTruthColumns.length > 0,
        groundTruthColumns,
        totalSites: records.length,
      })
      .returning()

    // Create jobs
    const jobsToCreate = sitesToProcess.map((record, index) => {
      const url = record[urlColumn]
      const groundTruthData = groundTruthColumns.length > 0
        ? Object.fromEntries(groundTruthColumns.map(col => [col, record[col]]))
        : null

      return {
        batchId: batch.id,
        projectId: project.id,
        organizationId: user.organizationId,
        siteUrl: url,
        goal: instructions || project.instructions || 'Extract data from website',
        inputId: `row_${index}`,
        status: 'queued' as const,
        hasGroundTruth: groundTruthColumns.length > 0,
        groundTruthData,
        csvRowData: record,
      }
    })

    await db.insert(jobs).values(jobsToCreate)

    console.log('[Quick-Create Batch]', batch.id, batch.name, `${jobsToCreate.length} jobs`)

    return NextResponse.json({
      id: batch.id,
      projectId: project.id,
      name: batch.name,
      totalJobs: jobsToCreate.length,
      mode,
    })
  } catch (error: any) {
    console.error('Quick-create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create batch' },
      { status: 500 }
    )
  }
}
