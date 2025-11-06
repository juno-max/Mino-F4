'use client'

/**
 * Batch Confirmation - Step 4 of batch creation
 * Final review before starting the extraction
 */

import { CSVAnalysis } from '@/components/quick-start/UniversalDropZone'
import { CheckCircle, DollarSign, Clock, Target, FlaskConical, Rocket } from 'lucide-react'

interface BatchConfirmationProps {
  csvAnalysis: CSVAnalysis
  batchName: string
  batchDescription: string
  onBatchNameChange: (name: string) => void
  onBatchDescriptionChange: (description: string) => void
  onStartTest: () => void
  onStartFull: () => void
  isCreating: boolean
}

export function BatchConfirmation({
  csvAnalysis,
  batchName,
  batchDescription,
  onBatchNameChange,
  onBatchDescriptionChange,
  onStartTest,
  onStartFull,
  isCreating,
}: BatchConfirmationProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Start</h3>
        <p className="text-sm text-gray-600">
          Review your batch details and start the extraction.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="h-8 w-8 text-emerald-600 flex-shrink-0 mt-1" />
          <div className="flex-1 space-y-3">
            <h4 className="text-lg font-semibold text-emerald-900">
              Everything is configured!
            </h4>
            <div className="space-y-2 text-sm text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span><strong>CSV:</strong> {csvAnalysis.filename} ({csvAnalysis.rowCount} websites)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span><strong>URL Column:</strong> {csvAnalysis.urlColumn}</span>
              </div>
              {csvAnalysis.groundTruthColumns.length > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span><strong>Ground Truth:</strong> {csvAnalysis.groundTruthColumns.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Batch Details */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Batch Details</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch Name
          </label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => onBatchNameChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., customers_20251106"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={batchDescription}
            onChange={(e) => onBatchDescriptionChange(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add notes about this batch..."
          />
        </div>
      </div>

      {/* Estimates */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Estimated Cost</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{csvAnalysis.estimatedCost}</p>
          <p className="text-xs text-gray-500 mt-1">For all {csvAnalysis.rowCount} sites</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Estimated Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{csvAnalysis.estimatedDuration}</p>
          <p className="text-xs text-gray-500 mt-1">Approximate duration</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Expected Success</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">~92%</p>
          <p className="text-xs text-gray-500 mt-1">Based on history</p>
        </div>
      </div>

      {/* Start Options */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Start Options</h4>

        {/* Test Run Option */}
        <div className="bg-white border-2 border-blue-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FlaskConical className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-gray-900 mb-1">Test Run (10 websites)</h5>
              <p className="text-sm text-gray-600 mb-3">
                Recommended to verify quality first. Extract from 10 random websites to ensure everything works as expected.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  ~2-3 minutes
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ~$0.50
                </span>
              </div>
              <button
                onClick={onStartTest}
                disabled={isCreating}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Starting...
                  </>
                ) : (
                  <>
                    <FlaskConical className="h-5 w-5" />
                    Start Test Run
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Full Run Option */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Rocket className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-gray-900 mb-1">Full Run (all {csvAnalysis.rowCount} websites)</h5>
              <p className="text-sm text-gray-600 mb-3">
                Skip testing and run all websites immediately. Only recommended if you're confident in the workflow.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {csvAnalysis.estimatedDuration}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {csvAnalysis.estimatedCost}
                </span>
              </div>
              <button
                onClick={onStartFull}
                disabled={isCreating}
                className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    Start Full Run
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning for Full Run */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>💡 Pro Tip:</strong> We recommend starting with a test run to verify extraction quality before running all {csvAnalysis.rowCount} websites. You can start the full run after reviewing test results.
        </p>
      </div>
    </div>
  )
}
