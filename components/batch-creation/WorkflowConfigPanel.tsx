'use client'

/**
 * Workflow Config Panel - Step 3 of batch creation
 * Shows inherited workflow from project with option to customize
 */

import { useState, useEffect } from 'react'
import { FileText, Edit2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface WorkflowConfigPanelProps {
  projectId: string
  workflowOption: 'use-project' | 'customize' | 'create-new'
  customWorkflow: string
  onWorkflowOptionChange: (option: 'use-project' | 'customize' | 'create-new') => void
  onCustomWorkflowChange: (workflow: string) => void
}

export function WorkflowConfigPanel({
  projectId,
  workflowOption,
  customWorkflow,
  onWorkflowOptionChange,
  onCustomWorkflowChange,
}: WorkflowConfigPanelProps) {
  const [projectWorkflow, setProjectWorkflow] = useState<string>('')
  const [projectName, setProjectName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Fetch project workflow
  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (response.ok) {
          const project = await response.json()
          setProjectName(project.name)
          setProjectWorkflow(project.instructions || '')

          // Initialize custom workflow if empty
          if (!customWorkflow) {
            onCustomWorkflowChange(project.instructions || '')
          }
        }
      } catch (error) {
        console.error('Failed to fetch project:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Workflow Configuration</h3>
        <p className="text-sm text-gray-600">
          Choose how to configure the extraction workflow for this batch.
        </p>
      </div>

      {/* Workflow Options */}
      <div className="space-y-3">
        {/* Option 1: Use Project Workflow */}
        <label
          className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
            workflowOption === 'use-project'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="workflow-option"
              value="use-project"
              checked={workflowOption === 'use-project'}
              onChange={() => onWorkflowOptionChange('use-project')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Use project workflow</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Use the workflow from "{projectName}". Best for consistent extraction across batches.
              </p>
            </div>
          </div>
        </label>

        {/* Option 2: Customize for this batch */}
        <label
          className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
            workflowOption === 'customize'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="workflow-option"
              value="customize"
              checked={workflowOption === 'customize'}
              onChange={() => onWorkflowOptionChange('customize')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Customize for this batch</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Start with project workflow but make adjustments for this specific batch.
              </p>
            </div>
          </div>
        </label>

        {/* Option 3: Create new workflow */}
        <label
          className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
            workflowOption === 'create-new'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="workflow-option"
              value="create-new"
              checked={workflowOption === 'create-new'}
              onChange={() => onWorkflowOptionChange('create-new')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Create new workflow</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Start from scratch with a new workflow configuration.
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Workflow Preview/Edit */}
      {workflowOption === 'use-project' && projectWorkflow && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Current Workflow</h4>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show details
                </>
              )}
            </button>
          </div>

          {showAdvanced ? (
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded p-3">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {projectWorkflow}
                </pre>
              </div>
              <p className="text-xs text-gray-500">
                This workflow will be used for all jobs in this batch
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {projectWorkflow.split('\n')[0]}...
            </div>
          )}
        </div>
      )}

      {/* Custom Workflow Editor */}
      {(workflowOption === 'customize' || workflowOption === 'create-new') && (
        <div className="space-y-3">
          <label className="block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Workflow Instructions
              </span>
              <span className="text-xs text-gray-500">
                {customWorkflow.length} characters
              </span>
            </div>
            <textarea
              value={customWorkflow}
              onChange={(e) => onCustomWorkflowChange(e.target.value)}
              placeholder="Describe what data to extract and how to navigate the websites..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </label>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">💡 Writing Good Instructions</h5>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Be specific about what data to extract</li>
              <li>Describe how to navigate the site (e.g., "Click pricing tab")</li>
              <li>Include fallback behavior for edge cases</li>
              <li>Specify the expected output format</li>
            </ul>
          </div>

          {workflowOption === 'customize' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Changes will only apply to this batch. The project workflow will remain unchanged.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Advanced Settings (Collapsed by default) */}
      <div className="border-t border-gray-200 pt-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide Advanced Settings
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show Advanced Settings
            </>
          )}
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-gray-700">Use AgentQL for extraction</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Recommended for better accuracy and reliability
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-gray-700">Enable auto-retry on failure</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Automatically retry failed extractions up to 3 times
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-700">Save screenshots on error</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Capture screenshots when extraction fails (helps debugging)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
