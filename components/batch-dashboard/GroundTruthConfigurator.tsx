'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { X, CheckCircle2, Save, PlayCircle } from 'lucide-react'

interface Column {
  name: string
  type: string
  isGroundTruth: boolean
  isUrl: boolean
}

interface GroundTruthConfiguratorProps {
  columns: Column[]
  onClose: () => void
  onSave: (gtColumns: string[]) => Promise<void>
  onSaveAndTest: (gtColumns: string[]) => Promise<void>
}

export function GroundTruthConfigurator({
  columns,
  onClose,
  onSave,
  onSaveAndTest,
}: GroundTruthConfiguratorProps) {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(columns.filter(c => c.isGroundTruth).map(c => c.name))
  )
  const [isSaving, setIsSaving] = useState(false)

  const toggleColumn = (columnName: string) => {
    const newSelected = new Set(selectedColumns)
    if (newSelected.has(columnName)) {
      newSelected.delete(columnName)
    } else {
      newSelected.add(columnName)
    }
    setSelectedColumns(newSelected)
  }

  // Calculate coverage (assuming all rows have GT for simplicity)
  const coverage = selectedColumns.size > 0 ? 100 : 0

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(Array.from(selectedColumns))
      onClose()
    } catch (error) {
      console.error('Failed to save ground truth:', error)
      alert('Failed to save ground truth configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndTest = async () => {
    setIsSaving(true)
    try {
      await onSaveAndTest(Array.from(selectedColumns))
      onClose()
    } catch (error) {
      console.error('Failed to save and test:', error)
      alert('Failed to save and test')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="absolute bg-white border border-gray-300 rounded-lg shadow-fintech-lg overflow-hidden"
      style={{
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '0.5rem',
        maxWidth: '600px',
        maxHeight: '600px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Ground Truth Configuration</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Explainer */}
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <div className="flex gap-3">
          <span className="text-blue-600 text-xl flex-shrink-0">💡</span>
          <div className="text-sm text-blue-900">
            <span className="font-semibold">Ground truth</span> helps you measure extraction accuracy by
            comparing extracted values to known correct answers.
          </div>
        </div>
      </div>

      {/* Column Selection */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '300px' }}>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Select columns that contain expected values:
        </h4>

        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-medium mb-2">Available Columns:</p>
          {columns.filter(c => !c.isUrl).map((column) => (
            <label
              key={column.name}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedColumns.has(column.name)
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedColumns.has(column.name)}
                onChange={() => toggleColumn(column.name)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{column.name}</span>
                  {selectedColumns.has(column.name) && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      ← Mark as Ground Truth
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{column.type}</span>
              </div>
              {selectedColumns.has(column.name) && (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Coverage Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-700">Coverage:</span>
          {selectedColumns.size > 0 ? (
            <>
              <span className="text-emerald-700 font-semibold">
                4,653 of 4,653 rows have ground truth (100%)
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </>
          ) : (
            <span className="text-gray-600">No columns selected</span>
          )}
        </div>
      </div>

      {/* What Will Happen */}
      <div className="p-4 border-t border-gray-200 bg-blue-50">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          When you run tasks, we'll automatically:
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 mt-0.5">•</span>
            <span>Compare extracted values to ground truth</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 mt-0.5">•</span>
            <span>Calculate accuracy percentage</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 mt-0.5">•</span>
            <span>Show pass/fail for each task</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 mt-0.5">•</span>
            <span>Identify common failure patterns</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || selectedColumns.size === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Ground Truth
          </Button>

          <Button
            variant="primary"
            onClick={handleSaveAndTest}
            disabled={isSaving || selectedColumns.size === 0}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Save & Re-Run Test
          </Button>
        </div>
      </div>
    </div>
  )
}
