'use client'

import { useState } from 'react'
import { MenuPanel } from './MenuPanel'
import { MenuButton } from './MenuButton'
import { mockMenuData } from '@/lib/menu-data'

export function GlobalMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [stealthMode, setStealthMode] = useState(false)

  return (
    <>
      <MenuButton onClick={() => setMenuOpen(true)} />
      <MenuPanel
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        projects={mockMenuData}
        stealthMode={stealthMode}
        onStealthToggle={setStealthMode}
      />
    </>
  )
}

