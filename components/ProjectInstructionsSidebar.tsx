'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/Button'
import { Tag, ProjectInstructionsData } from '@/lib/project-instructions-data'

export function TagChip({ tag, onToggle }: { tag: Tag; onToggle?: (label: string) => void }) {
  if (tag.active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-green-600/20 text-green-400 border border-green-600/30">
        {tag.label}
        {onToggle ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(tag.label)
            }}
            className="ml-0.5 hover:bg-green-600/30 rounded-full p-0.5 transition-fintech flex-shrink-0"
            aria-label={`Remove ${tag.label}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <X className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
        )}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-stone-50 text-stone-600 border border-stone-300">
      {tag.label}
    </span>
  )
}

interface ProjectInstructionsSidebarProps {
  data: ProjectInstructionsData
  showActions?: boolean
  onSave?: () => void
  onCancel?: () => void
}

export function ProjectInstructionsSidebar({
  data,
  showActions = false,
  onSave,
  onCancel
}: ProjectInstructionsSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin-dark">
        {/* Overview Section */}
        <div>
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3 px-1">Overview</h3>
          <div className="space-y-3">
            <div className="px-4 py-3 bg-stone-50 rounded-lg text-stone-900 font-medium border border-stone-300">
              {data.overview.projectName}
            </div>
            <div className="relative pl-4 pr-4 py-3 bg-green-600/10 rounded text-sm text-stone-700 border-l-4 border-green-500">
              {data.overview.instructions}
            </div>
          </div>
        </div>

        {/* Input Parameters Section */}
        <div>
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3 px-1">Input Parameters</h3>
          <div className="flex flex-wrap gap-2">
            {data.inputParameters.map((param, idx) => (
              <TagChip key={idx} tag={param} />
            ))}
          </div>
        </div>

        {/* Navigation Rules Section */}
        <div>
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3 px-1">Navigation Rules</h3>
          <div className="flex flex-wrap gap-2">
            {data.navigationRules.map((rule, idx) => (
              <TagChip key={idx} tag={rule} />
            ))}
          </div>
        </div>

        {/* Location Matching Section */}
        <div>
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3 px-1">Location Matching</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {data.locationMatching.options.map((option, idx) => (
                <TagChip key={idx} tag={option} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <TagChip tag={data.locationMatching.fallback} />
            </div>
          </div>
        </div>

        {/* Service Matching Section */}
        <div>
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3 px-1">Service Matching</h3>
          <div className="space-y-3">
            <div>
              <div className="flex flex-wrap gap-2">
                {data.serviceMatching.types.map((type, idx) => (
                  <TagChip key={idx} tag={type} />
                ))}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                {data.serviceMatching.checks.map((check, idx) => (
                  <TagChip key={idx} tag={check} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Extraction Section */}
        <div>
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3 px-1">Pricing Extraction</h3>
          <div className="flex flex-wrap gap-2">
            {data.pricingExtraction.map((method, idx) => (
              <TagChip key={idx} tag={method} />
            ))}
          </div>
        </div>

        {/* Desired JSON Output Section */}
        <div>
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3 px-1">Desired JSON Output</h3>
          <div className="bg-stone-50 border border-stone-300 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-stone-700 font-mono whitespace-pre-wrap">
              {data.desiredOutput}
            </pre>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex-shrink-0 px-4 py-4 border-t border-stone-200 flex gap-3">
          <Button onClick={onCancel} variant="outline" className="flex-1 bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100" size="sm">
            Cancel
          </Button>
          <Button onClick={onSave} className="flex-1" size="sm">
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}

