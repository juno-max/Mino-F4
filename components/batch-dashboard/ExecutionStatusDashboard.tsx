'use client'

/**
 * Execution Status Dashboard
 * Shows at-a-glance execution health with clickable status cards
 * Uses fintech UI design system
 */

import { CheckCircle2, XCircle, Clock, Zap, ChevronUp } from 'lucide-react'

export interface ExecutionStatusProps {
  totalJobs: number
  completedJobs: number
  failedJobs: number
  queuedJobs: number
  runningJobs: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  onStatusClick?: (status: 'completed' | 'failed' | 'queued' | 'running' | 'all') => void
  currentFilter?: string
}

export function ExecutionStatusDashboard({
  totalJobs,
  completedJobs,
  failedJobs,
  queuedJobs,
  runningJobs,
  isCollapsed,
  onToggleCollapse,
  onStatusClick,
  currentFilter = 'all',
}: ExecutionStatusProps) {
  const completedPercent = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
  const failedPercent = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0
  const queuedPercent = totalJobs > 0 ? (queuedJobs / totalJobs) * 100 : 0
  const runningPercent = totalJobs > 0 ? (runningJobs / totalJobs) * 100 : 0

  const stats = [
    {
      label: 'Completed',
      value: completedJobs,
      percent: completedPercent,
      icon: CheckCircle2,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-200',
      status: 'completed' as const,
    },
    {
      label: 'Failed',
      value: failedJobs,
      percent: failedPercent,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      iconColor: 'text-red-500',
      borderColor: 'border-red-200',
      status: 'failed' as const,
    },
    {
      label: 'Queued',
      value: queuedJobs,
      percent: queuedPercent,
      icon: Clock,
      color: 'gray',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-500',
      borderColor: 'border-gray-200',
      status: 'queued' as const,
    },
    {
      label: 'Running',
      value: runningJobs,
      percent: runningPercent,
      icon: Zap,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-200',
      status: 'running' as const,
    },
  ]

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="w-full bg-white border border-gray-200 rounded-lg p-4 shadow-fintech-sm hover:shadow-fintech-md transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-gray-600">Execution Status</span>
          <div className="flex items-center gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5">
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                <span className={`text-sm font-semibold ${stat.textColor}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ChevronUp className="h-4 w-4 text-gray-400 rotate-180 group-hover:text-gray-600 transition-colors" />
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-fintech-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Execution Status</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalJobs} total jobs • Click a stat to filter
          </p>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors group"
          aria-label="Collapse status dashboard"
        >
          <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
        </button>
      </div>

      {/* Status Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            const isActive = currentFilter === stat.status
            const isAnimated = stat.label === 'Running' && stat.value > 0

            return (
              <button
                key={stat.label}
                onClick={() => onStatusClick?.(stat.status)}
                className={`
                  relative overflow-hidden bg-white border rounded-lg p-5
                  transition-all duration-200
                  hover:shadow-fintech-md hover:-translate-y-0.5
                  focus:outline-none focus:ring-2 focus:ring-[rgb(52,211,153)] focus:ring-offset-2
                  ${isActive ? `${stat.borderColor} border-2 shadow-fintech-md` : 'border-gray-200'}
                  ${isAnimated ? 'animate-pulse-subtle' : ''}
                `}
              >
                {/* Background Pattern */}
                <div className={`absolute inset-0 ${stat.bgColor} opacity-30`} />

                {/* Content */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    {isActive && (
                      <div className={`h-2 w-2 rounded-full ${stat.iconColor.replace('text-', 'bg-')}`} />
                    )}
                  </div>

                  <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                    {stat.value}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      {stat.label}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {stat.percent.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.iconColor.replace('text-', 'bg-')} transition-all duration-500`}
                      style={{ width: `${stat.percent}%` }}
                    />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
