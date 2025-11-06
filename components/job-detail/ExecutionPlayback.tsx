'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'

interface Screenshot {
  timestamp: string
  title: string
  description?: string
  screenshotUrl: string
}

interface ExecutionStep {
  step: string
  status: 'completed' | 'failed' | 'running'
  timestamp: string
  description?: string
}

interface ExecutionPlaybackProps {
  screenshots: Screenshot[] | null
  streamingUrl: string | null
  status: string
  steps: ExecutionStep[]
}

const PHASE_STEPS = [
  { id: 'init', label: 'Initial Navigation', icon: '🌐' },
  { id: 'search', label: 'Service Search', icon: '🔍' },
  { id: 'extract', label: 'Price Extraction', icon: '💰' },
  { id: 'verify', label: 'Verification', icon: '✓' },
  { id: 'output', label: 'Final Output', icon: '📄' },
]

export function ExecutionPlayback({
  screenshots,
  streamingUrl,
  status,
  steps,
}: ExecutionPlaybackProps) {
  const [activePhase, setActivePhase] = useState(0)
  const [currentScreenshot, setCurrentScreenshot] = useState(0)

  const isLive = status === 'running' && streamingUrl

  return (
    <Card padding="none" className="bg-white">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Execution Playback
        </h3>
      </div>

      {/* Phase Timeline */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          {PHASE_STEPS.map((phase, index) => (
            <button
              key={phase.id}
              onClick={() => setActivePhase(index)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                index === activePhase
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1.5">{phase.icon}</span>
              {phase.label}
            </button>
          ))}
        </div>
      </div>

      {/* Playback Area */}
      <div className="aspect-video bg-gray-900 relative">
        {isLive && streamingUrl ? (
          // Live stream
          <iframe
            src={streamingUrl}
            className="w-full h-full"
            title="Live execution stream"
            allow="fullscreen"
          />
        ) : screenshots && screenshots.length > 0 ? (
          // Screenshot playback
          <>
            <img
              src={screenshots[currentScreenshot]?.screenshotUrl}
              alt={screenshots[currentScreenshot]?.title || 'Screenshot'}
              className="w-full h-full object-contain"
            />
            {screenshots.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScreenshot(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentScreenshot
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">🎬</div>
              <div className="text-sm">No playback available</div>
            </div>
          </div>
        )}
      </div>

      {/* Step Info */}
      {screenshots && screenshots[currentScreenshot] && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-900">
            {screenshots[currentScreenshot].title}
          </div>
          {screenshots[currentScreenshot].description && (
            <div className="text-xs text-gray-600 mt-1">
              {screenshots[currentScreenshot].description}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {screenshots[currentScreenshot].timestamp}
          </div>
        </div>
      )}

      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
    </Card>
  )
}
