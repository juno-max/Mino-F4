'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    period?: string
  }
  icon?: ReactNode
  loading?: boolean
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'gray'
  size?: 'sm' | 'md' | 'lg'
}

export function MetricCard({
  label,
  value,
  trend,
  icon,
  loading = false,
  color = 'gray',
  size = 'md'
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    )
  }

  const colorClasses = {
    emerald: 'text-emerald-600 bg-emerald-50',
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    gray: 'text-gray-600 bg-gray-50'
  }

  const sizeClasses = {
    sm: {
      container: 'p-3',
      value: 'text-2xl',
      label: 'text-xs',
      icon: 'h-4 w-4'
    },
    md: {
      container: 'p-4',
      value: 'text-3xl',
      label: 'text-xs',
      icon: 'h-5 w-5'
    },
    lg: {
      container: 'p-6',
      value: 'text-4xl',
      label: 'text-sm',
      icon: 'h-6 w-6'
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    if (trend.direction === 'up') return 'text-emerald-600'
    if (trend.direction === 'down') return 'text-red-600'
    return 'text-gray-600'
  }

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.direction === 'up') return <TrendingUp className="h-4 w-4" />
    if (trend.direction === 'down') return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200
        hover:shadow-md hover:border-gray-300
        transition-all duration-200
        ${sizeClasses[size].container}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={`${sizeClasses[size].label} font-medium text-gray-600 uppercase tracking-wide`}>
          {label}
        </p>
        {icon && (
          <div className={`${colorClasses[color]} p-2 rounded-lg`}>
            <div className={sizeClasses[size].icon}>
              {icon}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className={`${sizeClasses[size].value} font-bold text-gray-900`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>

        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>
              {trend.value > 0 ? '+' : ''}
              {trend.value}%
            </span>
          </div>
        )}
      </div>

      {trend?.period && (
        <p className="text-xs text-gray-500 mt-2">{trend.period}</p>
      )}
    </div>
  )
}

// Skeleton loader component
export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-20"></div>
    </div>
  )
}

// Grid container for metric cards
export function MetricGrid({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  )
}
