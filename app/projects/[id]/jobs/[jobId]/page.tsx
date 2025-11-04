import { db, jobs, sessions, batches, projects } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import JobDetailClient from './JobDetailClient'

export default async function JobDetailPage({
  params,
}: {
  params: { id: string; jobId: string }
}) {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, params.jobId),
  })

  if (!job) {
    notFound()
  }

  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, job.batchId),
  })

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, job.projectId),
  })

  const jobSessions = await db.query.sessions.findMany({
    where: eq(sessions.jobId, params.jobId),
    orderBy: [desc(sessions.sessionNumber)],
  })

  const csvRowData = job.csvRowData as Record<string, any> | null
  const groundTruthData = job.groundTruthData as Record<string, any> | null

  const statusConfig = {
    queued: { icon: Clock, color: 'text-stone-500', bgColor: 'bg-stone-100', label: 'Queued' },
    running: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Running' },
    completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Completed' },
    error: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Error' },
  }

  const statusInfo = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.queued
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/`}
            className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-stone-900">Job Details</h1>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
                  <StatusIcon className={`h-4 w-4 ${statusInfo.color} ${job.status === 'running' ? 'animate-spin' : ''}`} />
                  <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
              </div>
              <p className="text-sm text-stone-600 font-mono">{job.siteUrl}</p>
              {job.siteName && (
                <p className="text-sm text-stone-700 mt-1">{job.siteName}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobDetailClient
          job={job}
          project={project}
          jobSessions={jobSessions}
          csvRowData={csvRowData}
          groundTruthData={groundTruthData}
          projectId={params.id}
        />
      </div>
    </div>
  )
}
