'use client'

import { Menu } from 'lucide-react'

export function SidebarToggle() {
  const toggleSidebar = () => {
    // Get current sidebar state from localStorage
    const currentState = localStorage.getItem('sidebar-expanded')
    const isExpanded = currentState === 'false' ? false : true

    // Toggle the state
    const newState = !isExpanded
    localStorage.setItem('sidebar-expanded', String(newState))

    // Dispatch custom event to notify sidebar
    window.dispatchEvent(new CustomEvent('sidebar-toggle', {
      detail: { expanded: newState }
    }))
  }

  return (
    <button
      onClick={toggleSidebar}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title="Toggle sidebar (Cmd+\)"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5 text-gray-600" />
    </button>
  )
}
