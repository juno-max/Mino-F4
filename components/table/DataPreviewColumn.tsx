import { FileText, Image, Link as LinkIcon, Hash } from 'lucide-react'

interface DataField {
  key: string
  value: any
  type?: 'text' | 'image' | 'url' | 'number'
}

interface DataPreviewColumnProps {
  data: Record<string, any> | null
  maxFields?: number
  priorityFields?: string[]
}

export function DataPreviewColumn({
  data,
  maxFields = 3,
  priorityFields = []
}: DataPreviewColumnProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <FileText className="h-3.5 w-3.5" />
        <span className="text-xs">No data extracted</span>
      </div>
    )
  }

  // Convert data object to array of fields
  const allFields = Object.entries(data).map(([key, value]) => ({
    key,
    value,
    type: inferType(value)
  }))

  // Prioritize fields based on priorityFields array
  const sortedFields = allFields.sort((a, b) => {
    const aIndex = priorityFields.indexOf(a.key)
    const bIndex = priorityFields.indexOf(b.key)

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return 0
  })

  // Take only the first maxFields
  const displayFields = sortedFields.slice(0, maxFields)
  const remainingCount = allFields.length - displayFields.length

  return (
    <div className="flex flex-col gap-1.5">
      {displayFields.map((field, index) => (
        <DataFieldItem key={index} field={field} />
      ))}
      {remainingCount > 0 && (
        <span className="text-[10px] text-gray-400">
          +{remainingCount} more field{remainingCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

function DataFieldItem({ field }: { field: DataField }) {
  const getIcon = () => {
    switch (field.type) {
      case 'image':
        return <Image className="h-3 w-3 text-purple-500" />
      case 'url':
        return <LinkIcon className="h-3 w-3 text-blue-500" />
      case 'number':
        return <Hash className="h-3 w-3 text-emerald-500" />
      default:
        return <FileText className="h-3 w-3 text-gray-500" />
    }
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') return JSON.stringify(value).slice(0, 50) + '...'

    const str = String(value)
    if (str.length > 40) return str.slice(0, 40) + '...'
    return str
  }

  return (
    <div className="flex items-start gap-1.5 min-w-0">
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          {formatFieldName(field.key)}
        </span>
        <span className="text-xs text-gray-900 truncate" title={String(field.value)}>
          {formatValue(field.value)}
        </span>
      </div>
    </div>
  )
}

function inferType(value: any): 'text' | 'image' | 'url' | 'number' {
  if (typeof value === 'number') return 'number'

  const str = String(value).toLowerCase()

  if (str.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image'
  if (str.startsWith('http://') || str.startsWith('https://')) return 'url'

  return 'text'
}

function formatFieldName(key: string): string {
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
