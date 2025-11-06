import { Clock, Zap, AlertCircle } from 'lucide-react'

interface DurationColumnProps {
  startTime?: Date | string | null
  endTime?: Date | string | null
  durationMs?: number
  showIcon?: boolean
}

export function DurationColumn({
  startTime,
  endTime,
  durationMs,
  showIcon = true
}: DurationColumnProps) {
  // Calculate duration if not provided
  let duration = durationMs

  if (!duration && startTime && endTime) {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    duration = end - start
  }

  // If still no duration, check if job is currently running
  if (!duration && startTime && !endTime) {
    const start = new Date(startTime).getTime()
    const now = Date.now()
    duration = now - start
  }

  if (!duration || duration < 0) {
    return (
      <div className="flex items-center gap-1.5 text-gray-400">
        {showIcon && <Clock className="h-3.5 w-3.5" />}
        <span className="text-xs">—</span>
      </div>
    )
  }

  const { formatted, color, icon: Icon } = formatDuration(duration)

  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span className="text-xs font-medium">
        {formatted}
      </span>
    </div>
  )
}

function formatDuration(ms: number): {
  formatted: string
  color: string
  icon: typeof Clock
} {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  // < 30s: Fast (green)
  if (seconds < 30) {
    return {
      formatted: `${seconds}s`,
      color: 'text-emerald-600',
      icon: Zap
    }
  }

  // 30s - 2m: Normal (blue)
  if (seconds < 120) {
    return {
      formatted: seconds < 60 ? `${seconds}s` : `${minutes}m ${seconds % 60}s`,
      color: 'text-blue-600',
      icon: Clock
    }
  }

  // 2m - 5m: Slow (amber)
  if (minutes < 5) {
    return {
      formatted: `${minutes}m ${seconds % 60}s`,
      color: 'text-amber-600',
      icon: Clock
    }
  }

  // 5m+: Very slow (red)
  if (hours > 0) {
    return {
      formatted: `${hours}h ${minutes % 60}m`,
      color: 'text-red-600',
      icon: AlertCircle
    }
  }

  return {
    formatted: `${minutes}m`,
    color: 'text-red-600',
    icon: AlertCircle
  }
}
