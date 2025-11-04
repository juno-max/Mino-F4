import { db, batches, executions } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { RunTestButton } from './RunTestButton'

export default async function BatchDetailPage({
  params,
}: {
  params: { id: string; batchId: string }
}) {
  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, params.batchId),
  })

  if (!batch) {
    notFound()
  }

  const batchExecutions = await db.query.executions.findMany({
    where: eq(executions.batchId, params.batchId),
    orderBy: [desc(executions.createdAt)],
  })

  const columnSchema = batch.columnSchema as Array<{
    name: string
    type: string
    isGroundTruth: boolean
    isUrl: boolean
  }>

  const csvData = batch.csvData as Array<Record<string, any>>
  const gtColumns = columnSchema.filter(col => col.isGroundTruth)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/projects/${params.id}`} className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">{batch.name}</h1>
              {batch.description && (
                <p className="text-sm text-stone-600 mt-1">{batch.description}</p>
              )}
            </div>
            <RunTestButton
              projectId={params.id}
              batchId={params.batchId}
              totalJobs={batch.totalSites}
              hasGroundTruth={batch.hasGroundTruth}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-stone-900">{batch.totalSites}</div>
              <div className="text-sm text-stone-600">Total Sites</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-stone-900">{columnSchema.length}</div>
              <div className="text-sm text-stone-600">Columns</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-stone-900">{gtColumns.length}</div>
              <div className="text-sm text-stone-600">Ground Truth Columns</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-stone-900">{batchExecutions.length}</div>
              <div className="text-sm text-stone-600">Test Runs</div>
            </CardContent>
          </Card>
        </div>

        {/* Column Schema */}
        <Card>
          <CardHeader>
            <CardTitle>Column Schema</CardTitle>
            <CardDescription>
              {columnSchema.length} columns ({gtColumns.length} have ground truth data)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {columnSchema.map((col, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 rounded-md border border-stone-200">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-stone-900">{col.name}</span>
                    {col.isUrl && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-amber-800 rounded-full font-medium">
                        URL
                      </span>
                    )}
                    {col.isGroundTruth && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-medium">
                        Ground Truth
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-stone-600">{col.type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>First 10 rows of {csvData.length} total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-stone-200 bg-stone-50">
                    {columnSchema.map((col, idx) => (
                      <th key={idx} className="text-left p-3 font-semibold text-xs text-stone-500 uppercase tracking-wider">
                        {col.name}
                        {col.isGroundTruth && <span className="text-green-600 ml-1">✓</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      {columnSchema.map((col, colIdx) => (
                        <td key={colIdx} className="p-3 text-stone-900 max-w-xs truncate">
                          {row[col.name] || <span className="text-stone-600">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvData.length > 10 && (
              <p className="text-sm text-stone-500 mt-4 text-center">
                Showing 10 of {csvData.length} rows
              </p>
            )}
          </CardContent>
        </Card>

        {/* Test Executions */}
        {batchExecutions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Executions</CardTitle>
              <CardDescription>{batchExecutions.length} test runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {batchExecutions.map((execution) => (
                  <Link
                    key={execution.id}
                    href={`/projects/${params.id}/batches/${params.batchId}/executions/${execution.id}`}
                  >
                    <div className="p-4 border border-stone-200 rounded-lg hover:border-amber-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-stone-900">
                            {execution.executionType === 'test' ? 'Test Run' : 'Production Run'}
                          </div>
                          <div className="text-sm text-stone-600 mt-1">
                            {execution.totalJobs} sites • {execution.status}
                          </div>
                        </div>
                        {execution.accuracyPercentage && (
                          <div className="text-right">
                            <div className="text-2xl font-semibold text-amber-700">
                              {execution.accuracyPercentage}%
                            </div>
                            <div className="text-xs text-stone-500">Accuracy</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
