import { db, executions, executionResults, accuracyMetrics } from '@/db'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { formatPercentage, formatDuration } from '@/lib/utils'

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

  const results = await db.query.executionResults.findMany({
    where: eq(executionResults.executionId, params.executionId),
  })

  const metrics = await db.query.accuracyMetrics.findFirst({
    where: eq(accuracyMetrics.executionId, params.executionId),
  })

  const isRunning = execution.status === 'running'
  const isCompleted = execution.status === 'completed'

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/projects/${params.id}/batches/${params.batchId}`} className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Batch
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">
                {execution.executionType === 'test' ? 'Test' : 'Production'} Execution
              </h1>
              <p className="text-sm text-stone-600 mt-1">
                {execution.totalSites} sites • {execution.status}
              </p>
            </div>
            {isCompleted && execution.accuracyPercentage && (
              <div className="text-right">
                <div className="text-4xl font-bold text-amber-600">
                  {execution.accuracyPercentage}%
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
                    {execution.completedSites} / {execution.totalSites}
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(execution.completedSites / execution.totalSites) * 100}%` }}
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
        {isCompleted && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{execution.successfulSites}</div>
                    <div className="text-sm text-stone-600">Successful</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{execution.failedSites}</div>
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
                    <div className="text-2xl font-bold text-stone-900">{execution.totalSites}</div>
                    <div className="text-sm text-stone-600">Total Sites</div>
                  </div>
                  <AlertCircle className="h-8 w-8 text-stone-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      {execution.accuracyPercentage || '-'}%
                    </div>
                    <div className="text-sm text-stone-600">Accuracy</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Per-Column Accuracy */}
        {metrics && metrics.columnAccuracies && (
          <Card>
            <CardHeader>
              <CardTitle>Column-Level Accuracy</CardTitle>
              <CardDescription>Accuracy breakdown by field</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(metrics.columnAccuracies as Record<string, any>).map(([column, data]) => (
                  <div key={column} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-stone-900">{column}</span>
                      <span className="text-sm text-stone-600">
                        {data.accurate} / {data.total} ({data.accuracyPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          data.accuracyPercentage >= 90
                            ? 'bg-green-600'
                            : data.accuracyPercentage >= 70
                            ? 'bg-amber-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${data.accuracyPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Execution Results</CardTitle>
              <CardDescription>{results.length} results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result) => {
                  const extracted = result.extractedData as Record<string, any>
                  const groundTruth = result.groundTruthData as Record<string, any> | null

                  return (
                    <div
                      key={result.id}
                      className={`p-4 border rounded-md ${
                        result.isAccurate === true
                          ? 'border-green-200 bg-green-50'
                          : result.isAccurate === false
                          ? 'border-red-200 bg-red-50'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-stone-900">{result.siteName || result.siteUrl}</div>
                          <div className="text-xs text-stone-500 mt-1">{result.siteUrl}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.matchPercentage && (
                            <span className={`text-sm font-semibold ${
                              result.isAccurate ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {result.matchPercentage}%
                            </span>
                          )}
                          {result.isAccurate === true && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {result.isAccurate === false && <XCircle className="h-5 w-5 text-red-600" />}
                        </div>
                      </div>

                      {result.failureReason && (
                        <div className="text-sm text-red-700 mb-3">
                          ⚠️ {result.failureReason}
                        </div>
                      )}

                      {Object.keys(extracted).length > 0 && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {Object.entries(extracted).map(([key, value]) => {
                            const gtValue = groundTruth?.[key]
                            const matches = gtValue != null &&
                              String(value).toLowerCase() === String(gtValue).toLowerCase()

                            return (
                              <div key={key} className="space-y-1">
                                <div className="font-medium text-stone-700">{key}</div>
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
