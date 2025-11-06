import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { jobs } from '@/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

interface BulkEditGroundTruthRequest {
  jobIds: string[]
  fieldName: string
  operation: 'set' | 'clear' | 'copy_from_extracted'
  value?: any // For 'set' operation
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params
    const body: BulkEditGroundTruthRequest = await request.json()
    const { jobIds, fieldName, operation, value } = body

    if (!jobIds || jobIds.length === 0) {
      return NextResponse.json(
        { error: 'No job IDs provided' },
        { status: 400 }
      )
    }

    if (!fieldName) {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      )
    }

    let updatedCount = 0

    if (operation === 'set') {
      if (value === undefined) {
        return NextResponse.json(
          { error: 'Value is required for set operation' },
          { status: 400 }
        )
      }

      // Set specific field to a value across multiple jobs
      const result = await db
        .update(jobs)
        .set({
          groundTruthData: sql`jsonb_set(
            COALESCE(ground_truth_data, '{}'::jsonb),
            ${`{${fieldName}}`}::text[],
            ${JSON.stringify(value)}::jsonb
          )`,
          hasGroundTruth: true,
          updatedAt: new Date(),
        })
        .where(inArray(jobs.id, jobIds))

      updatedCount = jobIds.length

    } else if (operation === 'clear') {
      // Remove specific field from ground truth
      const result = await db
        .update(jobs)
        .set({
          groundTruthData: sql`ground_truth_data - ${fieldName}`,
          updatedAt: new Date(),
        })
        .where(inArray(jobs.id, jobIds))

      updatedCount = jobIds.length

    } else if (operation === 'copy_from_extracted') {
      // Copy from most recent session's extracted data
      const jobsWithSessions = await db.query.jobs.findMany({
        where: inArray(jobs.id, jobIds),
        with: {
          sessions: {
            orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
            limit: 1,
          },
        },
      })

      // Update each job individually
      for (const job of jobsWithSessions) {
        const latestSession = job.sessions[0]
        if (latestSession?.extractedData && latestSession.extractedData[fieldName] !== undefined) {
          await db
            .update(jobs)
            .set({
              groundTruthData: sql`jsonb_set(
                COALESCE(ground_truth_data, '{}'::jsonb),
                ${`{${fieldName}}`}::text[],
                ${JSON.stringify(latestSession.extractedData[fieldName])}::jsonb
              )`,
              hasGroundTruth: true,
              updatedAt: new Date(),
            })
            .where(eq(jobs.id, job.id))

          updatedCount++
        }
      }
    } else {
      return NextResponse.json(
        { error: `Invalid operation: ${operation}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      operation,
      fieldName,
    })
  } catch (error: any) {
    console.error('Bulk edit ground truth error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to edit ground truth' },
      { status: 500 }
    )
  }
}
