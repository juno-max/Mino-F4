'use client'

import { useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'

interface ExportButtonProps {
  batchId: string
  allColumns: string[]
}

export function ExportButton({ batchId, allColumns }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [format, setFormat] = useState<'csv' | 'json' | 'xlsx'>('csv')
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(allColumns))
  const [includeGT, setIncludeGT] = useState(true)
  const [includeComparison, setIncludeComparison] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const toggleColumn = (col: string) => {
    const newSet = new Set(selectedColumns)
    if (newSet.has(col)) newSet.delete(col)
    else newSet.add(col)
    setSelectedColumns(newSet)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)

      const response = await fetch(`/api/batches/${batchId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          columns: Array.from(selectedColumns),
          includeGroundTruth: includeGT,
          includeComparison,
        }),
      })

      if (!response.ok) throw new Error('Export failed')

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${batchId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setIsOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Export Data</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-stone-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Format Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Format</label>
              <div className="flex gap-2">
                {(['csv', 'json', 'xlsx'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      format === f
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Columns</label>
                <button
                  onClick={() => setSelectedColumns(selectedColumns.size === allColumns.length ? new Set() : new Set(allColumns))}
                  className="text-xs text-amber-600 hover:text-amber-700"
                >
                  {selectedColumns.size === allColumns.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {allColumns.map(col => (
                  <label key={col} className="flex items-center gap-2 p-2 hover:bg-stone-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColumns.has(col)}
                      onChange={() => toggleColumn(col)}
                      className="rounded border-stone-300"
                    />
                    <span className="text-sm">{col}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="mb-6 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGT}
                  onChange={(e) => setIncludeGT(e.target.checked)}
                  className="rounded border-stone-300"
                />
                <span className="text-sm">Include Ground Truth columns</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeComparison}
                  onChange={(e) => setIncludeComparison(e.target.checked)}
                  className="rounded border-stone-300"
                />
                <span className="text-sm">Include Match/Fail comparison</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting || selectedColumns.size === 0}>
                {isExporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Export {selectedColumns.size} columns
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
