import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface ProgressOutcomeColumnProps {
  status: string
  progress?: number
  error?: string | null
  streamingUrl?: string | null
}

export function ProgressOutcomeColumn({
  status,
  progress = 0,
  error,
  streamingUrl
}: ProgressOutcomeColumnProps) {
  const normalized = status.toLowerCase()

  // RUNNING STATE: Show progress bar
  if (normalized === 'running' || normalized === 'validating') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900">
            {normalized === 'validating' ? 'Validating...' : 'Running...'}
          </span>
          <span className="text-xs text-gray-500 ml-auto">
            {progress}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        {streamingUrl && (
          <a
            href={streamingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Watch live →
          </a>
        )}
      </div>
    )
  }

  // COMPLETED STATE: Show success message
  if (normalized === 'completed') {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        <span className="text-sm font-medium text-emerald-700">
          Execution successful
        </span>
      </div>
    )
  }

  // FAILED STATE: Show error
  if (normalized === 'failed') {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-700">
            Execution failed
          </span>
        </div>
        {error && (
          <p className="text-xs text-red-600 truncate" title={error}>
            {error}
          </p>
        )}
      </div>
    )
  }

  // PENDING STATE: Show waiting message
  if (normalized === 'pending') {
    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-600">
          Waiting to start...
        </span>
      </div>
    )
  }

  // DEFAULT: Show status text
  return (
    <span className="text-sm text-gray-600">
      {status}
    </span>
  )
}
