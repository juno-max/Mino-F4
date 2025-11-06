import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Globe, Code, Clock, Shield } from 'lucide-react'
import { ActivityStream } from './ActivityStream'
import { DataQualitySummary } from './DataQualitySummary'

type ErrorCategory = 'timeout' | 'network' | 'selector' | 'auth' | 'validation' | 'unknown'

interface ErrorInfo {
  category: ErrorCategory
  title: string
  suggestion: string
  icon: typeof XCircle
}

interface ColumnInfo {
  name: string
  type: string
  isGroundTruth: boolean
  isUrl: boolean
}

interface ProgressOutcomeColumnProps {
  status: string
  progress?: number
  error?: string | null
  streamingUrl?: string | null
  currentStep?: string | null
  currentUrl?: string | null
  lastActivityAt?: Date | string | null
  startedAt?: Date | string | null
  extractedData?: Record<string, any> | null
  groundTruthData?: Record<string, any> | null
  columnSchema?: ColumnInfo[]
  accuracy?: number
}

export function ProgressOutcomeColumn({
  status,
  progress = 0,
  error,
  streamingUrl,
  currentStep,
  currentUrl,
  lastActivityAt,
  startedAt,
  extractedData,
  groundTruthData,
  columnSchema,
  accuracy = 0
}: ProgressOutcomeColumnProps) {
  const normalized = status.toLowerCase()

  // Categorize error and provide suggestions
  const categorizeError = (errorMessage?: string | null): ErrorInfo => {
    if (!errorMessage) {
      return {
        category: 'unknown',
        title: 'Unknown error',
        suggestion: 'Try running the job again',
        icon: XCircle
      }
    }

    const msg = errorMessage.toLowerCase()

    // Timeout errors
    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('time out')) {
      return {
        category: 'timeout',
        title: 'Execution timeout',
        suggestion: 'Page took too long to load. Try again or check if the site is slow.',
        icon: Clock
      }
    }

    // Network errors
    if (msg.includes('network') || msg.includes('connection') || msg.includes('fetch') || msg.includes('dns')) {
      return {
        category: 'network',
        title: 'Network error',
        suggestion: 'Could not reach the website. Check if URL is accessible.',
        icon: Globe
      }
    }

    // Selector/element not found errors
    if (msg.includes('selector') || msg.includes('element') || msg.includes('not found') || msg.includes('query')) {
      return {
        category: 'selector',
        title: 'Element not found',
        suggestion: 'Page structure may have changed. Update your selectors or prompts.',
        icon: Code
      }
    }

    // Authentication/access errors
    if (msg.includes('auth') || msg.includes('login') || msg.includes('permission') || msg.includes('forbidden') || msg.includes('401') || msg.includes('403')) {
      return {
        category: 'auth',
        title: 'Access denied',
        suggestion: 'Authentication required. Check credentials or permissions.',
        icon: Shield
      }
    }

    // Validation errors
    if (msg.includes('validation') || msg.includes('invalid') || msg.includes('required')) {
      return {
        category: 'validation',
        title: 'Validation error',
        suggestion: 'Input data may be incomplete or invalid. Check ground truth fields.',
        icon: AlertTriangle
      }
    }

    // Unknown error
    return {
      category: 'unknown',
      title: 'Execution failed',
      suggestion: 'Try running the job again or check the error details.',
      icon: XCircle
    }
  }

  // RUNNING STATE: Show activity stream with live progress
  if (normalized === 'running' || normalized === 'validating') {
    return (
      <div className="flex flex-col gap-2">
        <ActivityStream
          currentStep={currentStep || (normalized === 'validating' ? 'Validating results' : 'Processing...')}
          currentUrl={currentUrl}
          lastActivityAt={lastActivityAt}
          progressPercentage={progress}
          startedAt={startedAt}
        />
        {streamingUrl && (
          <a
            href={streamingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            Watch live →
          </a>
        )}
      </div>
    )
  }

  // COMPLETED STATE: Show data quality summary
  if (normalized === 'completed') {
    // If we have column schema, show detailed data quality
    if (columnSchema && columnSchema.length > 0) {
      return (
        <DataQualitySummary
          extractedData={extractedData ?? null}
          groundTruthData={groundTruthData ?? null}
          columnSchema={columnSchema}
          accuracy={accuracy}
        />
      )
    }

    // Fallback to simple success message
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        <span className="text-sm font-medium text-emerald-700">
          Execution successful
        </span>
      </div>
    )
  }

  // FAILED STATE: Show categorized error with suggestions
  if (normalized === 'failed') {
    const errorInfo = categorizeError(error)
    const ErrorIcon = errorInfo.icon

    return (
      <div className="flex flex-col gap-2">
        {/* Error header with category icon */}
        <div className="flex items-center gap-2">
          <ErrorIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-700">
            {errorInfo.title}
          </span>
        </div>

        {/* Suggested action */}
        <div className="flex items-start gap-1.5 bg-red-50 border border-red-100 rounded px-2 py-1.5">
          <RefreshCw className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-red-700">
            {errorInfo.suggestion}
          </span>
        </div>

        {/* Full error message (collapsed by default) */}
        {error && (
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              View error details
            </summary>
            <p className="mt-1 pl-2 border-l-2 border-gray-200 text-gray-600">
              {error}
            </p>
          </details>
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
