'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card'
import { Edit, Save, X, Copy, Trash2 } from 'lucide-react'

interface BulkGTEditorProps {
  batchId: string
  jobs: Array<{
    id: string
    inputId: string
    siteUrl: string
    groundTruthData: Record<string, any> | null
  }>
  gtColumns: Array<{
    name: string
    type: string
  }>
}

export function BulkGTEditor({ batchId, jobs, gtColumns }: BulkGTEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Record<string, Record<string, any>>>({})
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  const [bulkValue, setBulkValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCellEdit = (jobId: string, columnName: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [jobId]: {
        ...(prev[jobId] || {}),
        [columnName]: value,
      },
    }))
  }

  const handleToggleJobSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(jobs.map(j => j.id)))
    }
  }

  const handleBulkSet = async () => {
    if (!selectedColumn || selectedJobs.size === 0) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/batches/${batchId}/ground-truth/bulk-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobs),
          fieldName: selectedColumn,
          operation: 'set',
          value: bulkValue,
        }),
      })

      if (!response.ok) throw new Error('Failed to bulk edit')

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Bulk edit error:', error)
      alert('Failed to bulk edit ground truth values')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkCopyFromExtracted = async () => {
    if (!selectedColumn || selectedJobs.size === 0) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/batches/${batchId}/ground-truth/bulk-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobs),
          fieldName: selectedColumn,
          operation: 'copy_from_extracted',
        }),
      })

      if (!response.ok) throw new Error('Failed to copy from extracted')

      window.location.reload()
    } catch (error) {
      console.error('Copy from extracted error:', error)
      alert('Failed to copy from extracted data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkClear = async () => {
    if (!selectedColumn || selectedJobs.size === 0) return

    if (!confirm(`Clear ${selectedColumn} for ${selectedJobs.size} selected jobs?`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/batches/${batchId}/ground-truth/bulk-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobs),
          fieldName: selectedColumn,
          operation: 'clear',
        }),
      })

      if (!response.ok) throw new Error('Failed to clear')

      window.location.reload()
    } catch (error) {
      console.error('Clear error:', error)
      alert('Failed to clear ground truth values')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updates = Object.entries(editedData).map(([jobId, data]) => ({
        jobId,
        groundTruthData: data,
      }))

      const response = await fetch(`/api/batches/${batchId}/ground-truth/bulk-set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) throw new Error('Failed to save')

      setEditedData({})
      setIsEditing(false)
      window.location.reload()
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save ground truth values')
    } finally {
      setIsLoading(false)
    }
  }

  if (gtColumns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ground Truth Editor</CardTitle>
          <CardDescription>No ground truth columns defined for this batch</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ground Truth Editor</CardTitle>
            <CardDescription>
              Edit ground truth values for {gtColumns.length} columns across {jobs.length} jobs
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedData({})
                  }}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading || Object.keys(editedData).length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Ground Truth
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bulk Edit Controls */}
        {isEditing && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
            <div className="font-medium text-amber-900">Bulk Edit Tools</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-stone-600 block mb-1">
                  Selected: {selectedJobs.size} jobs
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="w-full"
                >
                  {selectedJobs.size === jobs.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div>
                <label className="text-sm text-stone-600 block mb-1">Column</label>
                <select
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm"
                  value={selectedColumn || ''}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                >
                  <option value="">Select column...</option>
                  {gtColumns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md text-sm"
                placeholder="Bulk value..."
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                disabled={!selectedColumn || selectedJobs.size === 0}
              />
              <Button
                size="sm"
                onClick={handleBulkSet}
                disabled={!selectedColumn || selectedJobs.size === 0 || !bulkValue || isLoading}
              >
                Set Value
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkCopyFromExtracted}
                disabled={!selectedColumn || selectedJobs.size === 0 || isLoading}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy from Extracted
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkClear}
                disabled={!selectedColumn || selectedJobs.size === 0 || isLoading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-200 bg-stone-50">
                {isEditing && (
                  <th className="text-left p-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedJobs.size === jobs.length}
                      onChange={handleSelectAll}
                      className="rounded border-stone-300"
                    />
                  </th>
                )}
                <th className="text-left p-3 font-semibold text-xs text-stone-500 uppercase">
                  Job ID
                </th>
                <th className="text-left p-3 font-semibold text-xs text-stone-500 uppercase">
                  URL
                </th>
                {gtColumns.map((col) => (
                  <th key={col.name} className="text-left p-3 font-semibold text-xs text-stone-500 uppercase">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const gtData = job.groundTruthData || {}
                const jobEdits = editedData[job.id] || {}
                const mergedData = { ...gtData, ...jobEdits }

                return (
                  <tr
                    key={job.id}
                    className={`border-b border-stone-100 hover:bg-stone-50 transition-colors ${
                      selectedJobs.has(job.id) ? 'bg-amber-50' : ''
                    }`}
                  >
                    {isEditing && (
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedJobs.has(job.id)}
                          onChange={() => handleToggleJobSelection(job.id)}
                          className="rounded border-stone-300"
                        />
                      </td>
                    )}
                    <td className="p-3 text-stone-700 font-mono text-xs">
                      {job.inputId}
                    </td>
                    <td className="p-3 text-stone-700 max-w-xs truncate">
                      {job.siteUrl}
                    </td>
                    {gtColumns.map((col) => (
                      <td key={col.name} className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-stone-300 rounded text-sm"
                            value={mergedData[col.name] || ''}
                            onChange={(e) => handleCellEdit(job.id, col.name, e.target.value)}
                          />
                        ) : (
                          <span className="text-stone-900">
                            {mergedData[col.name] || <span className="text-stone-400">—</span>}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
