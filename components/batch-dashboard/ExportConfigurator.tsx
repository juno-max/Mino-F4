'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { X, Download } from 'lucide-react'

interface ExportConfiguratorProps {
  onClose: () => void
  onExport: (config: ExportConfig) => Promise<void>
  hasGroundTruth: boolean
  totalJobs: number
  completedJobs: number
  failedJobs: number
}

export interface ExportConfig {
  format: 'csv' | 'json' | 'excel'
  includeInput: boolean
  includeExtracted: boolean
  includeConfidence: boolean
  includeGroundTruth: boolean
  includeScreenshots: boolean
  includeLogs: boolean
  filter: 'all' | 'completed' | 'failed' | 'custom'
}

export function ExportConfigurator({
  onClose,
  onExport,
  hasGroundTruth,
  totalJobs,
  completedJobs,
  failedJobs,
}: ExportConfiguratorProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    includeInput: true,
    includeExtracted: true,
    includeConfidence: true,
    includeGroundTruth: hasGroundTruth,
    includeScreenshots: false,
    includeLogs: false,
    filter: 'all',
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(config)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export results')
    } finally {
      setIsExporting(false)
    }
  }

  const updateConfig = (key: keyof ExportConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const getJobCount = () => {
    switch (config.filter) {
      case 'all': return totalJobs
      case 'completed': return completedJobs
      case 'failed': return failedJobs
      default: return 0
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
        maxWidth: '500px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Export Results</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Export Format */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Export Format:
          </label>
          <div className="space-y-2">
            {[
              { value: 'csv', label: 'CSV (Recommended)', description: 'Compatible with Excel, Google Sheets' },
              { value: 'json', label: 'JSON', description: 'For programmatic access' },
              { value: 'excel', label: 'Excel (.xlsx)', description: 'Native Excel format' },
            ].map(option => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  config.format === option.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={config.format === option.value}
                  onChange={(e) => updateConfig('format', e.target.value)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Include Options */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Include:
          </label>
          <div className="space-y-2">
            {[
              { key: 'includeInput', label: 'Input data (original CSV columns)', enabled: true },
              { key: 'includeExtracted', label: 'Extracted data (all fields found by agent)', enabled: true },
              { key: 'includeConfidence', label: 'Confidence scores', enabled: true },
              { key: 'includeGroundTruth', label: 'Ground truth comparison (if available)', enabled: hasGroundTruth },
              { key: 'includeScreenshots', label: 'Screenshots (separate .zip file)', enabled: true },
              { key: 'includeLogs', label: 'Agent reasoning logs', enabled: true },
            ].map(option => (
              <label
                key={option.key}
                className={`flex items-center gap-3 p-2 ${option.enabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
              >
                <input
                  type="checkbox"
                  checked={config[option.key as keyof ExportConfig] as boolean}
                  onChange={(e) => updateConfig(option.key as keyof ExportConfig, e.target.checked)}
                  disabled={!option.enabled}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Filter:
          </label>
          <div className="space-y-2">
            {[
              { value: 'all', label: `All tasks (${totalJobs})` },
              { value: 'completed', label: `Completed only (${completedJobs})` },
              { value: 'failed', label: `Failed only (${failedJobs})` },
              { value: 'custom', label: 'Custom selection (select rows in table)' },
            ].map(option => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  config.filter === option.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="filter"
                  value={option.value}
                  checked={config.filter === option.value}
                  onChange={(e) => updateConfig('filter', e.target.value)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isExporting}
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : `Download Export (${getJobCount()} rows)`}
        </Button>
      </div>
    </div>
  )
}
