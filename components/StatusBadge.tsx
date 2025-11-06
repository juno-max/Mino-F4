/**
 * StatusBadge - Visual indicator for job statuses
 * Supports granular status display with icons and colors
 */

import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Lock,
  Timer,
  FileQuestion,
  ShieldAlert,
} from 'lucide-react'
import type { DetailedStatus, BlockedReason } from '@/lib/status-detector'

interface StatusBadgeProps {
  status: string // Legacy status: queued, running, completed, error
  detailedStatus?: DetailedStatus | null
  blockedReason?: BlockedReason | null
  completionPercentage?: number | null
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  showIcon?: boolean
  className?: string
}

export function StatusBadge({
  status,
  detailedStatus,
  blockedReason,
  completionPercentage,
  size = 'md',
  showPercentage = false,
  showIcon = true,
  className = ''
}: StatusBadgeProps) {
  // Determine effective status (use detailedStatus if available, fallback to legacy status)
  const effectiveStatus = detailedStatus || status

  const config = getStatusConfig(effectiveStatus, blockedReason, completionPercentage)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${sizeClasses[size]}
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        border transition-all duration-200
        ${className}
      `}
      title={config.tooltip}
    >
      {showIcon && <Icon className={`${iconSizes[size]} ${config.animate ? 'animate-spin' : ''}`} />}
      <span>{config.label}</span>
      {showPercentage && completionPercentage !== null && completionPercentage !== undefined && (
        <span className="text-xs opacity-75">
          {completionPercentage}%
        </span>
      )}
    </div>
  )
}

function getStatusConfig(status: string, blockedReason?: BlockedReason | null, percentage?: number | null) {
  // Handle detailed statuses
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle,
        label: 'Completed',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        tooltip: 'All fields extracted successfully',
        animate: false,
      }

    case 'partial':
      const partialLabel = percentage ? `${percentage}% Complete` : 'Partial'
      return {
        icon: AlertCircle,
        label: partialLabel,
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        tooltip: `Some fields extracted successfully (${percentage || 0}%)`,
        animate: false,
      }

    case 'blocked':
      const blockedConfig = getBlockedReasonConfig(blockedReason)
      return {
        icon: Lock,
        label: blockedConfig.label,
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-300',
        tooltip: blockedConfig.tooltip,
        animate: false,
      }

    case 'timeout':
      return {
        icon: Timer,
        label: 'Timeout',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        tooltip: 'Execution timed out',
        animate: false,
      }

    case 'failed':
      return {
        icon: XCircle,
        label: 'Failed',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        tooltip: 'Execution failed',
        animate: false,
      }

    case 'validation_failed':
      return {
        icon: ShieldAlert,
        label: 'Validation Failed',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-300',
        tooltip: 'Data extracted but failed validation',
        animate: false,
      }

    case 'not_found':
      return {
        icon: FileQuestion,
        label: '404 Not Found',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
        tooltip: 'Page not found',
        animate: false,
      }

    // Legacy statuses
    case 'running':
      return {
        icon: Loader2,
        label: 'Running',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        tooltip: 'Currently executing',
        animate: true,
      }

    case 'queued':
      return {
        icon: Clock,
        label: 'Queued',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-600',
        borderColor: 'border-gray-200',
        tooltip: 'Waiting to execute',
        animate: false,
      }

    case 'error':
      return {
        icon: XCircle,
        label: 'Error',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        tooltip: 'Execution error',
        animate: false,
      }

    default:
      return {
        icon: Clock,
        label: 'Unknown',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-600',
        borderColor: 'border-gray-200',
        tooltip: 'Unknown status',
        animate: false,
      }
  }
}

function getBlockedReasonConfig(reason?: BlockedReason | null) {
  switch (reason) {
    case 'captcha':
      return {
        label: 'CAPTCHA',
        tooltip: 'Blocked by CAPTCHA challenge',
      }
    case 'login_required':
      return {
        label: 'Login Required',
        tooltip: 'Site requires authentication',
      }
    case 'paywall':
      return {
        label: 'Paywall',
        tooltip: 'Content is behind paywall',
      }
    case 'geo_blocked':
      return {
        label: 'Geo-blocked',
        tooltip: 'Content not available in this region',
      }
    case 'rate_limited':
      return {
        label: 'Rate Limited',
        tooltip: 'Too many requests',
      }
    case 'cloudflare':
      return {
        label: 'Bot Detection',
        tooltip: 'Blocked by Cloudflare or bot detection',
      }
    case 'bot_detection':
      return {
        label: 'Bot Detection',
        tooltip: 'Blocked by anti-bot system',
      }
    default:
      return {
        label: 'Blocked',
        tooltip: 'Extraction blocked',
      }
  }
}

/**
 * Compact status indicator (just icon, no text)
 */
export function StatusIcon({
  status,
  detailedStatus,
  blockedReason,
  size = 'md',
  className = ''
}: StatusBadgeProps) {
  const effectiveStatus = detailedStatus || status
  const config = getStatusConfig(effectiveStatus, blockedReason)
  const Icon = config.icon

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-full p-1
        ${config.bgColor}
        ${className}
      `}
      title={config.tooltip}
    >
      <Icon className={`${iconSizes[size]} ${config.textColor} ${config.animate ? 'animate-spin' : ''}`} />
    </div>
  )
}
