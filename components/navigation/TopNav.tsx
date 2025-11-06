'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, Command } from 'lucide-react'
import { BeakerIcon } from '@heroicons/react/24/outline'
import UserMenu from '@/components/UserMenu'
import QuickSwitcher from '@/components/navigation/QuickSwitcher'
import KeyboardShortcutsHelp from '@/components/navigation/KeyboardShortcutsHelp'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { useCmdOrCtrlKey, useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { useState } from 'react'

export default function TopNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { scrollDirection, isAtTop } = useScrollDirection()
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  // Open quick switcher with Cmd+K
  useCmdOrCtrlKey('k', () => {
    setShowQuickSwitcher(true)
  })

  // Show keyboard shortcuts with ?
  useKeyboardShortcut({ key: '?', shiftKey: true }, () => {
    setShowKeyboardHelp(true)
  })

  // Don't show navigation on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null
  }

  // Loading state
  if (status === 'loading') {
    return null
  }

  // Not authenticated
  if (!session) {
    return null
  }

  // Determine visibility: show if at top OR scrolling up, hide if scrolling down
  const isVisible = isAtTop || scrollDirection === 'up' || scrollDirection === null

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50
          bg-white border-b border-gray-200 shadow-fintech-sm
          transition-transform duration-200 ease-in-out
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-[2000px] mx-auto">
          <div className="flex items-center justify-between h-full">
            {/* Left: Logo + Dashboard */}
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                  <BeakerIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">MINO</span>
              </Link>

              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/dashboard'
                    ? 'text-emerald-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
            </div>

            {/* Center: Quick Switcher */}
            <button
              onClick={() => setShowQuickSwitcher(true)}
              className="
                hidden md:flex items-center space-x-2 px-4 py-2
                bg-gray-50 hover:bg-gray-100
                border border-gray-200 rounded-lg
                transition-all duration-150
                text-sm text-gray-600
                max-w-md w-80
              "
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search projects and batches...</span>
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
            </button>

            {/* Right: User Menu */}
            <div className="flex items-center">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content jump when nav is hidden */}
      <div className="h-16" />

      {/* Quick Switcher Modal */}
      <QuickSwitcher
        isOpen={showQuickSwitcher}
        onClose={() => setShowQuickSwitcher(false)}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </>
  )
}
