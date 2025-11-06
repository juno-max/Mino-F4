import { cn } from '@/lib/utils'

interface DonutChartSegment {
  label: string
  value: number
  color: 'emerald' | 'red' | 'blue' | 'amber' | 'gray'
}

interface DonutChartProps {
  data: DonutChartSegment[]
  centerText: string
  centerLabel: string
  size?: number
}

export function DonutChart({
  data,
  centerText,
  centerLabel,
  size = 120
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">0</div>
          <div className="text-xs text-gray-400">{centerLabel}</div>
        </div>
      </div>
    )
  }

  const colorMap = {
    emerald: '#10b981',
    red: '#ef4444',
    blue: '#3b82f6',
    amber: '#f59e0b',
    gray: '#9ca3af'
  }

  const radius = 50
  const strokeWidth = 20
  const innerRadius = radius - strokeWidth / 2
  const circumference = 2 * Math.PI * innerRadius

  let accumulatedPercentage = 0

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        className="transform -rotate-90"
        style={{ width: size, height: size }}
      >
        <circle
          cx="60"
          cy="60"
          r={innerRadius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        {data.map((segment, index) => {
          const percentage = segment.value / total
          const segmentLength = circumference * percentage
          accumulatedPercentage += percentage
          return (
            <circle
              key={index}
              cx="60"
              cy="60"
              r={innerRadius}
              fill="none"
              stroke={colorMap[segment.color]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={-accumulatedPercentage * circumference + segmentLength}
              className="transition-all duration-300"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-900">
          {centerText}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {centerLabel}
        </div>
      </div>
    </div>
  )
}

export function DonutChartLegend({ data }: { data: DonutChartSegment[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const colorMap = {
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    gray: 'bg-gray-400'
  }
  return (
    <div className="flex flex-col gap-2">
      {data.map((segment, index) => {
        const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0
        return (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', colorMap[segment.color])} />
              <span className="text-gray-700">{segment.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{segment.value}</span>
              <span className="text-gray-500 text-xs">({percentage}%)</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
