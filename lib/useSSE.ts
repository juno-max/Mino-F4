'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { ExecutionEvent } from './execution-events'

export interface SSEStatus {
  connected: boolean
  reconnecting: boolean
  error: string | null
}

export interface UseSSEReturn {
  status: SSEStatus
  events: ExecutionEvent[]
  subscribe: (callback: (event: ExecutionEvent) => void) => () => void
  clearEvents: () => void
}

interface UseSSEOptions {
  executionId?: string
  batchId?: string
  jobId?: string
}

const RECONNECT_DELAY = 3000 // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10

/**
 * Custom React hook for Server-Sent Events (SSE) connection
 *
 * Alternative to WebSocket for simpler, server-to-client only communication.
 * Advantages: Simpler, works through more proxies, auto-reconnects
 * Disadvantages: Unidirectional, less efficient than WebSocket
 */
export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const [status, setStatus] = useState<SSEStatus>({
    connected: false,
    reconnecting: false,
    error: null,
  })
  const [events, setEvents] = useState<ExecutionEvent[]>([])

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const subscribersRef = useRef<Set<(event: ExecutionEvent) => void>>(new Set())
  const eventQueueRef = useRef<ExecutionEvent[]>([])

  // Notify all subscribers of a new event
  const notifySubscribers = useCallback((event: ExecutionEvent) => {
    subscribersRef.current.forEach(callback => {
      try {
        callback(event)
      } catch (err) {
        console.error('[SSE] Subscriber error:', err)
      }
    })
  }, [])

  // Build SSE URL with query parameters
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (options.executionId) params.set('executionId', options.executionId)
    if (options.batchId) params.set('batchId', options.batchId)
    if (options.jobId) params.set('jobId', options.jobId)

    const query = params.toString()
    return `/api/events/stream${query ? `?${query}` : ''}`
  }, [options.executionId, options.batchId, options.jobId])

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log('[SSE] Already connected')
      return
    }

    const url = buildUrl()
    console.log('[SSE] Connecting to', url)
    setStatus(prev => ({ ...prev, reconnecting: true, error: null }))

    try {
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('[SSE] Connected')
        setStatus({ connected: true, reconnecting: false, error: null })
        reconnectAttemptsRef.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          // Handle different message types
          if (message.type === 'connected') {
            console.log('[SSE] Connection confirmed')
            return
          }

          if (message.type === 'heartbeat') {
            // Heartbeat - ignore
            return
          }

          // It's an execution event
          const executionEvent = message as ExecutionEvent
          setEvents(prev => [...prev, executionEvent])
          eventQueueRef.current.push(executionEvent)
          notifySubscribers(executionEvent)
        } catch (err) {
          console.error('[SSE] Error parsing message:', err)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[SSE] Error:', error)
        setStatus({ connected: false, reconnecting: false, error: 'SSE connection error' })

        // Close current connection
        eventSource.close()

        // Attempt reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current)
          console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        } else {
          setStatus({
            connected: false,
            reconnecting: false,
            error: 'Max reconnection attempts reached',
          })
        }
      }
    } catch (err) {
      console.error('[SSE] Connection error:', err)
      setStatus({
        connected: false,
        reconnecting: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      })
    }
  }, [buildUrl, notifySubscribers])

  // Disconnect from SSE endpoint
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  // Subscribe to events
  const subscribe = useCallback((callback: (event: ExecutionEvent) => void) => {
    subscribersRef.current.add(callback)

    // Send any queued events to the new subscriber
    eventQueueRef.current.forEach(event => {
      try {
        callback(event)
      } catch (err) {
        console.error('[SSE] Subscriber error on replay:', err)
      }
    })

    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([])
    eventQueueRef.current = []
  }, [])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    status,
    events,
    subscribe,
    clearEvents,
  }
}
