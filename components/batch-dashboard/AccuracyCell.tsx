'use client'

/**
 * AccuracyCell Component
 * Displays job-level accuracy with visual indicators
 */

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export interface AccuracyCellProps {
  correctFields: number
  totalFields: number
  hasGroundTruth: boolean
}

export function AccuracyCell({ correctFields, totalFields, hasGroundTruth }: AccuracyCellProps) {
  if (!hasGroundTruth || totalFields === 0) {
    return (
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-gray-300" />
        <span className="text-xs text-gray-400">No GT</span>
      </div>
    )
  }

  const accuracy = Math.round((correctFields / totalFields) * 100)

  // Determine color and icon based on accuracy
  let colorClass = ''
  let icon = null
  let bgClass = ''

  if (accuracy === 100) {
    colorClass = 'text-emerald-600'
    bgClass = 'bg-emerald-50'
    icon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
  } else if (accuracy >= 80) {
    colorClass = 'text-emerald-600'
    bgClass = 'bg-emerald-50'
    icon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
  } else if (accuracy >= 50) {
    colorClass = 'text-amber-600'
    bgClass = 'bg-amber-50'
    icon = <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
  } else {
    colorClass = 'text-red-600'
    bgClass = 'bg-red-50'
    icon = <XCircle className="h-3.5 w-3.5 text-red-500" />
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md ${bgClass}`}>
      {icon}
      <div className="flex flex-col">
        <span className={`text-sm font-bold ${colorClass}`}>
          {accuracy}%
        </span>
        <span className="text-[10px] text-gray-500">
          {correctFields}/{totalFields}
        </span>
      </div>
    </div>
  )
}
