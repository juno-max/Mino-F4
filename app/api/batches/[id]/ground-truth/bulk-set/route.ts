import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { jobs } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { validateRequest, validateParams, handleApiError } from '@/lib/api-helpers'
import { bulkSetGTSchema, batchIdSchema } from '@/lib/validation-schemas'

interface BulkSetGroundTruthResponse {
  success: number
  failed: number
  errors: Array<{ jobId: string; error: string }>
}

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
    const bodyValidation = await validateRequest(request, bulkSetGTSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    const { updates } = bodyValidation.data

    const results: BulkSetGroundTruthResponse = {
      success: 0,
      failed: 0,
      errors: [],
    }

    // Process updates in a transaction for atomicity
    await db.transaction(async (tx) => {
      for (const update of updates) {
        try {
          await tx
            .update(jobs)
            .set({
              groundTruthData: update.groundTruthData,
              groundTruthMetadata: {
                setBy: 'bulk_import',
                setAt: new Date().toISOString(),
                source: 'bulk_edit',
                confidence: 1.0,
              },
              hasGroundTruth: true,
              updatedAt: new Date(),
            })
            .where(eq(jobs.id, update.jobId))

          results.success++
        } catch (error: any) {
          results.failed++
          results.errors.push({
            jobId: update.jobId,
            error: error.message,
          })
        }
      }
    })

    // TODO: Trigger metrics recalculation asynchronously
    // recalculateColumnMetrics(batchId).catch(console.error)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Bulk set ground truth error:', error)
    return handleApiError(error)
  }
}
