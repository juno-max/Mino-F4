import { db, projects, batches, jobs } from '@/db'
import { desc, sql, count, and, eq, or } from 'drizzle-orm'
import Link from 'next/link'
import { Play, CheckCircle, XCircle, Clock, TrendingUp, Folder, FileText, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { MetricCard, MetricGrid } from '@/components/MetricCard'
import { formatDistance } from 'date-fns'
import { getUserWithOrganization } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  // Get authenticated user with organization
  const user = await getUserWithOrganization()

  // Fetch aggregate stats for this organization
  const allProjects = await db.query.projects.findMany({
    where: eq(projects.organizationId, user.organizationId),
    orderBy: [desc(projects.updatedAt)],
  })

  // Get project IDs for filtering batches
  const orgProjectIds = allProjects.map(p => p.id)

  // Get batches that belong to this organization's projects
  const allBatches = await db.query.batches.findMany({
    orderBy: [desc(batches.updatedAt)],
    limit: 50,
  }).then(batchList => batchList.filter(b => orgProjectIds.includes(b.projectId)).slice(0, 10))

  // Get job stats
  const jobStats = await db
    .select({
      totalJobs: count(),
      runningJobs: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'running' THEN 1 END)`,
      completedJobs: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'completed' THEN 1 END)`,
      errorJobs: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'error' THEN 1 END)`,
    })
    .from(jobs)
    .then(rows => rows[0] || { totalJobs: 0, runningJobs: 0, completedJobs: 0, errorJobs: 0 })

  const successRate = Number(jobStats.totalJobs) > 0
    ? Math.round((Number(jobStats.completedJobs) / Number(jobStats.totalJobs)) * 100)
    : 0

  // Recent activity (last 5 updated batches)
  const recentActivity = allBatches.slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      {/* Hero Section */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back! Here's your automation overview
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Stats Grid - New MetricCard Components */}
        <MetricGrid columns={4}>
          <MetricCard
            label="Total Projects"
            value={allProjects.length}
            icon={<Folder className="h-5 w-5" />}
            color="blue"
          />

          <MetricCard
            label="Active Jobs"
            value={Number(jobStats.runningJobs)}
            icon={<Play className="h-5 w-5" />}
            color="emerald"
          />

          <MetricCard
            label="Completed"
            value={Number(jobStats.completedJobs)}
            icon={<CheckCircle className="h-5 w-5" />}
            color="blue"
          />

          <MetricCard
            label="Success Rate"
            value={`${successRate}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            color={successRate >= 90 ? 'emerald' : successRate >= 70 ? 'amber' : 'red'}
            trend={{
              value: successRate >= 90 ? 5 : successRate >= 70 ? 0 : -5,
              direction: successRate >= 90 ? 'up' : successRate >= 70 ? 'neutral' : 'down',
              period: 'vs last week'
            }}
          />
        </MetricGrid>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <div className="px-4 py-2 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
                <p className="text-xs text-gray-600 mt-0.5">Your latest batch updates</p>
              </div>

              {recentActivity.length === 0 ? (
                <div className="p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Create your first project and upload a CSV to get started
                  </p>
                  <Link href="/projects/new">
                    <Button variant="primary" size="md">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentActivity.map((batch) => (
                    <Link
                      key={batch.id}
                      href={`/projects/${batch.projectId}/batches/${batch.id}`}
                      className="block px-4 py-3 table-row-hover"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {batch.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {batch.totalSites} sites • Updated {formatDistance(batch.updatedAt, new Date(), { addSuffix: true })}
                          </p>
                        </div>

                        {batch.hasGroundTruth && (
                          <div className="ml-4 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                            Has GT
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card>
              <div className="px-4 py-2 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <Link href="/projects/new">
                  <Button variant="primary" size="md" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                </Link>

                <Link href="/projects">
                  <Button variant="outline" size="md" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV to Batch
                  </Button>
                </Link>

                <Link href="/projects">
                  <Button variant="outline" size="md" className="w-full justify-start">
                    <Folder className="h-4 w-4 mr-2" />
                    View All Projects
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/30 border-blue-200">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Pro Tip</h3>
                <p className="text-xs text-blue-800 mb-2">
                  Press <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-xs font-semibold">Cmd+K</kbd> to
                  quickly search and navigate.
                </p>
                <p className="text-xs text-blue-700">
                  Press <kbd className="px-1 py-0.5 bg-blue-200 rounded font-semibold text-xs">?</kbd> for shortcuts.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
