import { Clock, Globe, Code, Shield, AlertTriangle, XCircle } from 'lucide-react'

interface ErrorBadgeProps {
  error: {
    type: 'timeout' | 'network' | 'selector' | 'auth' | 'validation' | 'unknown'
    count: number
    message?: string
  }
  onClick?: () => void
}

export function ErrorBadge({ error, onClick }: ErrorBadgeProps) {
  const getErrorConfig = (type: string) => {
    switch (type) {
      case 'timeout':
        return {
          icon: Clock,
          label: 'Timeout',
          color: 'amber'
        }
      case 'network':
        return {
          icon: Globe,
          label: 'Network',
          color: 'red'
        }
      case 'selector':
        return {
          icon: Code,
          label: 'Selector',
          color: 'amber'
        }
      case 'auth':
        return {
          icon: Shield,
          label: 'Auth',
          color: 'red'
        }
      case 'validation':
        return {
          icon: AlertTriangle,
          label: 'Validation',
          color: 'amber'
        }
      default:
        return {
          icon: XCircle,
          label: 'Unknown',
          color: 'gray'
        }
    }
  }

  const config = getErrorConfig(error.type)
  const Icon = config.icon

  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
    gray: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
        colorClasses[config.color as keyof typeof colorClasses]
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      title={error.message}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
      {error.count > 1 && (
        <>
          <span className="text-gray-400">×</span>
          <span className="font-semibold">{error.count}</span>
        </>
      )}
    </button>
  )
}
