'use client'

import { useState, useEffect } from 'react'
import { History, Plus, Check, Clock, Eye, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card'

interface Version {
  id: string
  versionNumber: number
  instructions: string
  changeDescription: string | null
  createdAt: string
}

interface InstructionVersionsProps {
  projectId: string
  currentInstructions: string
  onUpdate?: () => void
}

export function InstructionVersions({ projectId, currentInstructions, onUpdate }: InstructionVersionsProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [newInstructions, setNewInstructions] = useState(currentInstructions)
  const [changeDescription, setChangeDescription] = useState('')
  const [setAsProduction, setSetAsProduction] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchVersions()
  }, [projectId])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/instructions/versions`)
      if (!response.ok) throw new Error('Failed to fetch versions')
      const data = await response.json()
      setVersions(data.versions)
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const createVersion = async () => {
    try {
      setCreating(true)
      const response = await fetch(`/api/projects/${projectId}/instructions/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: newInstructions,
          changeDescription: changeDescription || null,
          setAsProduction,
        }),
      })

      if (!response.ok) throw new Error('Failed to create version')

      await fetchVersions()
      setShowCreateModal(false)
      setNewInstructions(currentInstructions)
      setChangeDescription('')
      setSetAsProduction(true)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error creating version:', error)
      alert('Failed to create version')
    } finally {
      setCreating(false)
    }
  }

  const viewVersion = (version: Version) => {
    setSelectedVersion(version)
    setShowViewModal(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Instruction Version History
              </CardTitle>
              <CardDescription>
                Track changes to your extraction instructions over time
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Version
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              <History className="h-12 w-12 mx-auto mb-3 text-stone-400" />
              <p className="text-sm">No version history yet</p>
              <p className="text-xs text-stone-400 mt-1">Create your first version to track changes</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="p-4 border border-stone-200 rounded-lg hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-stone-900">
                          Version {version.versionNumber}
                        </span>
                        <span className="text-xs text-stone-500">
                          {new Date(version.createdAt).toLocaleDateString()} at{' '}
                          {new Date(version.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      {version.changeDescription && (
                        <p className="text-sm text-stone-600 mb-2">{version.changeDescription}</p>
                      )}
                      <p className="text-sm text-stone-500 line-clamp-2">
                        {version.instructions}
                      </p>
                    </div>
                    <Button
                      onClick={() => viewVersion(version)}
                      variant="outline"
                      size="sm"
                      className="ml-4"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Version Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create New Instruction Version</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-stone-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-stone-300 rounded-md text-sm font-mono"
                  placeholder="Enter extraction instructions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Change Description (optional)
                </label>
                <input
                  type="text"
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm"
                  placeholder="e.g., Fixed selector for product price"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="setAsProduction"
                  checked={setAsProduction}
                  onChange={(e) => setSetAsProduction(e.target.checked)}
                  className="rounded border-stone-300"
                />
                <label htmlFor="setAsProduction" className="text-sm text-stone-700">
                  Set as production version (use for all new executions)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-stone-200 flex justify-end gap-2">
              <Button onClick={() => setShowCreateModal(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={createVersion} disabled={creating || !newInstructions.trim()}>
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Version
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Version Modal */}
      {showViewModal && selectedVersion && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Version {selectedVersion.versionNumber}
                  </h2>
                  <p className="text-sm text-stone-600 mt-1">
                    Created {new Date(selectedVersion.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-stone-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedVersion.changeDescription && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Change Description
                  </label>
                  <p className="text-sm text-stone-900 p-3 bg-amber-50 border border-amber-200 rounded">
                    {selectedVersion.changeDescription}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Instructions
                </label>
                <pre className="text-sm text-stone-900 p-4 bg-stone-50 border border-stone-200 rounded overflow-x-auto whitespace-pre-wrap font-mono">
                  {selectedVersion.instructions}
                </pre>
              </div>
            </div>

            <div className="p-6 border-t border-stone-200 flex justify-end">
              <Button onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
