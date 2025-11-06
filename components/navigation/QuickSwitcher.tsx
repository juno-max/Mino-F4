'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, Folder, FileText, Command, Plus, Play } from 'lucide-react'
import { useCmdOrCtrlKey } from '@/hooks/useKeyboardShortcut'

interface QuickSwitcherItem {
  id: string
  type: 'project' | 'batch' | 'action'
  title: string
  subtitle?: string
  url?: string
  icon?: React.ReactNode
  action?: () => void
  metrics?: {
    jobs?: string
    accuracy?: string
  }
}

interface QuickSwitcherProps {
  isOpen: boolean
  onClose: () => void
}

export default function QuickSwitcher({ isOpen, onClose }: QuickSwitcherProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [items, setItems] = useState<QuickSwitcherItem[]>([])
  const [recentItems, setRecentItems] = useState<QuickSwitcherItem[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent items from localStorage
  useEffect(() => {
    if (isOpen) {
      const recent = localStorage.getItem('quick-switcher-recent')
      if (recent) {
        try {
          setRecentItems(JSON.parse(recent))
        } catch (e) {
          console.error('Error loading recent items:', e)
        }
      }

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Fetch all items when opened
  useEffect(() => {
    if (isOpen) {
      fetchAllItems()
    }
  }, [isOpen])

  const fetchAllItems = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/navigation/tree')
      if (response.ok) {
        const data = await response.json()
        const allItems: QuickSwitcherItem[] = []

        // Add projects and batches
        data.tree?.forEach((project: any) => {
          allItems.push({
            id: project.id,
            type: 'project',
            title: project.name,
            subtitle: `${project.metrics.totalBatches} batches • ${project.metrics.totalJobs} jobs`,
            url: `/projects/${project.id}`,
            icon: <Folder className="h-4 w-4" />,
            metrics: {
              jobs: `${project.metrics.completedJobs}/${project.metrics.totalJobs}`,
              accuracy: `${project.metrics.accuracy}%`,
            },
          })

          project.batches?.forEach((batch: any) => {
            allItems.push({
              id: batch.id,
              type: 'batch',
              title: batch.name,
              subtitle: project.name,
              url: `/projects/${project.id}/batches/${batch.id}`,
              icon: <FileText className="h-4 w-4" />,
              metrics: {
                jobs: `${batch.metrics.completedJobs}/${batch.metrics.totalJobs}`,
                accuracy: `${batch.metrics.accuracy}%`,
              },
            })
          })
        })

        setItems(allItems)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  // Quick actions
  const quickActions: QuickSwitcherItem[] = [
    {
      id: 'new-project',
      type: 'action',
      title: 'Create New Project',
      subtitle: 'Start a new automation project',
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        router.push('/projects/new')
        onClose()
      },
    },
    {
      id: 'upload-csv',
      type: 'action',
      title: 'Upload CSV',
      subtitle: 'Create a new batch',
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        // This would need context of which project
        alert('Please navigate to a project first, then upload CSV')
        onClose()
      },
    },
    {
      id: 'running-jobs',
      type: 'action',
      title: 'View All Running Jobs',
      subtitle: 'See active executions across all projects',
      icon: <Play className="h-4 w-4" />,
      action: () => {
        router.push('/dashboard?filter=running')
        onClose()
      },
    },
  ]

  // Fuzzy search with simple algorithm
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return recentItems.length > 0 ? recentItems : items.slice(0, 10)
    }

    const queryLower = query.toLowerCase()
    const matches = items.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(queryLower)
      const subtitleMatch = item.subtitle?.toLowerCase().includes(queryLower)
      return titleMatch || subtitleMatch
    })

    // Sort by relevance (exact match first, then starts with, then contains)
    return matches.sort((a, b) => {
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()

      if (aTitle === queryLower) return -1
      if (bTitle === queryLower) return 1
      if (aTitle.startsWith(queryLower)) return -1
      if (bTitle.startsWith(queryLower)) return 1
      return 0
    })
  }, [query, items, recentItems])

  const displayItems = query.trim() ? filteredItems : [...filteredItems, ...quickActions]

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, displayItems.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          handleSelect(displayItems[selectedIndex])
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, displayItems, onClose])

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (item: QuickSwitcherItem) => {
    // Save to recent (exclude actions)
    if (item.type !== 'action') {
      const recent = [item, ...recentItems.filter(r => r.id !== item.id)].slice(0, 5)
      setRecentItems(recent)
      localStorage.setItem('quick-switcher-recent', JSON.stringify(recent))
    }

    // Navigate or execute action
    if (item.action) {
      item.action()
    } else if (item.url) {
      router.push(item.url)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/30 z-[60] flex items-start justify-center pt-[15vh] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl animate-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects and batches..."
              className="w-full pl-11 pr-16 py-3 text-base border-0 outline-none focus:ring-0"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-xs text-gray-400">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : displayItems.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No results found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <>
              {/* Section: Recent or Search Results */}
              {!query.trim() && recentItems.length > 0 && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                  Recent
                </div>
              )}

              {displayItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`w-full px-4 py-3 flex items-center space-x-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-emerald-50 border-l-2 border-emerald-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    item.type === 'project' ? 'text-blue-500' :
                    item.type === 'batch' ? 'text-emerald-500' :
                    'text-gray-400'
                  }`}>
                    {item.icon || <FileText className="h-4 w-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-gray-500 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  {item.metrics && (
                    <div className="flex-shrink-0 flex items-center space-x-3 text-xs">
                      <span className="font-mono text-gray-600">
                        {item.metrics.jobs}
                      </span>
                      <span className={`font-semibold ${
                        parseInt(item.metrics.accuracy || '0') >= 90 ? 'text-emerald-600' :
                        parseInt(item.metrics.accuracy || '0') >= 70 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {item.metrics.accuracy}
                      </span>
                    </div>
                  )}
                </button>
              ))}

              {/* Quick Actions Section */}
              {!query.trim() && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100 border-t">
                    Quick Actions
                  </div>
                  {quickActions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full px-4 py-3 flex items-center space-x-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 text-gray-400">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div>
            <Clock className="h-3 w-3 inline mr-1" />
            Recent searches saved
          </div>
        </div>
      </div>
    </div>
  )
}
