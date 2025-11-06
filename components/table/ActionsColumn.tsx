'use client'

import { useState } from 'react'
import { MoreVertical, ExternalLink, RotateCcw, Trash2, Download, Eye, Copy } from 'lucide-react'

interface ActionsColumnProps {
  jobId: string
  siteUrl?: string
  status: string
  onRetry?: (jobId: string) => void
  onDelete?: (jobId: string) => void
  onDownload?: (jobId: string) => void
  onViewDetails?: (jobId: string) => void
}

export function ActionsColumn({
  jobId,
  siteUrl,
  status,
  onRetry,
  onDelete,
  onDownload,
  onViewDetails
}: ActionsColumnProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  const copyJobId = () => {
    navigator.clipboard.writeText(jobId)
    setIsOpen(false)
  }

  return (
    <div className="relative flex items-center justify-end gap-1">
      {/* Quick action: View site */}
      {siteUrl && (
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded transition-colors"
          onClick={(e) => e.stopPropagation()}
          title="Open site"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {/* Context menu button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="More actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
            {onViewDetails && (
              <button
                onClick={() => handleAction(() => onViewDetails(jobId))}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                View details
              </button>
            )}

            <button
              onClick={() => handleAction(copyJobId)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy className="h-4 w-4" />
              Copy job ID
            </button>

            {onDownload && status.toLowerCase() === 'completed' && (
              <button
                onClick={() => handleAction(() => onDownload(jobId))}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download data
              </button>
            )}

            {onRetry && (status.toLowerCase() === 'failed' || status.toLowerCase() === 'completed') && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => handleAction(() => onRetry(jobId))}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry job
                </button>
              </>
            )}

            {onDelete && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => handleAction(() => onDelete(jobId))}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete job
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
