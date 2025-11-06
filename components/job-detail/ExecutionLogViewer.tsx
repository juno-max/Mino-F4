'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react'

interface LogEntry {
  step: string
  status: 'completed' | 'failed' | 'running' | 'pending'
  timestamp: string
  message?: string
  error?: string
}

interface ExecutionLogViewerProps {
  rawOutput: string | null
  errorMessage: string | null
}

function parseLogEntries(rawOutput: string | null): LogEntry[] {
  if (!rawOutput) return []

  // Simple parser - can be enhanced based on actual log format
  const lines = rawOutput.split('\n')
  const entries: LogEntry[] = []

  lines.forEach((line) => {
    if (line.trim()) {
      // Detect status from line content
      let status: LogEntry['status'] = 'completed'
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
        status = 'failed'
      } else if (line.toLowerCase().includes('running') || line.toLowerCase().includes('executing')) {
        status = 'running'
      }

      entries.push({
        step: `Step ${entries.length + 1}`,
        status,
        timestamp: new Date().toISOString(), // Would be parsed from actual logs
        message: line.trim(),
      })
    }
  })

  return entries
}

export function ExecutionLogViewer({
  rawOutput,
  errorMessage,
}: ExecutionLogViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const logEntries = parseLogEntries(rawOutput)

  if (!rawOutput && !errorMessage) {
    return null
  }

  return (
    <Card padding="none" className="bg-white mt-4">
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
            Execution Log
          </h3>
          {logEntries.length > 0 && (
            <span className="text-xs text-gray-500">
              ({logEntries.length} entries)
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-red-900 mb-1">
                    Error
                  </div>
                  <div className="text-sm text-red-800">
                    {errorMessage}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Log Entries */}
          {logEntries.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {logEntries.map((entry, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {entry.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : entry.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-600" />
                      )}
                    </div>

                    {/* Log Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {entry.step}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {entry.message && (
                        <div className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded mt-1">
                          {entry.message}
                        </div>
                      )}
                      {entry.error && (
                        <div className="text-sm text-red-700 font-mono bg-red-50 p-2 rounded mt-1">
                          {entry.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              No detailed logs available
            </div>
          )}

          {/* Raw Output (collapsible) */}
          {rawOutput && (
            <details className="border-t border-gray-200">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">
                View Raw Output
              </summary>
              <div className="p-4 bg-gray-900">
                <pre className="text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                  {rawOutput}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}
    </Card>
  )
}
