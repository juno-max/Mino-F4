interface DonutChartProps {
  data: Array<{
    label: string
    value: number
    color: 'emerald' | 'red' | 'amber' | 'blue' | 'gray'
  }>
  centerText?: string
  centerLabel?: string
  size?: number
}

export function DonutChart({
  data,
  centerText,
  centerLabel,
  size = 120
}: DonutChartProps) {
  const colorMap = {
    emerald: '#10b981',
    red: '#ef4444',
    amber: '#f59e0b',
    blue: '#3b82f6',
    gray: '#6b7280'
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-full"
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-400">No Data</div>
        </div>
      </div>
    )
  }

  // Calculate segments
  const strokeWidth = 16
  const radius = (size / 2) - (strokeWidth / 2)
  const circumference = 2 * Math.PI * radius

  let currentAngle = -90 // Start from top

  const segments = data.map(item => {
    const percentage = item.value / total
    const segmentLength = circumference * percentage
    const rotation = currentAngle

    currentAngle += percentage * 360

    return {
      ...item,
      segmentLength,
      rotation,
      percentage: Math.round(percentage * 100)
    }
  })

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />

        {/* Segments */}
        {segments.map((segment, i) => {
          const dashArray = `${segment.segmentLength} ${circumference - segment.segmentLength}`
          const dashOffset = -segments
            .slice(0, i)
            .reduce((sum, s) => sum + s.segmentLength, 0)

          return (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colorMap[segment.color]}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          )
        })}
      </svg>

      {/* Center text */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          top: strokeWidth / 2,
          left: strokeWidth / 2,
          right: strokeWidth / 2,
          bottom: strokeWidth / 2
        }}
      >
        {centerText && (
          <div className="text-2xl font-bold text-gray-900">{centerText}</div>
        )}
        {centerLabel && (
          <div className="text-xs text-gray-500 mt-0.5">{centerLabel}</div>
        )}
      </div>
    </div>
  )
}
