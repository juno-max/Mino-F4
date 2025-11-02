'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RunTestButtonProps {
  projectId: string
  batchId: string
  totalSites: number
  hasGroundTruth: boolean
}

export function RunTestButton({ projectId, batchId, totalSites, hasGroundTruth }: RunTestButtonProps) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [selectedSize, setSelectedSize] = useState<number>(Math.min(10, totalSites))
  const [showOptions, setShowOptions] = useState(false)

  const handleRunTest = async (sampleSize: number) => {
    setIsRunning(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/batches/${batchId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionType: 'test',
          sampleSize,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start test execution')
      }

      const execution = await response.json()
      router.push(`/projects/${projectId}/batches/${batchId}/executions/${execution.id}`)
    } catch (error) {
      console.error('Test execution error:', error)
      setIsRunning(false)
    }
  }

  if (!showOptions) {
    return (
      <Button onClick={() => setShowOptions(true)}>
        <Play className="h-4 w-4 mr-2" />
        Run Test
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-white border border-stone-200 rounded-lg shadow-sm">
      <div className="flex-1">
        <p className="text-sm font-medium text-stone-900 mb-2">Select Sample Size</p>
        <div className="flex gap-2">
          {[10, 20, 50].filter(size => size <= totalSites).map(size => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedSize === size
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {size} sites
            </button>
          ))}
        </div>
        {!hasGroundTruth && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ No ground truth data - test will run but accuracy can't be measured
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => handleRunTest(selectedSize)}
          disabled={isRunning}
        >
          {isRunning ? 'Starting...' : `Run Test (${selectedSize})`}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowOptions(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
