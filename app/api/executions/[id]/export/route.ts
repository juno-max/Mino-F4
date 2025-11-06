import { NextRequest, NextResponse } from 'next/server'
import { db, executions, jobs } from '@/db'
import { eq } from 'drizzle-orm'
import { handleApiError } from '@/lib/api-helpers'

/**
 * GET /api/executions/[id]/export
 * Export execution results as CSV
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = params.id

    // Get execution
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    })

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      )
    }

    // Get all jobs for this batch
    const batchJobs = await db.query.jobs.findMany({
      where: eq(jobs.batchId, execution.batchId),
    })

    // Generate CSV
    const headers = [
      'Job ID',
      'Site Name',
      'Site URL',
      'Status',
      'Evaluation Result',
      'Duration (ms)',
      'Progress (%)',
      'Error Message',
      'Started At',
      'Completed At',
    ]

    // Get all unique column names from extracted data
    const allColumns = new Set<string>()
    batchJobs.forEach(job => {
      const extractedData = (job as any).extractedData
      if (extractedData && typeof extractedData === 'object') {
        Object.keys(extractedData as Record<string, any>).forEach(key => allColumns.add(key))
      }
    })

    // Add extracted data columns
    const extractedColumns = Array.from(allColumns).sort()
    headers.push(...extractedColumns.map(col => `Extracted: ${col}`))

    // Add ground truth columns
    headers.push(...extractedColumns.map(col => `Expected: ${col}`))

    // Build CSV rows
    const rows = batchJobs.map(_job => {
      const job = _job as any
      const extractedData = (job.extractedData as Record<string, any>) || {}
      const groundTruthData = (job.groundTruthData as Record<string, any>) || {}

      const row = [
        job.id,
        job.siteName || '',
        job.siteUrl,
        job.status,
        job.evaluationResult || '',
        job.executionDurationMs?.toString() || '',
        job.progressPercentage?.toString() || '0',
        job.errorMessage || '',
        job.startedAt?.toISOString() || '',
        job.completedAt?.toISOString() || '',
      ]

      // Add extracted data values
      extractedColumns.forEach(col => {
        const value = extractedData[col]
        row.push(formatCsvValue(value))
      })

      // Add ground truth values
      extractedColumns.forEach(col => {
        const value = groundTruthData[col]
        row.push(formatCsvValue(value))
      })

      return row
    })

    // Convert to CSV format
    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="execution-${executionId}-results.csv"`,
      },
    })
  } catch (error) {
    console.error('[Export] Error:', error)
    return handleApiError(error)
  }
}

function formatCsvValue(value: any): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
