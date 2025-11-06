import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db, executionEvents } from '@/db'
import { and, eq, gte } from 'drizzle-orm'

/**
 * GET /api/events/stream - Server-Sent Events (SSE) endpoint for real-time updates
 *
 * Query parameters:
 * - executionId: Filter events for specific execution
 * - batchId: Filter events for specific batch
 * - jobId: Filter events for specific job
 *
 * This is an alternative to WebSocket for clients that prefer SSE.
 * SSE is simpler but only supports server-to-client communication.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getAuthenticatedUser()
    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const executionId = searchParams.get('executionId') || undefined
    const batchId = searchParams.get('batchId') || undefined
    const jobId = searchParams.get('jobId') || undefined

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection event
        const data = encoder.encode(
          `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`
        )
        controller.enqueue(data)

        // Track last event timestamp
        let lastEventTime = new Date()

        // Poll for new events every 2 seconds
        const interval = setInterval(async () => {
          try {
            // Build query conditions
            const conditions = [gte(executionEvents.timestamp, lastEventTime)]

            if (executionId) {
              conditions.push(eq(executionEvents.executionId, executionId))
            }
            if (batchId) {
              conditions.push(eq(executionEvents.batchId, batchId))
            }
            if (jobId) {
              conditions.push(eq(executionEvents.jobId, jobId))
            }

            // Fetch new events since last poll
            const newEvents = await db.query.executionEvents.findMany({
              where: and(...conditions),
              orderBy: (events, { asc }) => [asc(events.timestamp)],
              limit: 100,
            })

            // Send each event to client
            for (const event of newEvents) {
              const eventData = {
                type: event.type,
                timestamp: event.timestamp,
                data: event.data,
                executionId: event.executionId,
                batchId: event.batchId,
                jobId: event.jobId,
              }

              const message = encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`)
              controller.enqueue(message)

              // Update last event time
              const eventTime = new Date(event.timestamp)
              if (eventTime > lastEventTime) {
                lastEventTime = eventTime
              }
            }

            // Send heartbeat every 30 seconds
            const timeSinceLastEvent = Date.now() - lastEventTime.getTime()
            if (timeSinceLastEvent > 30000) {
              const heartbeat = encoder.encode(
                `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`
              )
              controller.enqueue(heartbeat)
            }
          } catch (error) {
            console.error('[SSE] Error fetching events:', error)
            // Don't close stream on error - keep trying
          }
        }, 2000)

        // Clean up on connection close
        request.signal.addEventListener('abort', () => {
          clearInterval(interval)
          controller.close()
          console.log('[SSE] Client disconnected')
        })
      },
    })

    // Return SSE response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering in nginx
      },
    })
  } catch (error) {
    console.error('[API /api/events/stream] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
