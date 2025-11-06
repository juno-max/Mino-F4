'use client'

import { useState } from 'react'
import { CheckCircle2, Edit3, Copy, Check } from 'lucide-react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'

interface LatestOutputCardProps {
  extractedData: Record<string, any> | null
  status: string
  errorMessage: string | null
  onSetAsGroundTruth: () => void
  onEditOutput: () => void
  hasGroundTruth: boolean
}

export function LatestOutputCard({
  extractedData,
  status,
  errorMessage,
  onSetAsGroundTruth,
  onEditOutput,
  hasGroundTruth,
}: LatestOutputCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (extractedData) {
      navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const displayData = extractedData || (errorMessage ? { error: errorMessage } : null)

  return (
    <Card padding="none" className="bg-white h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Latest Output
        </h3>
        <button
          onClick={handleCopy}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {displayData ? (
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs font-mono text-green-400">
              {JSON.stringify(displayData, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No output available
          </div>
        )}
      </div>

      {/* Actions */}
      {status === 'completed' && extractedData && (
        <div className="p-4 border-t border-gray-200 flex items-center gap-2">
          {!hasGroundTruth && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSetAsGroundTruth}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Set as Ground Truth
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onEditOutput}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Edit Output
          </Button>
        </div>
      )}
    </Card>
  )
}
