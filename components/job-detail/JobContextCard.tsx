'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '@/components/Card'

interface JobContextCardProps {
  goal: string
  siteUrl: string
  inputId: string
  createdAt: Date
  csvRowData: Record<string, any> | null
  instructions: string | null
}

export function JobContextCard({
  goal,
  siteUrl,
  inputId,
  createdAt,
  csvRowData,
  instructions,
}: JobContextCardProps) {
  const [showInputData, setShowInputData] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <Card padding="none" className="bg-white">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Job Details
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Goal */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Goal
          </div>
          <div className="text-sm text-gray-900 leading-relaxed">
            {goal}
          </div>
        </div>

        {/* Website URL */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Website URL
          </div>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            {siteUrl}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Input ID and Created */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Input ID
            </div>
            <div className="text-sm text-gray-900 font-mono">
              {inputId}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Created
            </div>
            <div className="text-sm text-gray-900">
              {new Date(createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Collapsible Input Data */}
        {csvRowData && (
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowInputData(!showInputData)}
              className="flex items-center gap-2 w-full text-left hover:text-gray-900 transition-colors"
            >
              {showInputData ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Input Data ({Object.keys(csvRowData).length} fields)
              </span>
            </button>

            {showInputData && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <pre className="text-xs font-mono text-gray-800 overflow-x-auto">
                  {JSON.stringify(csvRowData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Instructions */}
        {instructions && (
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-2 w-full text-left hover:text-gray-900 transition-colors"
            >
              {showInstructions ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Workflow Instructions
              </span>
            </button>

            {showInstructions && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  {instructions}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
