import { ExternalLink } from 'lucide-react'

interface WebsiteColumnProps {
  siteUrl: string
  siteName?: string | null
  jobId?: string
  showJobId?: boolean
}

export function WebsiteColumn({
  siteUrl,
  siteName,
  jobId,
  showJobId = false
}: WebsiteColumnProps) {
  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const domain = getDomain(siteUrl)
  const displayName = siteName || domain

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {/* Site Name - Bold and prominent */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-semibold text-gray-900 truncate" title={displayName}>
          {displayName}
        </span>
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-gray-400 hover:text-emerald-600 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* URL - Secondary text */}
      <div className="text-xs text-gray-500 truncate" title={siteUrl}>
        {domain}
      </div>

      {/* Job ID - Tertiary, only if showJobId */}
      {showJobId && jobId && (
        <div className="text-[10px] text-gray-400 font-mono">
          {jobId.slice(0, 8)}...
        </div>
      )}
    </div>
  )
}
