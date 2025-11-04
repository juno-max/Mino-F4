import { db, executions, jobs, sessions } from '@/db'
import { eq, and, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, TrendingUp, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function ExecutionResultsPage({
  params,
}: {
  params: { id: string; batchId: string; executionId: string }
}) {
  const execution = await db.query.executions.findFirst({
    where: eq(executions.id, params.executionId),
  })

  if (!execution) {
    notFound()
  }

  // Get jobs for this execution (jobs are linked to batch, and execution is batch-specific)
  const executionJobs = await db.query.jobs.findMany({
    where: eq(jobs.batchId, params.batchId),
    orderBy: [desc(jobs.createdAt)],
  })

  // Get sessions for each job
  const jobsWithSessions = await Promise.all(
    executionJobs.map(async (job) => {
      const jobSessions = await db.query.sessions.findMany({
        where: eq(sessions.jobId, job.id),
        orderBy: [desc(sessions.sessionNumber)],
      })
      return { ...job, sessions: jobSessions }
    })
  )

  const isRunning = execution.status === 'running'
  const isCompleted = execution.status === 'completed'

  // Calculate accuracy from jobs
  const evaluatedJobs = jobsWithSessions.filter(j => j.isEvaluated)
  const passedJobs = jobsWithSessions.filter(j => j.evaluationResult === 'pass')
  const accuracyPercentage = evaluatedJobs.length > 0
    ? Math.round((passedJobs.length / evaluatedJobs.length) * 100)
    : null

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/projects/${params.id}/batches/${params.batchId}`} className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Batch
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">
                {execution.executionType === 'test' ? 'Test' : 'Production'} Execution
              </h1>
              <p className="text-sm text-stone-600 mt-1">
                {execution.totalJobs} sites • {execution.status}
              </p>
            </div>
            {isCompleted && accuracyPercentage !== null && (
              <div className="text-right">
                <div className="text-4xl font-semibold text-amber-700">
                  {accuracyPercentage}%
                </div>
                <div className="text-sm text-stone-600">Overall Accuracy</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Progress */}
        {isRunning && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Progress</span>
                  <span className="font-medium text-stone-900">
                    {execution.completedJobs} / {execution.totalJobs}
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(execution.completedJobs / execution.totalJobs) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-stone-500 text-center mt-2">
                  Test is running... Refresh page to see updated results
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-green-600">
                    {jobsWithSessions.filter(j => j.status === 'completed').length}
                  </div>
                  <div className="text-sm text-stone-600">Completed</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-red-600">
                    {jobsWithSessions.filter(j => j.status === 'error').length}
                  </div>
                  <div className="text-sm text-stone-600">Failed</div>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {jobsWithSessions.filter(j => j.status === 'running').length}
                  </div>
                  <div className="text-sm text-stone-600">Running</div>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-amber-700">
                    {accuracyPercentage !== null ? `${accuracyPercentage}%` : '-'}
                  </div>
                  <div className="text-sm text-stone-600">Accuracy</div>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-700" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        {jobsWithSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Job Results</CardTitle>
              <CardDescription>{jobsWithSessions.length} jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobsWithSessions.map((job) => {
                  const latestSession = job.sessions[0]
                  const extractedData = latestSession?.extractedData as Record<string, any> | null
                  const groundTruthData = job.groundTruthData as Record<string, any> | null

                  const statusConfig = {
                    queued: { color: 'text-stone-500', bgColor: 'bg-stone-100', label: 'Queued' },
                    running: { color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Running' },
                    completed: { color: 'text-green-500', bgColor: 'bg-green-100', label: 'Completed' },
                    error: { color: 'text-red-500', bgColor: 'bg-red-100', label: 'Error' },
                  }

                  const status = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.queued

                  return (
                    <div
                      key={job.id}
                      className={`p-4 border rounded-lg transition-all duration-200 ${
                        job.evaluationResult === 'pass'
                          ? 'border-green-200 bg-green-50'
                          : job.evaluationResult === 'fail'
                          ? 'border-red-200 bg-red-50'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-stone-900">{job.siteName || 'Site'}</div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.bgColor} ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="text-xs text-stone-500 mt-1">{job.siteUrl}</div>
                          {job.sessions.length > 0 && (
                            <div className="text-xs text-stone-500 mt-1">
                              {job.sessions.length} session{job.sessions.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {job.isEvaluated && (
                            <div className="text-right">
                              {job.evaluationResult === 'pass' && <CheckCircle className="h-5 w-5 text-green-600" />}
                              {job.evaluationResult === 'fail' && <XCircle className="h-5 w-5 text-red-600" />}
                            </div>
                          )}
                          <Link href={`/projects/${params.id}/jobs/${job.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Job
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {latestSession?.errorMessage && (
                        <div className="text-sm text-red-700 mb-3 p-2 bg-red-50 rounded">
                          ⚠️ {latestSession.errorMessage}
                        </div>
                      )}

                      {extractedData && Object.keys(extractedData).length > 0 && (
                        <div className="grid grid-cols-2 gap-4 text-sm border-t border-stone-200 pt-3">
                          {Object.entries(extractedData).slice(0, 4).map(([key, value]) => {
                            const gtValue = groundTruthData?.[key]
                            const matches = gtValue != null &&
                              String(value).toLowerCase() === String(gtValue).toLowerCase()

                            return (
                              <div key={key} className="space-y-1">
                                <div className="font-medium text-stone-700 text-xs">{key}</div>
                                <div className={matches ? 'text-green-700' : 'text-stone-900'}>
                                  {String(value || '-')}
                                </div>
                                {gtValue != null && !matches && (
                                  <div className="text-xs text-stone-500">
                                    Expected: {String(gtValue)}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
