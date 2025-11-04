'use client'

import { Menu } from 'lucide-react'

interface MenuButtonProps {
  onClick: () => void
}

export function MenuButton({ onClick }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="h-9 w-9 flex items-center justify-center hover:bg-muted rounded transition-fintech"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}

