interface SparklineProps {
  data: number[]
  color?: 'blue' | 'emerald' | 'amber' | 'red'
  height?: number
}

export function Sparkline({ data, color = 'emerald', height = 24 }: SparklineProps) {
  if (data.length === 0) return null

  const colorClasses = {
    blue: 'stroke-blue-500',
    emerald: 'stroke-emerald-500',
    amber: 'stroke-amber-500',
    red: 'stroke-red-500'
  }

  const fillClasses = {
    blue: 'fill-blue-100',
    emerald: 'fill-emerald-100',
    amber: 'fill-amber-100',
    red: 'fill-red-100'
  }

  // Normalize data to 0-1 range
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const normalized = data.map(val => (val - min) / range)

  // Create SVG path
  const width = 80
  const padding = 2
  const stepX = width / (data.length - 1 || 1)

  const points = normalized.map((val, i) => ({
    x: i * stepX,
    y: height - (val * (height - padding * 2)) - padding
  }))

  // Line path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ')

  // Area path (for fill)
  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x},${height}
    L 0,${height}
    Z
  `

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Area fill */}
      <path
        d={areaPath}
        className={fillClasses[color]}
        opacity={0.3}
      />

      {/* Line stroke */}
      <path
        d={linePath}
        className={colorClasses[color]}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
