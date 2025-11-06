'use client'

import { useEffect, useState } from 'react'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false) // Default to collapsed

  useEffect(() => {
    // Sync with localStorage
    const savedState = localStorage.getItem('sidebar-expanded')
    if (savedState !== null) {
      setSidebarExpanded(JSON.parse(savedState))
    }

    // Listen for storage changes (when sidebar toggles)
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('sidebar-expanded')
      if (savedState !== null) {
        setSidebarExpanded(JSON.parse(savedState))
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom event from same window
    const handleSidebarToggle = ((e: CustomEvent) => {
      setSidebarExpanded(e.detail.expanded)
    }) as EventListener

    window.addEventListener('sidebar-toggle', handleSidebarToggle)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebar-toggle', handleSidebarToggle)
    }
  }, [])

  return (
    <main
      className={`
        transition-all duration-300 ease-in-out
        ${sidebarExpanded ? 'pl-[280px]' : 'pl-0'}
      `}
    >
      {children}
    </main>
  )
}
