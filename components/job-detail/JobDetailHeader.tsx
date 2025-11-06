'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronDown, RefreshCw, Pencil } from 'lucide-react'
import { Button } from '@/components/Button'

interface Session {
  id: string
  sessionNumber: number
  status: string
  detailedStatus: string | null
  createdAt: Date
}

interface JobDetailHeaderProps {
  projectId: string
  batchId: string
  jobId: string
  batchName: string
  currentSession: Session
  allSessions: Session[]
  onSessionChange: (sessionId: string) => void
  onRetry: () => void
  onEditInstructions: () => void
}

function getStatusColor(status: string, detailedStatus: string | null) {
  if (status === 'completed') {
    if (detailedStatus === 'partial') return 'bg-amber-100 text-amber-800'
    return 'bg-emerald-100 text-emerald-800'
  }
  if (status === 'running') return 'bg-blue-100 text-blue-800'
  if (status === 'error') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}

function getStatusLabel(status: string, detailedStatus: string | null) {
  if (detailedStatus) return detailedStatus
  return status
}

export function JobDetailHeader({
  projectId,
  batchId,
  jobId,
  batchName,
  currentSession,
  allSessions,
  onSessionChange,
  onRetry,
  onEditInstructions,
}: JobDetailHeaderProps) {
  const [showSessionDropdown, setShowSessionDropdown] = useState(false)

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Link
            href={`/projects/${projectId}/batches/${batchId}`}
            className="flex items-center gap-1 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to {batchName}
          </Link>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Session Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
              >
                <span className="font-semibold text-gray-900">
                  Session #{currentSession.sessionNumber}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>

              {/* Dropdown */}
              {showSessionDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSessionDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
                    {allSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          onSessionChange(session.id)
                          setShowSessionDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                          session.id === currentSession.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            Session #{session.sessionNumber}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(session.status, session.detailedStatus)}`}>
                            {getStatusLabel(session.status, session.detailedStatus)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(session.createdAt).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Status Badge */}
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(currentSession.status, currentSession.detailedStatus)}`}>
              {getStatusLabel(currentSession.status, currentSession.detailedStatus)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onEditInstructions}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Instructions
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
