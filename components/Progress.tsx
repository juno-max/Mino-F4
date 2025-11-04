interface ProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function Progress({ value, max = 100, className = '', showLabel = false, size = 'md' }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const heightClasses = {
    sm: 'h-1.5', // 6px
    md: 'h-2',   // 8px - standard
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-stone-700">Progress</span>
          <span className="text-xs font-medium text-stone-500">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-stone-200 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className="h-full bg-amber-600 transition-fintech rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
