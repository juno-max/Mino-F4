'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface Job {
  id: string
  siteUrl: string
  siteName: string | null
  status: string
  isEvaluated: boolean
  evaluationResult: string | null
  createdAt: string
}

interface BatchJobsListProps {
  projectId: string
  batchId: string
}

export function BatchJobsList({ projectId, batchId }: BatchJobsListProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [projectId, batchId])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/jobs`)
      if (!response.ok) throw new Error('Failed to fetch jobs')

      const allJobs = await response.json()
      // Filter jobs for this batch
      const batchJobs = allJobs.filter((job: any) => job.batchId === batchId)
      setJobs(batchJobs)
      setError(null)
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchJobs} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>Individual jobs created from your batch data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-stone-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-stone-400" />
            <p className="text-sm">No jobs yet</p>
            <p className="text-xs text-stone-400 mt-1">
              Jobs will be created when you run a test execution
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = {
    queued: { color: 'text-stone-500', bgColor: 'bg-stone-100', label: 'Queued', icon: Clock },
    running: { color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Running', icon: Loader2 },
    completed: { color: 'text-green-500', bgColor: 'bg-green-100', label: 'Completed', icon: CheckCircle },
    error: { color: 'text-red-500', bgColor: 'bg-red-100', label: 'Error', icon: XCircle },
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>{jobs.length} jobs created</CardDescription>
          </div>
          <Button onClick={fetchJobs} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
          {jobs.map((job) => {
            const status = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.queued
            const StatusIcon = status.icon

            return (
              <div
                key={job.id}
                className={`p-4 border rounded-lg transition-all duration-200 ${
                  job.evaluationResult === 'pass'
                    ? 'border-green-200 bg-green-50'
                    : job.evaluationResult === 'fail'
                    ? 'border-red-200 bg-red-50'
                    : 'border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-stone-900 truncate">
                        {job.siteName || 'Site'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.bgColor} ${status.color} flex items-center gap-1`}>
                        <StatusIcon className={`h-3 w-3 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                        {status.label}
                      </span>
                      {job.isEvaluated && (
                        <span className="text-xs">
                          {job.evaluationResult === 'pass' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {job.evaluationResult === 'fail' && <XCircle className="h-4 w-4 text-red-600" />}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-stone-600 truncate">{job.siteUrl}</div>
                  </div>
                  <Link href={`/projects/${projectId}/jobs/${job.id}`}>
                    <Button size="sm" variant="outline" className="ml-4">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
