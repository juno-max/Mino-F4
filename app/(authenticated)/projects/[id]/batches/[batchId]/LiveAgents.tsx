'use client'

import { useEffect, useState } from 'react'
import { LiveExecutionGrid, type RunningJob } from '@/components/live-execution-grid'

interface LiveAgentsProps {
  batchId: string
}

export function LiveAgents({ batchId }: LiveAgentsProps) {
  const [runningJobs, setRunningJobs] = useState<RunningJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRunningJobs = async () => {
      try {
        const response = await fetch(`/api/batches/${batchId}/jobs?status=running`)
        if (response.ok) {
          const result = await response.json()
          const jobs = Array.isArray(result.data) ? result.data : []
          setRunningJobs(jobs)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching running jobs:', error)
        setLoading(false)
      }
    }

    fetchRunningJobs()

    // Poll every 1 second for very responsive updates
    const pollInterval = setInterval(() => {
      fetchRunningJobs()
    }, 1000)

    return () => clearInterval(pollInterval)
  }, [batchId])

  if (loading) {
    return null
  }

  if (runningJobs.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900">
        Running Agents ({runningJobs.length})
      </h2>
      <LiveExecutionGrid runningJobs={runningJobs} maxDisplay={12} />
    </div>
  )
}
