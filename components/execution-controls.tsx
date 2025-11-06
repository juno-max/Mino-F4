'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, Settings2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ExecutionControlsProps {
  executionId: string
  status: string
  concurrency: number
  onPause: () => Promise<void>
  onResume: () => Promise<void>
  onStop: () => Promise<void>
  onConcurrencyChange: (value: number) => Promise<void>
}

export function ExecutionControls({
  executionId,
  status,
  concurrency,
  onPause,
  onResume,
  onStop,
  onConcurrencyChange,
}: ExecutionControlsProps) {
  const [loading, setLoading] = useState(false)
  const [showConcurrencyInput, setShowConcurrencyInput] = useState(false)
  const [newConcurrency, setNewConcurrency] = useState(concurrency)

  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isFinished = status === 'completed' || status === 'stopped' || status === 'failed'

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true)
    try {
      await action()
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConcurrencySubmit = async () => {
    if (newConcurrency === concurrency) {
      setShowConcurrencyInput(false)
      return
    }
    await handleAction(async () => {
      await onConcurrencyChange(newConcurrency)
      setShowConcurrencyInput(false)
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isRunning && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(onPause)}
                  disabled={loading || isFinished}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleAction(onStop)}
                  disabled={loading || isFinished}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
            {isPaused && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleAction(onResume)}
                  disabled={loading || isFinished}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleAction(onStop)}
                  disabled={loading || isFinished}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
            {isFinished && (
              <div className="text-sm text-stone-600">
                Execution {status}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!showConcurrencyInput && !isFinished && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConcurrencyInput(true)}
                disabled={loading}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Concurrency: {concurrency}
              </Button>
            )}
            {showConcurrencyInput && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newConcurrency}
                  onChange={(e) => setNewConcurrency(parseInt(e.target.value) || 1)}
                  className="w-20 px-2 py-1 border border-stone-300 rounded text-sm"
                  disabled={loading}
                />
                <Button
                  size="sm"
                  onClick={handleConcurrencySubmit}
                  disabled={loading}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewConcurrency(concurrency)
                    setShowConcurrencyInput(false)
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="mt-4 text-sm text-stone-600 text-center">
            Processing...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
