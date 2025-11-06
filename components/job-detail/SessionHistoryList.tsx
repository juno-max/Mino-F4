'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Session {
  id: string
  sessionNumber: number
  status: string
  detailedStatus: string | null
  createdAt: Date
  extractedData: Record<string, any> | null
  errorMessage: string | null
  completionPercentage: number | null
}

interface SessionHistoryListProps {
  sessions: Session[]
  currentSessionId: string
  onSessionClick: (sessionId: string) => void
}

function getStatusColor(status: string, detailedStatus: string | null) {
  if (status === 'completed') {
    if (detailedStatus === 'partial') return 'bg-amber-100 text-amber-800'
    return 'bg-emerald-100 text-emerald-800'
  }
  if (status === 'running') return 'bg-blue-100 text-blue-800'
  if (status === 'error' || status === 'failed') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}

function getStatusLabel(status: string, detailedStatus: string | null) {
  if (detailedStatus) return detailedStatus
  return status
}

export function SessionHistoryList({
  sessions,
  currentSessionId,
  onSessionClick,
}: SessionHistoryListProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (sessions.length <= 1) {
    return null // Don't show if only one session
  }

  // Exclude current session from history
  const historicSessions = sessions.filter((s) => s.id !== currentSessionId)

  if (historicSessions.length === 0) {
    return null
  }

  return (
    <Card padding="none" className="bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          )}
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Historic Sessions
          </h3>
          <span className="text-xs text-gray-500">
            ({historicSessions.length})
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 divide-y divide-gray-200">
          {historicSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSessionClick(session.id)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    Session #{session.sessionNumber}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(session.status, session.detailedStatus)}`}>
                    {getStatusLabel(session.status, session.detailedStatus)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(session.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-900 rounded p-2 overflow-hidden">
                <pre className="text-xs font-mono text-green-400 line-clamp-3 overflow-hidden">
                  {session.extractedData
                    ? JSON.stringify(session.extractedData, null, 2)
                    : session.errorMessage
                    ? JSON.stringify({ error: session.errorMessage }, null, 2)
                    : '{}'}
                </pre>
              </div>

              {/* Completion percentage if available */}
              {session.completionPercentage !== null && session.completionPercentage < 100 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${session.completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {session.completionPercentage}%
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
