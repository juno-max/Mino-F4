import { db, jobs, sessions, batches, projects } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import JobDetailClientV2 from './JobDetailClientV2'

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

  return (
    <JobDetailClientV2
      job={job}
      project={project}
      jobSessions={jobSessions}
      csvRowData={csvRowData}
      groundTruthData={groundTruthData}
      projectId={params.id}
      batchId={job.batchId}
    />
  )
}
