'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { ExecutionEvent } from './execution-events'

export interface WebSocketStatus {
  connected: boolean
  reconnecting: boolean
  error: string | null
}

export interface UseWebSocketReturn {
  status: WebSocketStatus
  events: ExecutionEvent[]
  subscribe: (callback: (event: ExecutionEvent) => void) => () => void
  clearEvents: () => void
}

const WS_URL = typeof window !== 'undefined'
  ? `ws://${window.location.hostname}:${window.location.port}/ws`
  : 'ws://localhost:3000/ws'

const RECONNECT_DELAY = 3000 // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10
const HEARTBEAT_INTERVAL = 30000 // 30 seconds

/**
 * Custom React hook for WebSocket connection with auto-reconnect
 *
 * Features:
 * - Automatic connection management
 * - Auto-reconnect with exponential backoff
 * - Event accumulation and replay
 * - Multiple subscribers support
 * - Heartbeat/ping-pong mechanism
 */
export function useWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    reconnecting: false,
    error: null,
  })
  const [events, setEvents] = useState<ExecutionEvent[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()
  const subscribersRef = useRef<Set<(event: ExecutionEvent) => void>>(new Set())
  const eventQueueRef = useRef<ExecutionEvent[]>([])

  // Notify all subscribers of a new event
  const notifySubscribers = useCallback((event: ExecutionEvent) => {
    subscribersRef.current.forEach(callback => {
      try {
        callback(event)
      } catch (err) {
        console.error('[WebSocket] Subscriber error:', err)
      }
    })
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected')
      return
    }

    console.log('[WebSocket] Connecting to', WS_URL)
    setStatus(prev => ({ ...prev, reconnecting: true, error: null }))

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WebSocket] Connected')
        setStatus({ connected: true, reconnecting: false, error: null })
        reconnectAttemptsRef.current = 0

        // Start heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, HEARTBEAT_INTERVAL)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          // Handle different message types
          if (message.type === 'connected') {
            console.log('[WebSocket] Welcome message:', message.clientId)
            return
          }

          if (message.type === 'pong') {
            // Heartbeat response
            return
          }

          // It's an execution event - add to events and notify subscribers
          const executionEvent = message as ExecutionEvent
          setEvents(prev => [...prev, executionEvent])
          eventQueueRef.current.push(executionEvent)
          notifySubscribers(executionEvent)
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        setStatus(prev => ({ ...prev, error: 'WebSocket connection error' }))
      }

      ws.onclose = (event) => {
        console.log('[WebSocket] Closed:', event.code, event.reason)
        setStatus({ connected: false, reconnecting: false, error: 'Connection closed' })

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }

        // Attempt reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current)
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setStatus({
            connected: false,
            reconnecting: false,
            error: 'Max reconnection attempts reached',
          })
        }
      }
    } catch (err) {
      console.error('[WebSocket] Connection error:', err)
      setStatus({
        connected: false,
        reconnecting: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      })
    }
  }, [notifySubscribers])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounted')
      wsRef.current = null
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
        console.error('[WebSocket] Subscriber error on replay:', err)
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
