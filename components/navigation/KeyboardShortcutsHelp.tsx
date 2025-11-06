'use client'

import { X, Command } from 'lucide-react'
import { useEffect, useState } from 'react'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Cmd', 'K'], description: 'Open quick switcher' },
        { keys: ['Cmd', '\\'], description: 'Toggle sidebar' },
        { keys: ['Cmd', 'I'], description: 'Toggle instructions drawer' },
        { keys: ['G', 'D'], description: 'Go to dashboard' },
        { keys: ['G', 'P'], description: 'Go to projects' },
        { keys: ['↑', '↓'], description: 'Navigate sidebar items' },
        { keys: ['Enter'], description: 'Open selected item' },
      ],
    },
    {
      category: 'Actions',
      items: [
        { keys: ['Cmd', 'N'], description: 'Create new project' },
        { keys: ['Cmd', 'U'], description: 'Upload CSV' },
        { keys: ['Cmd', 'S'], description: 'Save (in editor)' },
        { keys: ['Cmd', 'Enter'], description: 'Run test (in instructions editor)' },
        { keys: ['Esc'], description: 'Close modal/drawer' },
      ],
    },
    {
      category: 'Help',
      items: [
        { keys: ['?'], description: 'Show this help' },
      ],
    },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-600 mt-1">Master MINO with these shortcuts</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {shortcuts.map((section) => (
            <div key={section.category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-sm text-gray-700">{item.description}</span>
                    <div className="flex items-center space-x-1">
                      {item.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center">
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm">
                            {key === 'Cmd' ? (
                              <Command className="h-3 w-3" />
                            ) : (
                              key
                            )}
                          </kbd>
                          {keyIndex < item.keys.length - 1 && (
                            <span className="mx-1 text-gray-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              <span className="font-semibold">Tip:</span> Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">?</kbd> anytime to view shortcuts
            </div>
            <button
              onClick={onClose}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
