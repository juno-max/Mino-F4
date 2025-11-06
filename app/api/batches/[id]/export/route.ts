import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { jobs, exports } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { generateCSV, generateJSON, generateExcel } from '@/lib/export-processor'
import { validateRequest, validateParams, handleApiError, errorResponse } from '@/lib/api-helpers'
import { exportSchema, batchIdSchema } from '@/lib/validation-schemas'

/**
 * POST /api/batches/[id]/export
 * Create and download an export immediately
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate route parameters
    const paramsValidation = await validateParams(params, batchIdSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id: batchId } = paramsValidation.data

    // Validate request body
    const bodyValidation = await validateRequest(request, exportSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    const {
      format,
      columns,
      includeGroundTruth,
      includeComparison,
      filters,
    } = bodyValidation.data

    // Build query conditions
    const conditions: any[] = [eq(jobs.batchId, batchId)]

    if (filters?.status && filters.status.length > 0) {
      conditions.push(inArray(jobs.status, filters.status))
    }

    if (filters?.hasGroundTruth !== undefined) {
      conditions.push(eq(jobs.hasGroundTruth, filters.hasGroundTruth))
    }

    // Fetch jobs with sessions
    const jobsToExport = await db.query.jobs.findMany({
      where: and(...conditions),
      with: {
        sessions: {
          orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
          limit: 1,
        },
      },
    })

    if (jobsToExport.length === 0) {
      return errorResponse(
        'No jobs found matching filters',
        'NO_JOBS_FOUND',
        400
      )
    }

    // Determine columns to export
    let columnsToExport = columns || []
    if (columnsToExport.length === 0 && jobsToExport.length > 0) {
      // Auto-detect columns from first job's extracted data
      const firstSession = jobsToExport[0].sessions[0]
      if (firstSession?.extractedData) {
        columnsToExport = Object.keys(firstSession.extractedData as object)
      }
    }

    const config = {
      columns: columnsToExport,
      includeGroundTruth: includeGroundTruth || false,
      includeComparison: includeComparison || false,
    }

    // Generate export file
    let fileBuffer: Buffer
    let contentType: string
    let filename: string

    // Generate export file based on format (format is validated by Zod)
    if (format === 'csv') {
      fileBuffer = await generateCSV(jobsToExport as any, config)
      contentType = 'text/csv'
      filename = `export-${batchId}.csv`
    } else if (format === 'json') {
      fileBuffer = await generateJSON(jobsToExport as any, config)
      contentType = 'application/json'
      filename = `export-${batchId}.json`
    } else {
      // format === 'xlsx' (other formats already validated by Zod)
      fileBuffer = await generateExcel(jobsToExport as any, config)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = `export-${batchId}.xlsx`
    }

    // Track export in database (optional, for audit)
    try {
      await db.insert(exports).values({
        batchId,
        exportType: 'data',
        format,
        config: {
          columns: columnsToExport,
          includeGroundTruth,
          includeComparison,
          filters,
        },
        fileSize: fileBuffer.length,
        rowCount: jobsToExport.length,
        status: 'completed',
        completedAt: new Date(),
      })
    } catch (error) {
      console.error('Failed to track export:', error)
      // Continue anyway
    }

    // Return file
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return handleApiError(error)
  }
}

/**
 * GET /api/batches/[id]/export/history
 * Get export history for this batch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate route parameters
    const paramsValidation = await validateParams(params, batchIdSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    const { id: batchId } = paramsValidation.data

    const exportHistory = await db.query.exports.findMany({
      where: eq(exports.batchId, batchId),
      orderBy: (exports, { desc }) => [desc(exports.createdAt)],
      limit: 20,
    })

    return NextResponse.json(exportHistory)
  } catch (error) {
    console.error('Get export history error:', error)
    return handleApiError(error)
  }
}
