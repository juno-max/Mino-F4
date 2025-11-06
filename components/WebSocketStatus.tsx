'use client'

import { useWebSocket } from '@/lib/useWebSocket'
import { useEffect, useState } from 'react'

/**
 * WebSocket Connection Status Indicator
 *
 * Displays the current WebSocket connection status to the user
 * Shows: Connected (green), Reconnecting (yellow), Disconnected (red)
 */
export function WebSocketStatus() {
  const { status } = useWebSocket()
  const [isVisible, setIsVisible] = useState(false)

  // Only show indicator when there's an issue or during initial connection
  useEffect(() => {
    if (!status.connected || status.reconnecting || status.error) {
      setIsVisible(true)
    } else {
      // Hide after 2 seconds of successful connection
      const timer = setTimeout(() => setIsVisible(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [status])

  if (!isVisible) {
    return null
  }

  const getStatusColor = () => {
    if (status.connected && !status.reconnecting) {
      return 'bg-green-500'
    } else if (status.reconnecting) {
      return 'bg-yellow-500'
    } else {
      return 'bg-red-500'
    }
  }

  const getStatusText = () => {
    if (status.connected && !status.reconnecting) {
      return 'Connected'
    } else if (status.reconnecting) {
      return 'Reconnecting...'
    } else if (status.error) {
      return `Disconnected: ${status.error}`
    } else {
      return 'Disconnected'
    }
  }

  const getStatusIcon = () => {
    if (status.connected && !status.reconnecting) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    } else if (status.reconnecting) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    } else {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300"
      style={{ backgroundColor: getStatusColor().replace('bg-', 'rgb(var(--') + '))' }}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  )
}

/**
 * Minimal Connection Dot Indicator
 *
 * Shows a small colored dot that indicates WebSocket connection status
 * Use this in navigation bars or status areas
 */
export function WebSocketDot() {
  const { status } = useWebSocket()

  const getStatusColor = () => {
    if (status.connected && !status.reconnecting) {
      return 'bg-green-400'
    } else if (status.reconnecting) {
      return 'bg-yellow-400 animate-pulse'
    } else {
      return 'bg-red-400'
    }
  }

  const getTooltip = () => {
    if (status.connected && !status.reconnecting) {
      return 'Live updates active'
    } else if (status.reconnecting) {
      return 'Reconnecting to live updates...'
    } else {
      return 'Live updates disconnected'
    }
  }

  return (
    <div
      className="relative group"
      title={getTooltip()}
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {getTooltip()}
      </div>
    </div>
  )
}
