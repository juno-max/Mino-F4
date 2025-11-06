import { db, jobs, sessions, batches, projects } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { JobDetailClient } from '@/components/job-detail/JobDetailClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  if (!batch) {
    notFound()
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, job.projectId),
  })

  if (!project) {
    notFound()
  }

  const jobSessions = await db.query.sessions.findMany({
    where: eq(sessions.jobId, params.jobId),
    orderBy: [desc(sessions.sessionNumber)],
  })

  return (
    <JobDetailClient
      initialJob={{
        id: job.id,
        batchId: job.batchId,
        projectId: job.projectId,
        goal: job.goal,
        siteUrl: job.siteUrl,
        inputId: job.inputId,
        status: job.status,
        hasGroundTruth: job.hasGroundTruth,
        groundTruthData: job.groundTruthData as Record<string, any> | null,
        csvRowData: job.csvRowData as Record<string, any> | null,
        createdAt: job.createdAt,
      }}
      initialSessions={jobSessions.map((session) => ({
        id: session.id,
        sessionNumber: session.sessionNumber,
        status: session.status,
        detailedStatus: session.detailedStatus,
        blockedReason: session.blockedReason,
        extractedData: session.extractedData as Record<string, any> | null,
        fieldsExtracted: session.fieldsExtracted,
        fieldsMissing: session.fieldsMissing,
        completionPercentage: session.completionPercentage,
        rawOutput: session.rawOutput,
        errorMessage: session.errorMessage,
        screenshots: session.screenshots,
        streamingUrl: session.streamingUrl,
        createdAt: session.createdAt,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      }))}
      project={{
        id: project.id,
        name: project.name,
        instructions: project.instructions,
      }}
      batch={{
        id: batch.id,
        name: batch.name,
      }}
    />
  )
}
