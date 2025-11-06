import { CheckCircle, XCircle, Clock, Play, AlertCircle } from 'lucide-react'

interface StatusColumnProps {
  status: string
  size?: 'sm' | 'md'
}

export function StatusColumn({ status, size = 'md' }: StatusColumnProps) {
  const getStatusConfig = (status: string) => {
    const normalized = status.toLowerCase()

    const configs = {
      completed: {
        color: 'bg-emerald-500',
        icon: CheckCircle,
        label: 'Completed',
        dotSize: size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
      },
      failed: {
        color: 'bg-red-500',
        icon: XCircle,
        label: 'Failed',
        dotSize: size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
      },
      running: {
        color: 'bg-blue-500 animate-pulse',
        icon: Play,
        label: 'Running',
        dotSize: size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
      },
      pending: {
        color: 'bg-amber-500',
        icon: Clock,
        label: 'Pending',
        dotSize: size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
      },
      validating: {
        color: 'bg-purple-500 animate-pulse',
        icon: AlertCircle,
        label: 'Validating',
        dotSize: size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
      }
    }

    return configs[normalized as keyof typeof configs] || configs.pending
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-full ${config.dotSize} ${config.color} flex-shrink-0`} />
      {size === 'md' && (
        <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      )}
    </div>
  )
}
