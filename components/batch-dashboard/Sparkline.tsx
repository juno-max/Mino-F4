import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  color?: 'emerald' | 'blue' | 'red' | 'amber' | 'gray'
  height?: number
  showDots?: boolean
}

export function Sparkline({
  data,
  color = 'blue',
  height = 24,
  showDots = false
}: SparklineProps) {
  if (data.length === 0) {
    return <div style={{ height }} className="w-full bg-gray-100 rounded" />
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = ((max - value) / range) * 100
    return `${x},${y}`
  }).join(' ')

  const colorMap = {
    emerald: 'stroke-emerald-500',
    blue: 'stroke-blue-500',
    red: 'stroke-red-500',
    amber: 'stroke-amber-500',
    gray: 'stroke-gray-400'
  }

  const fillColorMap = {
    emerald: 'fill-emerald-100',
    blue: 'fill-blue-100',
    red: 'fill-red-100',
    amber: 'fill-amber-100',
    gray: 'fill-gray-100'
  }

  const filledPath = `M 0,100 L ${points} L 100,100 Z`

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <path
        d={filledPath}
        className={cn(fillColorMap[color], 'opacity-20')}
      />
      <polyline
        points={points}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colorMap[color]}
      />
      {showDots && data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = ((max - value) / range) * 100
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            className={cn(colorMap[color], 'fill-current')}
          />
        )
      })}
    </svg>
  )
}
