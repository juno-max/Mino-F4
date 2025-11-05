'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import UserMenu from './UserMenu'
import { BeakerIcon } from '@heroicons/react/24/outline'

export default function Navigation() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

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

  const navItems = [
    { href: '/projects', label: 'Projects' },
    { href: '/account/profile', label: 'Account' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/projects" className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BeakerIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MINO F4</span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium ${
                  pathname?.startsWith(item.href)
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}
