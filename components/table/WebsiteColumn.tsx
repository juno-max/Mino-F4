import { ExternalLink, Layers } from 'lucide-react'

interface WebsiteColumnProps {
  siteUrl: string
  siteName?: string | null
  jobId?: string
  inputData?: Record<string, any>
  showJobId?: boolean
}

export function WebsiteColumn({
  siteUrl,
  siteName,
  jobId,
  inputData,
  showJobId = false
}: WebsiteColumnProps) {
  // Parse URL to extract domain and path
  const parseUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace('www.', '')
      const path = urlObj.pathname

      // Extract meaningful slug from path
      const pathParts = path.split('/').filter(Boolean)
      const slug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : ''

      return { domain, path, slug }
    } catch {
      return { domain: url, path: '', slug: '' }
    }
  }

  // Get 2-3 most important input fields for preview
  const getKeyInputFields = (data?: Record<string, any>, maxFields = 3) => {
    if (!data) return []

    // Filter out technical fields and prioritize meaningful ones
    const meaningfulFields = Object.entries(data)
      .filter(([key, value]) => {
        // Exclude these technical fields
        const excludeFields = ['id', 'url', 'siteUrl', 'siteName', 'timestamp', 'createdAt']
        return !excludeFields.includes(key) && value != null && value !== ''
      })
      .map(([key, value]) => ({
        key,
        value: String(value)
      }))
      .slice(0, maxFields)

    return meaningfulFields
  }

  const { domain, path, slug } = parseUrl(siteUrl)
  const keyInputs = getKeyInputFields(inputData, 3)

  // Truncate path if too long
  const displayPath = path.length > 50 ? path.slice(0, 47) + '...' : path

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {/* Full URL with domain + path */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="flex-1 min-w-0 flex items-baseline gap-1">
          <span className="text-gray-500 text-xs">{domain}</span>
          {path && path !== '/' && (
            <span className="font-semibold text-gray-900 text-sm truncate" title={path}>
              {displayPath}
            </span>
          )}
        </div>
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

      {/* Input data preview - helps differentiate jobs */}
      {keyInputs.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Layers className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {keyInputs.map((field, i) => (
              <span key={i} className="flex items-center gap-1.5 min-w-0">
                {i > 0 && <span className="text-gray-300">•</span>}
                <span className="font-medium truncate" title={field.value}>
                  {field.value}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Job ID - Tertiary, only if showJobId */}
      {showJobId && jobId && (
        <div className="text-[10px] text-gray-400 font-mono">
          {jobId.slice(0, 8)}...
        </div>
      )}
    </div>
  )
}
