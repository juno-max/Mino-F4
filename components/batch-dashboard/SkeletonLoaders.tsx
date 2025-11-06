'use client'

/**
 * Skeleton Loading States
 * Modern loading skeletons with fintech design principles
 * Provides visual feedback while content loads
 */

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-32 bg-gray-300 rounded" />
        </div>
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-12 bg-gray-100 rounded" />
    </div>
  )
}

export function JobTableRowSkeleton() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      <td className="px-2 py-3">
        <div className="h-4 w-6 bg-gray-200 rounded mx-auto" />
      </td>
      <td className="px-3 py-3">
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </td>
      <td className="px-3 py-3">
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </td>
      <td className="px-3 py-3">
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
      </td>
      <td className="px-3 py-3">
        <div className="space-y-1">
          <div className="h-4 w-40 bg-gray-300 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="space-y-1">
          <div className="h-2 w-full bg-gray-200 rounded-full" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </td>
      <td className="px-3 py-3">
        <div className="space-y-1">
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </td>
      <td className="px-3 py-3">
        <div className="flex gap-1">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </td>
    </tr>
  )
}

export function JobTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="w-12 px-2 py-3 text-center text-xs font-semibold text-gray-600">#</th>
            <th className="w-10 px-3 py-3" />
            <th className="w-16 px-3 py-3" />
            <th className="w-16 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Status
            </th>
            <th className="w-60 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Website
            </th>
            <th className="w-72 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Progress / Outcome
            </th>
            <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Accuracy
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Key Data
            </th>
            <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
              Duration
            </th>
            <th className="w-20 px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <JobTableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-blue-500 rounded" />
          <div className="h-4 w-96 bg-blue-500 rounded" />
          <div className="flex gap-3 mt-6">
            <div className="h-10 w-32 bg-blue-500 rounded-lg" />
            <div className="h-10 w-32 bg-blue-800 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Table Skeleton */}
      <JobTableSkeleton rows={8} />
    </div>
  )
}

export function LiveAgentCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 w-48 bg-gray-300 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
          <div className="h-2 w-full bg-gray-200 rounded-full mt-3" />
        </div>
      </div>
    </div>
  )
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <div className="text-sm text-gray-400">Loading chart...</div>
    </div>
  )
}

/**
 * Shimmer effect for premium loading experience
 */
export function ShimmerEffect() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  )
}

/**
 * Usage with shimmer:
 * <div className="relative overflow-hidden">
 *   <MetricCardSkeleton />
 *   <ShimmerEffect />
 * </div>
 */
