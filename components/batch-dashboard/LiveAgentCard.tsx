import { Globe, Search, Zap, Brain, CheckCircle2, Clock } from 'lucide-react'

interface LiveAgentCardProps {
  job: {
    id: string
    siteUrl: string
    siteName?: string | null
    currentStep?: string | null
    progressPercentage?: number
  }
  compact?: boolean
}

export function LiveAgentCard({ job, compact = false }: LiveAgentCardProps) {
  // Detect activity type from current step
  const getActivityIcon = (step?: string | null) => {
    if (!step) return <Clock className="h-4 w-4 text-gray-400 animate-spin" />

    const stepLower = step.toLowerCase()

    if (stepLower.includes('navigat') || stepLower.includes('loading')) {
      return <Globe className="h-4 w-4 text-blue-500 animate-pulse" />
    }
    if (stepLower.includes('finding') || stepLower.includes('looking')) {
      return <Search className="h-4 w-4 text-purple-500 animate-pulse" />
    }
    if (stepLower.includes('extract') || stepLower.includes('tool')) {
      return <Zap className="h-4 w-4 text-emerald-500 animate-pulse" />
    }
    if (stepLower.includes('think') || stepLower.includes('analyz')) {
      return <Brain className="h-4 w-4 text-amber-500 animate-pulse" />
    }
    if (stepLower.includes('validat') || stepLower.includes('check')) {
      return <CheckCircle2 className="h-4 w-4 text-green-500 animate-pulse" />
    }

    return <Globe className="h-4 w-4 text-blue-500 animate-pulse" />
  }

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const domain = getDomain(job.siteUrl)
  const progress = job.progressPercentage || 0

  if (compact) {
    return (
      <div className="flex-shrink-0 w-40 bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          {getActivityIcon(job.currentStep)}
          <span className="text-xs font-medium text-gray-900 truncate" title={domain}>
            {domain}
          </span>
        </div>

        <div className="text-[10px] text-gray-600 mb-1.5 truncate" title={job.currentStep || 'Processing...'}>
          {job.currentStep || 'Processing...'}
        </div>

        {/* Compact progress bar */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    )
  }

  // Full card (not used in hero, but available)
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        {getActivityIcon(job.currentStep)}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate" title={domain}>
            {domain}
          </div>
          <div className="text-xs text-gray-500 truncate" title={job.currentStep || 'Processing...'}>
            {job.currentStep || 'Processing...'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-xs font-mono text-gray-600 whitespace-nowrap">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}
