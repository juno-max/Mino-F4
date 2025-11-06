'use client'

/**
 * LiveBadge Component
 * Shows a pulsing "LIVE" indicator for running jobs
 */

export function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200">
      <div className="relative flex h-2 w-2">
        {/* Pulsing outer ring */}
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        {/* Static inner dot */}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
      </div>
      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
        LIVE
      </span>
    </div>
  )
}
