import { ReactNode } from 'react'

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subtitle?: string
  trend?: ReactNode
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'gray'
}

export function MetricCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  color = 'gray'
}: MetricCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50/50',
    emerald: 'border-emerald-200 bg-emerald-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    red: 'border-red-200 bg-red-50/50',
    gray: 'border-gray-200 bg-gray-50/50'
  }

  return (
    <div className={`rounded-lg border ${colorClasses[color]} p-3 transition-all hover:shadow-sm`}>
      {/* Icon and label */}
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>

      {/* Value */}
      <div className="mb-1">
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
        )}
      </div>

      {/* Trend/visualization */}
      {trend && (
        <div className="mt-2 pt-2 border-t border-gray-200/50">
          {trend}
        </div>
      )}
    </div>
  )
}
