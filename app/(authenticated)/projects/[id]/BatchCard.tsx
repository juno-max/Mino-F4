'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card'
import { Calendar, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDistance } from 'date-fns'

interface Batch {
  id: string
  name: string
  description: string | null
  totalSites: number
  hasGroundTruth: boolean
  columnSchema: any[]
  createdAt: Date
}

interface JobStats {
  total: number
  queued: number
  running: number
  completed: number
  error: number
}

interface BatchCardProps {
  batch: Batch
  projectId: string
}

export function BatchCard({ batch, projectId }: BatchCardProps) {
  const [jobStats, setJobStats] = useState<JobStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobStats = async () => {
      try {
        const response = await fetch(`/api/batches/${batch.id}/jobs?statsOnly=true`)
        if (response.ok) {
          const data = await response.json()
          setJobStats(data.stats || {
            total: 0,
            queued: 0,
            running: 0,
            completed: 0,
            error: 0,
          })
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching job stats:', error)
        setLoading(false)
      }
    }

    fetchJobStats()

    // Poll every 3 seconds for live updates
    const pollInterval = setInterval(() => {
      fetchJobStats()
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [batch.id])

  const hasActiveJobs = jobStats && (jobStats.running > 0 || jobStats.queued > 0)

  return (
    <Link href={`/projects/${projectId}/batches/${batch.id}`}>
      <Card className="hover:shadow-fintech-md transition-all duration-200 cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>{batch.name}</CardTitle>
              <CardDescription>{batch.description || 'No description'}</CardDescription>
            </div>
            <div className="text-right text-sm ml-4">
              <div className="font-semibold text-gray-900">{batch.totalSites} sites</div>
              {batch.hasGroundTruth && (
                <div className="text-[rgb(52,211,153)] text-xs mt-1">
                  Has ground truth
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              Created {formatDistance(batch.createdAt, new Date(), { addSuffix: true })}
            </div>
            <div className="text-gray-500">
              {batch.columnSchema.length} columns
            </div>
          </div>

          {/* Job Status */}
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading jobs...</span>
            </div>
          ) : jobStats && jobStats.total > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {jobStats.running > 0 && (
                <div className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="font-medium">{jobStats.running} running</span>
                </div>
              )}
              {jobStats.queued > 0 && (
                <div className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">{jobStats.queued} queued</span>
                </div>
              )}
              {jobStats.completed > 0 && (
                <div className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  <span className="font-medium">{jobStats.completed} completed</span>
                </div>
              )}
              {jobStats.error > 0 && (
                <div className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  <XCircle className="h-3 w-3" />
                  <span className="font-medium">{jobStats.error} error</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400">No jobs yet</div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
