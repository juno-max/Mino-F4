import { CheckCircle, XCircle, AlertTriangle, Check, X } from 'lucide-react'

interface ColumnInfo {
  name: string
  type: string
  isGroundTruth: boolean
  isUrl: boolean
}

interface DataQualitySummaryProps {
  extractedData: Record<string, any> | null
  groundTruthData: Record<string, any> | null
  columnSchema: ColumnInfo[]
  accuracy: number
}

export function DataQualitySummary({
  extractedData,
  groundTruthData,
  columnSchema,
  accuracy
}: DataQualitySummaryProps) {
  const gtFields = columnSchema.filter(col => col.isGroundTruth)

  if (gtFields.length === 0) {
    // No ground truth - just show if data was extracted
    return (
      <div className="flex items-center gap-2">
        {extractedData && Object.keys(extractedData).length > 0 ? (
          <>
            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span className="text-sm font-medium text-emerald-700">
              Data extracted successfully
            </span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-700">
              No data extracted
            </span>
          </>
        )}
      </div>
    )
  }

  // Calculate matches
  const matches = gtFields.reduce((acc, field) => {
    const gtValue = String(groundTruthData?.[field.name] || '').trim().toLowerCase()
    const extractedValue = String(extractedData?.[field.name] || '').trim().toLowerCase()

    if (gtValue && extractedValue === gtValue) {
      acc.matched.push(field.name)
    } else if (gtValue && !extractedValue) {
      acc.missing.push(field.name)
    } else if (gtValue && extractedValue !== gtValue) {
      acc.incorrect.push(field.name)
    }

    return acc
  }, { matched: [] as string[], missing: [] as string[], incorrect: [] as string[] })

  const totalFields = gtFields.length
  const Icon = accuracy === 100 ? CheckCircle : accuracy >= 80 ? AlertTriangle : XCircle
  const color = accuracy === 100 ? 'emerald' : accuracy >= 80 ? 'amber' : 'red'

  return (
    <div className="flex flex-col gap-2">
      {/* Summary header */}
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 text-${color}-500 flex-shrink-0`} />
        <span className={`text-sm font-medium text-${color}-700`}>
          Extracted {matches.matched.length}/{totalFields} fields ({accuracy}% match)
        </span>
      </div>

      {/* Field preview with checkmarks - show up to 4 fields */}
      {gtFields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {gtFields.slice(0, 4).map(field => {
            const extracted = extractedData?.[field.name]
            const isMatch = matches.matched.includes(field.name)
            const isMissing = matches.missing.includes(field.name)

            if (isMissing) {
              return (
                <div
                  key={field.name}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                >
                  <X className="h-3 w-3" />
                  <span className="font-medium">{field.name}:</span>
                  <span className="italic">missing</span>
                </div>
              )
            }

            return (
              <div
                key={field.name}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  isMatch
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {isMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span className="font-medium">{field.name}:</span>
                <span className="truncate max-w-[100px]" title={String(extracted || '—')}>
                  {String(extracted || '—')}
                </span>
              </div>
            )
          })}

          {/* Show "+N more" if there are more fields */}
          {gtFields.length > 4 && (
            <div className="flex items-center px-2 py-1 text-xs text-gray-500">
              +{gtFields.length - 4} more
            </div>
          )}
        </div>
      )}

      {/* Missing fields warning */}
      {matches.missing.length > 0 && (
        <div className="text-xs text-amber-600">
          Missing: {matches.missing.join(', ')}
        </div>
      )}
    </div>
  )
}
