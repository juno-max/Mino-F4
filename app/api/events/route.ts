import { NextRequest, NextResponse } from 'next/server'
import { db, executionEvents } from '@/db'
import { and, eq, gte, lte, desc, or } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

/**
 * GET /api/events - Fetch execution events for replay/history
 *
 * Query parameters:
 * - executionId: Filter by execution ID
 * - batchId: Filter by batch ID
 * - jobId: Filter by job ID
 * - type: Filter by event type (comma-separated)
 * - since: ISO timestamp - get events after this time
 * - until: ISO timestamp - get events before this time
 * - limit: Max number of events (default 100, max 1000)
 * - offset: Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getAuthenticatedUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const executionId = searchParams.get('executionId') || undefined
    const batchId = searchParams.get('batchId') || undefined
    const jobId = searchParams.get('jobId') || undefined
    const typeParam = searchParams.get('type') || undefined
    const since = searchParams.get('since') || undefined
    const until = searchParams.get('until') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Parse event types
    const eventTypes = typeParam ? typeParam.split(',') : undefined

    // Build query conditions
    const conditions = []

    if (executionId) {
      conditions.push(eq(executionEvents.executionId, executionId))
    }

    if (batchId) {
      conditions.push(eq(executionEvents.batchId, batchId))
    }

    if (jobId) {
      conditions.push(eq(executionEvents.jobId, jobId))
    }

    if (eventTypes && eventTypes.length > 0) {
      conditions.push(
        or(...eventTypes.map(type => eq(executionEvents.type, type)))
      )
    }

    if (since) {
      conditions.push(gte(executionEvents.timestamp, new Date(since)))
    }

    if (until) {
      conditions.push(lte(executionEvents.timestamp, new Date(until)))
    }

    // Fetch events
    const events = await db.query.executionEvents.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(executionEvents.timestamp)],
      limit,
      offset,
    })

    // Get total count for pagination
    const totalCount = await db
      .select()
      .from(executionEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .then(rows => rows.length)

    return NextResponse.json({
      events: events.map(event => ({
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        data: event.data,
        executionId: event.executionId,
        batchId: event.batchId,
        jobId: event.jobId,
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + events.length < totalCount,
      },
    })
  } catch (error) {
    console.error('[API /api/events] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/events - Clean up old events (admin only)
 *
 * Query parameters:
 * - olderThan: ISO timestamp - delete events older than this
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getAuthenticatedUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Add admin check here

    const searchParams = request.nextUrl.searchParams
    const olderThan = searchParams.get('olderThan')

    if (!olderThan) {
      return NextResponse.json(
        { error: 'olderThan parameter required' },
        { status: 400 }
      )
    }

    // Delete old events
    const result = await db
      .delete(executionEvents)
      .where(lte(executionEvents.timestamp, new Date(olderThan)))
      .returning()

    return NextResponse.json({
      deleted: result.length,
      message: `Deleted ${result.length} events older than ${olderThan}`,
    })
  } catch (error) {
    console.error('[API /api/events DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete events' },
      { status: 500 }
    )
  }
}
