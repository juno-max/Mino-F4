'use client'

import { useState, useEffect } from 'react'
import { Clock, History, Eye, Edit3, Play, Save, X } from 'lucide-react'
import { Button } from '@/components/Button'

interface InstructionVersion {
  id: string
  version: number
  instructions: string
  accuracy?: number
  createdAt: Date
  createdBy?: string
}

interface InstructionsEditorProps {
  projectId: string
  initialInstructions: string
  onSave?: (instructions: string) => Promise<void>
  onSaveAndTest?: (instructions: string) => Promise<void>
  onClose?: () => void
}

export default function InstructionsEditor({
  projectId,
  initialInstructions,
  onSave,
  onSaveAndTest,
  onClose,
}: InstructionsEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'history'>('edit')
  const [instructions, setInstructions] = useState(initialInstructions)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [versions, setVersions] = useState<InstructionVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  // Auto-save draft every 2 seconds
  useEffect(() => {
    if (!isDirty) return

    const timer = setTimeout(() => {
      setAutoSaveStatus('saving')
      // Save to localStorage as draft
      localStorage.setItem(`instructions-draft-${projectId}`, instructions)
      setTimeout(() => {
        setAutoSaveStatus('saved')
        setIsDirty(false)
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      }, 500)
    }, 2000)

    return () => clearTimeout(timer)
  }, [instructions, isDirty, projectId])

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`instructions-draft-${projectId}`)
    if (draft && draft !== initialInstructions) {
      const useDraft = confirm('Found an unsaved draft. Would you like to restore it?')
      if (useDraft) {
        setInstructions(draft)
        setIsDirty(true)
      }
    }
  }, [projectId, initialInstructions])

  // Fetch version history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && versions.length === 0) {
      fetchVersions()
    }
  }, [activeTab])

  const fetchVersions = async () => {
    setLoadingVersions(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/instructions/history`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Error fetching instruction versions:', error)
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleSave = async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      await onSave(instructions)
      setIsDirty(false)
      localStorage.removeItem(`instructions-draft-${projectId}`)
      // Refresh versions
      await fetchVersions()
    } catch (error) {
      console.error('Error saving instructions:', error)
      alert('Failed to save instructions. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndTest = async () => {
    if (!onSaveAndTest) return

    setIsSaving(true)
    try {
      await onSaveAndTest(instructions)
      setIsDirty(false)
      localStorage.removeItem(`instructions-draft-${projectId}`)
      // Refresh versions
      await fetchVersions()
    } catch (error) {
      console.error('Error saving and testing:', error)
      alert('Failed to save and start test. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRestore = (version: InstructionVersion) => {
    const confirm = window.confirm(`Restore version ${version.version}? This will replace your current draft.`)
    if (confirm) {
      setInstructions(version.instructions)
      setIsDirty(true)
      setActiveTab('edit')
    }
  }

  const wordCount = instructions.split(/\s+/).filter(w => w.length > 0).length
  const lineCount = instructions.split('\n').length

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'edit'
              ? 'bg-white border-b-2 border-emerald-500 text-emerald-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Edit3 className="h-4 w-4" />
            <span>Edit</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'bg-white border-b-2 border-emerald-500 text-emerald-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-white border-b-2 border-emerald-500 text-emerald-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <History className="h-4 w-4" />
            <span>History</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'edit' && (
          <div className="space-y-3">
            <textarea
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value)
                setIsDirty(true)
              }}
              className="w-full h-[400px] font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Enter workflow instructions..."
            />

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="space-x-3">
                <span>{wordCount} words</span>
                <span>{lineCount} lines</span>
              </div>

              {/* Auto-save status */}
              {autoSaveStatus !== 'idle' && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {autoSaveStatus === 'saving' && 'Saving draft...'}
                    {autoSaveStatus === 'saved' && 'Draft saved'}
                  </span>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for better instructions:</h4>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Be specific about what data to extract</li>
                <li>Describe the output format (JSON, CSV, etc.)</li>
                <li>Mention edge cases (CAPTCHA, login walls, etc.)</li>
                <li>Include validation rules if applicable</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="prose prose-sm max-w-none">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                {instructions || 'No instructions yet. Switch to Edit tab to add some.'}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {loadingVersions ? (
              <div className="text-center py-8 text-sm text-gray-500">
                Loading version history...
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No version history yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Save your instructions to create the first version
                </p>
              </div>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Version {version.version}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleString()}
                        {version.createdBy && ` • ${version.createdBy}`}
                      </p>
                    </div>
                    {version.accuracy !== undefined && (
                      <div className={`text-sm font-semibold px-2 py-1 rounded ${
                        version.accuracy >= 90 ? 'bg-emerald-100 text-emerald-700' :
                        version.accuracy >= 70 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {version.accuracy}% accuracy
                      </div>
                    )}
                  </div>

                  <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded mb-2 line-clamp-3">
                    {version.instructions}
                  </pre>

                  <button
                    onClick={() => handleRestore(version)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Restore this version
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-2">
        {isDirty && (
          <div className="text-xs text-amber-600 flex items-center space-x-1 mb-2">
            <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
            <span>You have unsaved changes</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAndTest}
            disabled={!isDirty || isSaving}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-1" />
            Save & Test
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Test will run 10 sample sites with the new instructions
        </p>
      </div>
    </div>
  )
}
