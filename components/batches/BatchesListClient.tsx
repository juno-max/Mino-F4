'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, CheckSquare, Square, Search, Filter, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card'
import { formatDistance } from 'date-fns'
import { BulkActionToolbar } from './BulkActionToolbar'
import { BulkBatchDeleteModal } from './BulkBatchDeleteModal'

interface Batch {
  id: string
  name: string
  description: string | null
  projectId: string
  totalSites: number
  hasGroundTruth: boolean
  columnSchema: any[]
  createdAt: Date
  project?: {
    name: string
  }
}

interface BatchesListClientProps {
  batches: Batch[]
}

type FilterStatus = 'all' | 'with-gt' | 'without-gt'

export function BatchesListClient({ batches }: BatchesListClientProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filter and search batches
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (batch.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (batch.project?.name.toLowerCase().includes(searchQuery.toLowerCase()))

      // Status filter
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'with-gt' && batch.hasGroundTruth) ||
        (filterStatus === 'without-gt' && !batch.hasGroundTruth)

      return matchesSearch && matchesStatus
    })
  }, [batches, searchQuery, filterStatus])

  const selectedBatches = filteredBatches.filter((b) => selectedIds.has(b.id))
  const allFilteredSelected = filteredBatches.length > 0 && filteredBatches.every((b) => selectedIds.has(b.id))
  const someFilteredSelected = filteredBatches.some((b) => selectedIds.has(b.id))

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredBatches.map((b) => b.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = async () => {
    const response = await fetch('/api/batches/bulk/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchIds: Array.from(selectedIds) }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to delete batches')
    }

    setSelectedIds(new Set())
    router.refresh()
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus('all')
  }

  const hasActiveFilters = searchQuery !== '' || filterStatus !== 'all'

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="mb-4 space-y-3">
        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search batches by name, description, or project..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters || filterStatus !== 'all'
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {filterStatus !== 'all' && (
              <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                1
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Ground Truth:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('with-gt')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    filterStatus === 'with-gt'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  With GT
                </button>
                <button
                  onClick={() => setFilterStatus('without-gt')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    filterStatus === 'without-gt'
                      ? 'bg-gray-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Without GT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selection Header */}
        {filteredBatches.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 hover:text-gray-900 transition-colors"
            >
              {allFilteredSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : someFilteredSelected ? (
                <div className="h-4 w-4 border-2 border-blue-600 rounded bg-blue-100 flex items-center justify-center">
                  <div className="h-2 w-2 bg-blue-600 rounded-sm" />
                </div>
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span className="font-medium">
                {allFilteredSelected ? 'Deselect all' : 'Select all'}
              </span>
            </button>
            <span className="text-gray-400">•</span>
            <span>
              {filteredBatches.length} batch{filteredBatches.length === 1 ? '' : 'es'}
              {filteredBatches.length !== batches.length && ` (filtered from ${batches.length})`}
            </span>
          </div>
        )}
      </div>

      {/* Batches List */}
      {filteredBatches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {hasActiveFilters ? 'No batches found' : 'No batches yet'}
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Upload a CSV file with URLs to start testing'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBatches.map((batch) => {
            const isSelected = selectedIds.has(batch.id)
            return (
              <div
                key={batch.id}
                className={`transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
              >
                <Card className="hover:shadow-md transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleSelect(batch.id)
                        }}
                        className="mt-1"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>

                      {/* Batch Info */}
                      <Link href={`/projects/${batch.projectId}/batches/${batch.id}`} className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle>{batch.name}</CardTitle>
                              {batch.project && (
                                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                                  {batch.project.name}
                                </span>
                              )}
                            </div>
                            <CardDescription>
                              {batch.description || 'No description'}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-semibold text-gray-900">
                              {batch.totalSites}
                            </div>
                            <div className="text-xs text-gray-500">sites</div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/projects/${batch.projectId}/batches/${batch.id}`} className="block">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDistance(batch.createdAt, new Date(), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-gray-500">
                            {batch.columnSchema.length} columns
                          </div>
                          {batch.hasGroundTruth && (
                            <div className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                              Has Ground Truth
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedIds.size}
        onDelete={() => setShowBulkDeleteModal(true)}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <BulkBatchDeleteModal
          batches={selectedBatches}
          onClose={() => setShowBulkDeleteModal(false)}
          onDelete={handleBulkDelete}
        />
      )}
    </>
  )
}
