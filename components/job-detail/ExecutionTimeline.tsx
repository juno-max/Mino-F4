'use client'

import { CheckCircle, XCircle, Clock, AlertCircle, Lock, Timer, Code, Eye } from 'lucide-react'

interface ExecutionStep {
  index: number
  text: string
  type: 'success' | 'error' | 'info' | 'warning' | 'blocked' | 'timeout'
  timestamp?: string
  duration?: number
}

interface ExecutionTimelineProps {
  status: string
  detailedStatus?: string | null
  blockedReason?: string | null
  rawOutput?: string | null
  errorMessage?: string | null
  executionTimeMs?: number | null
  fieldsExtracted?: string[] | null
  fieldsMissing?: string[] | null
}

export function ExecutionTimeline({
  status,
  detailedStatus,
  blockedReason,
  rawOutput,
  errorMessage,
  executionTimeMs,
  fieldsExtracted,
  fieldsMissing,
}: ExecutionTimelineProps) {
  // Parse logs into steps
  const steps: ExecutionStep[] = []

  if (rawOutput) {
    const lines = rawOutput.split('\n').filter(l => l.trim())
    lines.forEach((line, idx) => {
      let type: ExecutionStep['type'] = 'info'

      if (line.includes('✓') || line.includes('success') || line.includes('completed')) {
        type = 'success'
      } else if (line.includes('✗') || line.includes('error') || line.includes('Error:')) {
        type = 'error'
      } else if (line.includes('CAPTCHA') || line.includes('blocked') || line.includes('login required')) {
        type = 'blocked'
      } else if (line.includes('timeout') || line.includes('timed out')) {
        type = 'timeout'
      } else if (line.includes('warning') || line.includes('⚠')) {
        type = 'warning'
      }

      steps.push({
        index: idx,
        text: line,
        type,
      })
    })
  }

  // Add summary step based on detailed status
  const summaryStep = getSummaryStep(status, detailedStatus, blockedReason, fieldsExtracted, fieldsMissing)

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Execution Timeline</h3>
        {executionTimeMs && (
          <div className="text-sm text-gray-600">
            <Clock className="h-4 w-4 inline mr-1" />
            {(executionTimeMs / 1000).toFixed(1)}s
          </div>
        )}
      </div>

      {/* Summary Step */}
      {summaryStep && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${summaryStep.bgColor} ${summaryStep.borderColor}`}>
          <div className="flex items-center gap-3">
            <summaryStep.Icon className={`h-6 w-6 ${summaryStep.iconColor}`} />
            <div className="flex-1">
              <div className={`font-semibold ${summaryStep.textColor}`}>
                {summaryStep.title}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {summaryStep.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Steps */}
      {steps.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {steps.map((step) => {
            const config = getStepConfig(step.type)

            return (
              <div
                key={step.index}
                className={`flex gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <config.Icon className={`h-4 w-4 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-mono ${config.textColor} break-words`}>
                    {step.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Code className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No execution logs available</p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-900 text-sm mb-1">Error Details</div>
              <div className="text-sm text-red-700 font-mono">{errorMessage}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getSummaryStep(
  status: string,
  detailedStatus?: string | null,
  blockedReason?: string | null,
  fieldsExtracted?: string[] | null,
  fieldsMissing?: string[] | null
) {
  const effectiveStatus = detailedStatus || status

  switch (effectiveStatus) {
    case 'completed':
      return {
        Icon: CheckCircle,
        title: 'Extraction Completed Successfully',
        description: `All ${fieldsExtracted?.length || 0} fields were extracted successfully`,
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-300',
        iconColor: 'text-emerald-600',
        textColor: 'text-emerald-900',
      }

    case 'partial':
      return {
        Icon: AlertCircle,
        title: 'Partial Extraction',
        description: `Extracted ${fieldsExtracted?.length || 0} fields successfully. Missing: ${fieldsMissing?.join(', ') || 'unknown'}`,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        iconColor: 'text-yellow-600',
        textColor: 'text-yellow-900',
      }

    case 'blocked':
      const reasonText = getBlockedReasonText(blockedReason)
      return {
        Icon: Lock,
        title: `Blocked: ${reasonText}`,
        description: 'The extraction was blocked and could not complete',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        iconColor: 'text-orange-600',
        textColor: 'text-orange-900',
      }

    case 'timeout':
      return {
        Icon: Timer,
        title: 'Execution Timed Out',
        description: 'The extraction took too long and was terminated',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        iconColor: 'text-red-600',
        textColor: 'text-red-900',
      }

    case 'failed':
      return {
        Icon: XCircle,
        title: 'Extraction Failed',
        description: 'The extraction encountered an error and could not complete',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        iconColor: 'text-red-600',
        textColor: 'text-red-900',
      }

    default:
      return null
  }
}

function getBlockedReasonText(reason?: string | null): string {
  switch (reason) {
    case 'captcha': return 'CAPTCHA Challenge'
    case 'login_required': return 'Login Required'
    case 'paywall': return 'Paywall'
    case 'geo_blocked': return 'Geo-blocked'
    case 'rate_limited': return 'Rate Limited'
    case 'cloudflare': return 'Cloudflare Protection'
    case 'bot_detection': return 'Bot Detection'
    default: return 'Unknown Reason'
  }
}

function getStepConfig(type: ExecutionStep['type']) {
  switch (type) {
    case 'success':
      return {
        Icon: CheckCircle,
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        iconColor: 'text-emerald-600',
        textColor: 'text-emerald-900',
      }
    case 'error':
      return {
        Icon: XCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        textColor: 'text-red-900',
      }
    case 'blocked':
      return {
        Icon: Lock,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        iconColor: 'text-orange-600',
        textColor: 'text-orange-900',
      }
    case 'timeout':
      return {
        Icon: Timer,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        textColor: 'text-red-900',
      }
    case 'warning':
      return {
        Icon: AlertCircle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        textColor: 'text-yellow-900',
      }
    default:
      return {
        Icon: Eye,
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        iconColor: 'text-gray-600',
        textColor: 'text-gray-900',
      }
  }
}
