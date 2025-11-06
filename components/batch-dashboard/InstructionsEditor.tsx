'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { X, Maximize2, Save, PlayCircle } from 'lucide-react'

interface InstructionsEditorProps {
  currentInstructions: string
  onClose: () => void
  onSave: (instructions: string) => Promise<void>
  onSaveAndTest: (instructions: string) => Promise<void>
}

export function InstructionsEditor({
  currentInstructions,
  onClose,
  onSave,
  onSaveAndTest,
}: InstructionsEditorProps) {
  const [instructions, setInstructions] = useState(currentInstructions)
  const [isSaving, setIsSaving] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(instructions)
      onClose()
    } catch (error) {
      console.error('Failed to save instructions:', error)
      alert('Failed to save instructions')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndTest = async () => {
    setIsSaving(true)
    try {
      await onSaveAndTest(instructions)
      onClose()
    } catch (error) {
      console.error('Failed to save and test:', error)
      alert('Failed to save and test')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`${isFullScreen ? 'fixed inset-0 z-50' : 'absolute'} bg-white border border-gray-300 rounded-lg shadow-fintech-lg overflow-hidden`}
      style={isFullScreen ? undefined : {
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '0.5rem',
        maxWidth: '600px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Instructions</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title={isFullScreen ? 'Exit full screen' : 'Full screen'}
          >
            <Maximize2 className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Current Version Info */}
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Current Version:</span> v1.0
        </p>
      </div>

      {/* Editor */}
      <div className="p-4">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          placeholder="Enter extraction instructions..."
        />

        {isFullScreen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreen(false)}
            className="mt-3"
          >
            Exit Full Screen Editor
          </Button>
        )}
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
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as v1.1
          </Button>

          <Button
            variant="primary"
            onClick={handleSaveAndTest}
            disabled={isSaving}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Save & Run Test (10 sites)
          </Button>
        </div>
      </div>

      {/* Version History (collapsed for now) */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Version History:</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-mono">v1.0</span>
            <span>-</span>
            <span>Original (10 runs, 100% success)</span>
          </div>
        </div>
      </div>

      {/* Tip */}
      {!isFullScreen && (
        <div className="p-3 bg-blue-50 border-t border-blue-200 text-xs text-blue-900">
          💡 <span className="font-semibold">Pro Tip:</span> Save & Run Test to validate changes before full batch
        </div>
      )}
    </div>
  )
}
