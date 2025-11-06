import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  icon: React.ReactElement<LucideIcon>
  label: string
  value: string | number
  subtitle?: string
  trend?: React.ReactNode
  color?: 'emerald' | 'blue' | 'red' | 'amber' | 'gray'
  className?: string
}

export function MetricCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  color,
  className
}: MetricCardProps) {
  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg p-3 transition-all hover:shadow-sm',
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-1">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-500 mb-2">
          {subtitle}
        </div>
      )}
      {trend && (
        <div className="mt-2">
          {trend}
        </div>
      )}
    </div>
  )
}
