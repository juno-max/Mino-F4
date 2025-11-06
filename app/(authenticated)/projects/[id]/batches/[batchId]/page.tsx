import { db, batches, executions, jobs, projects } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, Table, History, FileText } from 'lucide-react'
import { Button } from '@/components/Button'
import { ScrollResponsiveHeader } from '@/components/ScrollResponsiveHeader'
import { StatusBadge } from '@/components/StatusBadge'

// New unified dashboard
import { UnifiedBatchDashboard } from './UnifiedBatchDashboard'
import { CollapsibleSection } from '@/components/batch-dashboard/CollapsibleSection'

// Existing components for collapsible sections
import { BulkGTEditor } from './BulkGTEditor'
import { ColumnMetrics } from './ColumnMetrics'
import { AccuracyTrendChart } from './AccuracyTrendChart'
import { BatchActions } from '@/components/batches/BatchActions'
import { getUserWithOrganization } from '@/lib/auth-helpers'

export default async function BatchDetailPage({
  params,
}: {
  params: { id: string; batchId: string }
}) {
  const user = await getUserWithOrganization()

  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, params.batchId),
  })

  if (!batch) {
    notFound()
  }

  // Fetch project to get campaign instructions
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, batch.projectId),
  })

  if (!project) {
    notFound()
  }

  // Fetch all projects for this organization (for moving batch between projects)
  const allProjects = await db.query.projects.findMany({
    where: eq(projects.organizationId, user.organizationId),
    columns: {
      id: true,
      name: true,
    },
  })

  const batchExecutions = await db.query.executions.findMany({
    where: eq(executions.batchId, params.batchId),
    orderBy: [desc(executions.createdAt)],
  })

  const batchJobs = await db.query.jobs.findMany({
    where: eq(jobs.batchId, params.batchId),
    with: {
      sessions: {
        limit: 1,
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
      },
    },
  })

  const columnSchema = batch.columnSchema as Array<{
    name: string
    type: string
    isGroundTruth: boolean
    isUrl: boolean
  }>

  const csvData = batch.csvData as Array<Record<string, any>>
  const gtColumns = columnSchema.filter(col => col.isGroundTruth)

  // Calculate job counts by status
  const jobCounts = batchJobs.reduce(
    (acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    },
    {
      completed: 0,
      failed: 0,
      queued: 0,
      running: 0,
    } as Record<string, number>
  )

  // Calculate overall status for header
  const overallStatus = jobCounts.running > 0 ? 'running' :
                        jobCounts.failed > 0 ? 'failed' :
                        jobCounts.completed === batchJobs.length ? 'completed' : 'queued'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Scroll-Responsive Compressed Header */}
      <ScrollResponsiveHeader
        backHref={`/projects/${params.id}`}
        backLabel="Project"
        title={batch.name}
        subtitle={batch.description || undefined}
        metadata={[
          { label: 'sites', value: batch.totalSites },
          { label: 'cols', value: columnSchema.length },
          ...(gtColumns.length > 0 ? [{ label: 'GT cols', value: gtColumns.length, highlight: true }] : []),
        ]}
        status={<StatusBadge status={overallStatus} size="sm" />}
        actions={
          <div className="flex items-center gap-2">
            {gtColumns.length > 0 && (
              <Link href={`/projects/${params.id}/batches/${params.batchId}/analytics`}>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </Button>
              </Link>
            )}
            <BatchActions
              batch={{
                id: batch.id,
                name: batch.name,
                description: batch.description,
                projectId: batch.projectId,
                totalSites: batch.totalSites,
              }}
              projects={allProjects}
            />
          </div>
        }
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Unified Batch Dashboard */}
        <UnifiedBatchDashboard
          projectId={params.id}
          batchId={params.batchId}
          columnSchema={columnSchema}
          hasGroundTruth={batch.hasGroundTruth}
          totalSites={batch.totalSites}
          campaignInstructions={project.instructions}
        />

        {/* LEVEL 4: Advanced Features (Collapsed by Default) */}

        {/* Analytics Section */}
        {gtColumns.length > 0 && (
          <CollapsibleSection
            title="Analytics"
            subtitle="Accuracy trends and column-level metrics"
            icon={<BarChart3 className="h-5 w-5" />}
            badge={`${gtColumns.length} columns`}
            storageKey={`batch-${params.batchId}-analytics`}
          >
            <div className="space-y-6 pt-6">
              <AccuracyTrendChart batchId={params.batchId} />
              <ColumnMetrics batchId={params.batchId} />
            </div>
          </CollapsibleSection>
        )}

        {/* Data Preview Section */}
        <CollapsibleSection
          title="Data Preview"
          subtitle={`First 10 rows of ${csvData.length} total`}
          icon={<Table className="h-5 w-5" />}
          badge={`${csvData.length} rows`}
          storageKey={`batch-${params.batchId}-data`}
        >
          <div className="pt-6 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  {columnSchema.map((col, idx) => (
                    <th key={idx} className="text-left p-3 font-semibold text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {col.name}
                      {col.isGroundTruth && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                          GT
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 10).map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {columnSchema.map((col, colIdx) => (
                      <td key={colIdx} className="p-3 text-gray-900 max-w-xs truncate">
                        {row[col.name] || <span className="text-gray-400">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 10 && (
              <p className="text-sm text-gray-500 mt-4 text-center py-2">
                Showing 10 of {csvData.length} rows
              </p>
            )}
          </div>
        </CollapsibleSection>

        {/* Execution History Section */}
        {batchExecutions.length > 0 && (
          <CollapsibleSection
            title="Execution History"
            subtitle="Past test runs and results"
            icon={<History className="h-5 w-5" />}
            badge={`${batchExecutions.length} runs`}
            storageKey={`batch-${params.batchId}-history`}
          >
            <div className="pt-6 space-y-3">
              {batchExecutions.map((execution) => (
                <Link
                  key={execution.id}
                  href={`/projects/${params.id}/batches/${params.batchId}/executions/${execution.id}`}
                >
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-[rgb(52,211,153)] hover:shadow-fintech-md transition-all duration-200 cursor-pointer bg-white group">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 group-hover:text-[rgb(52,211,153)] transition-colors">
                            {execution.executionType === 'test' ? 'Test Run' : 'Production Run'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            execution.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : execution.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {execution.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1 flex items-center gap-3">
                          <span>{execution.totalJobs} jobs</span>
                          {execution.createdAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(execution.createdAt).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {execution.accuracyPercentage !== null && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[rgb(52,211,153)]">
                            {execution.accuracyPercentage}%
                          </div>
                          <div className="text-xs text-gray-500">Accuracy</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Ground Truth Editor Section */}
        {gtColumns.length > 0 && (
          <CollapsibleSection
            title="Ground Truth Editor"
            subtitle="Bulk edit ground truth values"
            icon={<FileText className="h-5 w-5" />}
            badge={`${gtColumns.length} columns`}
            storageKey={`batch-${params.batchId}-gt-editor`}
          >
            <div className="pt-6">
              <BulkGTEditor
                batchId={params.batchId}
                jobs={batchJobs.map(job => ({
                  id: job.id,
                  inputId: job.inputId,
                  siteUrl: job.siteUrl,
                  groundTruthData: job.groundTruthData as Record<string, any> | null,
                }))}
                gtColumns={gtColumns}
              />
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  )
}