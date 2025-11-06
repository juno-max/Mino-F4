'use client'

import { useState, useEffect, ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ScrollResponsiveHeaderProps {
  // Back navigation
  backHref?: string
  backLabel?: string

  // Main title
  title: string
  subtitle?: string

  // Metadata (shown in full mode)
  metadata?: Array<{
    label: string
    value: string | number
    highlight?: boolean
  }>

  // Actions (always visible)
  actions?: ReactNode

  // Status badge (always visible)
  status?: ReactNode

  // Scroll threshold
  scrollThreshold?: number

  // Force compact mode
  forceCompact?: boolean
}

/**
 * ScrollResponsiveHeader - Headers that collapse on scroll
 *
 * Core UX Principle: Scroll-Responsive UI
 * - Full height at top of page (80px)
 * - Compact height on scroll down (48px)
 * - Smooth transition
 * - Preserves title + primary actions
 *
 * @example
 * <ScrollResponsiveHeader
 *   backHref="/projects/123"
 *   backLabel="Project"
 *   title="expedia example"
 *   metadata={[
 *     { label: 'sites', value: 50 },
 *     { label: 'cols', value: 19 },
 *   ]}
 *   status={<StatusBadge status="completed" />}
 *   actions={<Button>Run Test</Button>}
 * />
 */
export function ScrollResponsiveHeader({
  backHref,
  backLabel = 'Back',
  title,
  subtitle,
  metadata = [],
  actions,
  status,
  scrollThreshold = 50,
  forceCompact = false,
}: ScrollResponsiveHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > scrollThreshold)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollThreshold])

  const isCompact = forceCompact || isScrolled

  return (
    <div
      className={`
        sticky top-0 z-20
        bg-white border-b border-gray-200 shadow-fintech-sm
        transition-all duration-300 ease-in-out
        ${isCompact ? 'h-12' : 'h-20'}
      `}
    >
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Mode (Scrolled) */}
        {isCompact && (
          <div className="h-full flex items-center justify-between gap-4">
            {/* Left: Back + Title + Metadata */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {backHref && (
                <>
                  <Link
                    href={backHref}
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors whitespace-nowrap"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                  <span className="text-gray-400">•</span>
                </>
              )}

              <h1 className="text-sm font-bold text-gray-900 truncate">
                {title}
              </h1>

              {metadata.length > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    {metadata.map((item, index) => (
                      <span key={index} className={item.highlight ? 'text-emerald-600 font-semibold' : ''}>
                        {item.value} {item.label}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {status && (
                <>
                  <span className="text-gray-400">•</span>
                  {status}
                </>
              )}
            </div>

            {/* Right: Actions */}
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Full Mode (Top of Page) */}
        {!isCompact && (
          <div className="h-full py-4 flex flex-col justify-center">
            {/* Back Link */}
            {backHref && (
              <Link
                href={backHref}
                className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-600 mb-2 transition-colors font-medium w-fit"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Link>
            )}

            {/* Title Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight truncate">
                    {title}
                  </h1>
                  {status}
                </div>

                {subtitle && (
                  <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
                )}

                {/* Metadata */}
                {metadata.length > 0 && (
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    {metadata.map((item, index) => (
                      <span key={index} className={item.highlight ? 'text-emerald-600 font-semibold' : ''}>
                        {item.value} {item.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
