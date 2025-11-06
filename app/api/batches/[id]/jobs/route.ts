import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { jobs } from '@/db/schema'
import { eq, and, inArray, sql, lt, desc } from 'drizzle-orm'
import { paginatedResponse } from '@/lib/api-helpers'

/**
 * GET /api/batches/[id]/jobs?status=error,completed&hasGroundTruth=true&accuracyMin=50&accuracyMax=80&limit=50&cursor=abc123
 * Get filtered jobs for a batch with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params
    const searchParams = request.nextUrl.searchParams

    // Check if only stats are requested
    const statsOnly = searchParams.get('statsOnly') === 'true'

    if (statsOnly) {
      // Return just the job status counts
      const allJobs = await db.query.jobs.findMany({
        where: eq(jobs.batchId, batchId),
      })

      const stats = {
        total: allJobs.length,
        queued: allJobs.filter(j => j.status === 'queued').length,
        running: allJobs.filter(j => j.status === 'running').length,
        completed: allJobs.filter(j => j.status === 'completed').length,
        error: allJobs.filter(j => j.status === 'error').length,
      }

      return NextResponse.json({ stats })
    }

    // Parse pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const cursor = searchParams.get('cursor') || null

    // Parse filters from query string
    const statusFilter = searchParams.get('status')?.split(',') || []
    const hasGroundTruthFilter = searchParams.get('hasGroundTruth')
    const evaluationResultFilter = searchParams.get('evaluationResult')?.split(',') || []
    const accuracyMin = searchParams.get('accuracyMin')
    const accuracyMax = searchParams.get('accuracyMax')
    const searchQuery = searchParams.get('search') || ''

    // Build where conditions
    const conditions: any[] = [eq(jobs.batchId, batchId)]

    // Add cursor condition for pagination
    if (cursor) {
      conditions.push(lt(jobs.id, cursor))
    }

    if (statusFilter.length > 0) {
      conditions.push(inArray(jobs.status, statusFilter))
    }

    if (hasGroundTruthFilter !== null) {
      conditions.push(eq(jobs.hasGroundTruth, hasGroundTruthFilter === 'true'))
    }

    if (evaluationResultFilter.length > 0) {
      conditions.push(inArray(jobs.evaluationResult as any, evaluationResultFilter))
    }

    // Fetch jobs with sessions (fetch limit + 1 to check for more)
    const allJobs = await db.query.jobs.findMany({
      where: and(...conditions),
      orderBy: [desc(jobs.createdAt)],
      limit: limit + 1,
      with: {
        sessions: {
          orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
          limit: 1,
        },
      },
    })

    // Apply client-side filters (accuracy, search)
    let filteredJobs = allJobs

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredJobs = filteredJobs.filter(job => {
        return (
          job.siteUrl.toLowerCase().includes(query) ||
          job.inputId.toLowerCase().includes(query) ||
          (job.siteName && job.siteName.toLowerCase().includes(query))
        )
      })
    }

    // Accuracy range filter
    if (accuracyMin || accuracyMax) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.hasGroundTruth || !job.isEvaluated) return false

        const latestSession = job.sessions[0]
        if (!latestSession?.extractedData || !job.groundTruthData) return false

        const extractedData = latestSession.extractedData as Record<string, any>
        const gtData = job.groundTruthData as Record<string, any>

        const gtFields = Object.keys(gtData)
        if (gtFields.length === 0) return false

        const matches = gtFields.filter(field => {
          const extracted = String(extractedData[field] || '').toLowerCase().trim()
          const expected = String(gtData[field] || '').toLowerCase().trim()
          return extracted === expected
        }).length

        const accuracy = (matches / gtFields.length) * 100

        const min = accuracyMin ? parseFloat(accuracyMin) : 0
        const max = accuracyMax ? parseFloat(accuracyMax) : 100

        return accuracy >= min && accuracy <= max
      })
    }

    // Use pagination helper to format response
    const paginationData = paginatedResponse(filteredJobs, limit)

    return NextResponse.json({
      data: paginationData.data,
      pagination: paginationData.pagination,
      filters: {
        status: statusFilter,
        hasGroundTruth: hasGroundTruthFilter,
        evaluationResult: evaluationResultFilter,
        accuracyMin,
        accuracyMax,
        search: searchQuery,
      },
    })
  } catch (error: any) {
    console.error('Get jobs error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get jobs' },
      { status: 500 }
    )
  }
}
