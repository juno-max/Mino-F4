import { Globe, Search, Zap, Brain, CheckCircle2, Clock } from 'lucide-react'
import { formatDistance } from 'date-fns'

interface ActivityStreamProps {
  currentStep?: string | null
  currentUrl?: string | null
  lastActivityAt?: Date | string | null
  progressPercentage?: number
  startedAt?: Date | string | null
}

type ActivityType = 'navigation' | 'finding' | 'tool_call' | 'reasoning' | 'validation' | 'waiting'

export function ActivityStream({
  currentStep,
  currentUrl,
  lastActivityAt,
  progressPercentage = 0,
  startedAt
}: ActivityStreamProps) {
  const activityType = detectActivityType(currentStep)
  const elapsed = startedAt ? Date.now() - new Date(startedAt).getTime() : 0

  return (
    <div className="flex flex-col gap-2">
      {/* Current activity with icon and animation */}
      <div className="flex items-start gap-2">
        <ActivityIcon type={activityType} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {formatActivityMessage(currentStep, activityType)}
          </div>
          {currentUrl && (
            <div className="text-xs text-gray-500 truncate mt-0.5" title={currentUrl}>
              → {currentUrl}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor(elapsed)}`}
            style={{ width: `${Math.min(progressPercentage || 0, 100)}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
          {formatDuration(elapsed)}
        </span>
      </div>

      {/* Time since last activity */}
      {lastActivityAt && (
        <div className="text-[10px] text-gray-400">
          Last update: {formatDistance(new Date(lastActivityAt), new Date(), { addSuffix: true })}
        </div>
      )}
    </div>
  )
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const iconProps = "h-4 w-4 flex-shrink-0"

  switch (type) {
    case 'navigation':
      return <Globe className={`${iconProps} text-blue-500 animate-pulse`} />
    case 'finding':
      return <Search className={`${iconProps} text-purple-500 animate-pulse`} />
    case 'tool_call':
      return <Zap className={`${iconProps} text-emerald-500 animate-pulse`} />
    case 'reasoning':
      return <Brain className={`${iconProps} text-amber-500 animate-pulse`} />
    case 'validation':
      return <CheckCircle2 className={`${iconProps} text-green-500 animate-pulse`} />
    case 'waiting':
      return <Clock className={`${iconProps} text-gray-400 animate-spin`} />
    default:
      return <Globe className={`${iconProps} text-blue-500 animate-pulse`} />
  }
}

function detectActivityType(step?: string | null): ActivityType {
  if (!step) return 'waiting'

  const stepLower = step.toLowerCase()

  if (stepLower.includes('navigat') || stepLower.includes('loading') || stepLower.includes('visiting')) {
    return 'navigation'
  }
  if (stepLower.includes('finding') || stepLower.includes('looking') || stepLower.includes('searching')) {
    return 'finding'
  }
  if (stepLower.includes('extract') || stepLower.includes('tool') || stepLower.includes('click') || stepLower.includes('typing')) {
    return 'tool_call'
  }
  if (stepLower.includes('think') || stepLower.includes('analyz') || stepLower.includes('compar') || stepLower.includes('reason')) {
    return 'reasoning'
  }
  if (stepLower.includes('validat') || stepLower.includes('check') || stepLower.includes('verify')) {
    return 'validation'
  }
  if (stepLower.includes('wait') || stepLower.includes('pending')) {
    return 'waiting'
  }

  return 'navigation'
}

function formatActivityMessage(step?: string | null, type?: ActivityType): string {
  if (!step) {
    return 'Initializing...'
  }

  // Add emoji prefix based on type
  const prefix = {
    navigation: '🌐',
    finding: '🔍',
    tool_call: '⚡',
    reasoning: '💭',
    validation: '✅',
    waiting: '⏳'
  }[type || 'navigation']

  return `${prefix} ${step}`
}

function getProgressColor(elapsedMs: number): string {
  const seconds = Math.floor(elapsedMs / 1000)

  if (seconds < 30) return 'bg-emerald-500' // Fast
  if (seconds < 120) return 'bg-blue-500' // Normal
  if (seconds < 300) return 'bg-amber-500' // Slow
  return 'bg-red-500' // Very slow
}

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '0s'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}
