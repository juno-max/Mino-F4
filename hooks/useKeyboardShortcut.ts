'use client'

import { useEffect } from 'react'

type KeyboardShortcutHandler = (event: KeyboardEvent) => void

interface ShortcutOptions {
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  key: string
  enabled?: boolean
}

export function useKeyboardShortcut(
  options: ShortcutOptions,
  handler: KeyboardShortcutHandler
) {
  const { ctrlKey, metaKey, shiftKey, altKey, key, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if all modifier keys match
      const modifiersMatch =
        (ctrlKey === undefined || event.ctrlKey === ctrlKey) &&
        (metaKey === undefined || event.metaKey === metaKey) &&
        (shiftKey === undefined || event.shiftKey === shiftKey) &&
        (altKey === undefined || event.altKey === altKey)

      // Check if the key matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase()

      if (modifiersMatch && keyMatches) {
        event.preventDefault()
        handler(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ctrlKey, metaKey, shiftKey, altKey, key, enabled, handler])
}

// Convenience hook for Cmd/Ctrl+Key shortcuts
export function useCmdOrCtrlKey(key: string, handler: KeyboardShortcutHandler, enabled = true) {
  useKeyboardShortcut(
    {
      key,
      // metaKey (Cmd) on Mac, ctrlKey on Windows/Linux
      metaKey: true,
      enabled,
    },
    handler
  )

  // Also listen for Ctrl key (for cross-platform support)
  useKeyboardShortcut(
    {
      key,
      ctrlKey: true,
      enabled,
    },
    handler
  )
}
