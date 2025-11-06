import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AccuracyColumnProps {
  accuracy: number
  showTrend?: boolean
  size?: 'sm' | 'md'
}

export function AccuracyColumn({
  accuracy,
  showTrend = false,
  size = 'md'
}: AccuracyColumnProps) {
  const getAccuracyConfig = (acc: number) => {
    if (acc >= 95) {
      return {
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        label: 'Perfect',
        icon: TrendingUp,
        iconColor: 'text-emerald-600'
      }
    }
    if (acc >= 90) {
      return {
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        label: 'Excellent',
        icon: TrendingUp,
        iconColor: 'text-emerald-500'
      }
    }
    if (acc >= 80) {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Good',
        icon: Minus,
        iconColor: 'text-blue-500'
      }
    }
    if (acc >= 70) {
      return {
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        label: 'Fair',
        icon: TrendingDown,
        iconColor: 'text-amber-500'
      }
    }
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Poor',
      icon: TrendingDown,
      iconColor: 'text-red-500'
    }
  }

  const config = getAccuracyConfig(accuracy)
  const Icon = config.icon

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}>
        <span className={`text-xs font-semibold ${config.color}`}>
          {accuracy}%
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border self-start ${config.bgColor} ${config.borderColor}`}>
        <span className={`text-sm font-semibold ${config.color}`}>
          {accuracy}%
        </span>
        {showTrend && (
          <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
        )}
      </div>
      <span className="text-[10px] text-gray-500">
        {config.label} match
      </span>
    </div>
  )
}
