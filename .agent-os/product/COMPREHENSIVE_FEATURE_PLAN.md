# MINO v2 - Comprehensive Feature Planning Document

**Version**: 1.0
**Date**: 2025-11-04
**Status**: Complete System Planning

---

## Table of Contents

1. [Ground Truth Management System](#1-ground-truth-management-system-priority)
2. [Failure Pattern Analysis](#2-failure-pattern-analysis)
3. [Accuracy Analytics Dashboard](#3-accuracy-analytics-dashboard)
4. [Batch Export Enhancement](#4-batch-export-enhancement)
5. [Screenshot Playback System](#5-screenshot-playback-system)
6. [Instruction Versioning & A/B Testing](#6-instruction-versioning--ab-testing)
7. [Advanced Filtering & Search](#7-advanced-filtering--search)
8. [Cost Estimation & Tracking](#8-cost-estimation--tracking)
9. [User Authentication System](#9-user-authentication-system)
10. [Complete User Flow Diagrams](#10-complete-user-flow-diagrams)

---

## 1. Ground Truth Management System (PRIORITY)

**Current State**: 70% complete - Detection, storage, and basic evaluation implemented
**Missing**: Bulk editing UI, column-level metrics, trend analysis, improved comparison

### 1.1 Problem Statement

Users need to:
- Efficiently set ground truth values for hundreds/thousands of jobs
- Understand accuracy at both row-level and column-level granularity
- Track accuracy improvements over time
- Quickly identify which fields are causing failures
- Export data with ground truth comparisons for analysis

### 1.2 User Stories

**US-GT-1**: As a QA engineer, I want to bulk edit ground truth values for multiple jobs simultaneously, so I can efficiently establish baselines for large datasets.

**US-GT-2**: As a data analyst, I want to see column-level accuracy metrics across my batch, so I can identify which fields the agent struggles with most.

**US-GT-3**: As a product manager, I want to see accuracy trends over time, so I can measure the impact of instruction improvements.

**US-GT-4**: As a developer, I want a clear visual diff between extracted and expected values, so I can quickly identify discrepancies.

**US-GT-5**: As a compliance officer, I want to export batch results with ground truth comparisons, so I can audit agent performance.

### 1.3 Database Schema Changes

**New Table: `ground_truth_column_metrics`**
```typescript
export const groundTruthColumnMetrics = pgTable('ground_truth_column_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  columnName: text('column_name').notNull(),

  // Accuracy metrics
  totalJobs: integer('total_jobs').notNull(),
  jobsWithGroundTruth: integer('jobs_with_ground_truth').notNull(),
  exactMatches: integer('exact_matches').notNull(),
  partialMatches: integer('partial_matches').notNull(),
  mismatches: integer('mismatches').notNull(),
  missingExtractions: integer('missing_extractions').notNull(),

  // Aggregated statistics
  accuracyPercentage: real('accuracy_percentage'), // exactMatches / jobsWithGroundTruth * 100
  avgConfidenceScore: real('avg_confidence_score'),

  // Failure patterns
  commonErrors: jsonb('common_errors').$type<Array<{
    errorType: string
    count: number
    examples: string[]
  }>>(),

  // Timestamps
  calculatedAt: timestamp('calculated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Add index for fast batch lookups
CREATE INDEX idx_gt_column_metrics_batch ON ground_truth_column_metrics(batch_id);
CREATE INDEX idx_gt_column_metrics_batch_column ON ground_truth_column_metrics(batch_id, column_name);
```

**Update: `batches` table**
```typescript
// Add to batches table
lastGtMetricsCalculation: timestamp('last_gt_metrics_calculation'),
overallAccuracy: real('overall_accuracy'), // Cache for dashboard
```

**Update: `jobs` table - Enhance ground truth storage**
```typescript
// Current: groundTruthData JSONB
// Enhance with metadata
groundTruthMetadata: jsonb('ground_truth_metadata').$type<{
  setBy: 'manual' | 'bulk_import' | 'auto_detected' | 'api',
  setAt: string, // ISO timestamp
  source: string, // CSV column name or 'manual_entry'
  confidence: number, // 0-1 for auto-detected values
  verifiedBy?: string, // User ID who verified
  verifiedAt?: string,
}>(),
```

### 1.4 Backend API Endpoints

**1.4.1 Bulk Ground Truth Management**

```typescript
// POST /api/batches/[id]/ground-truth/bulk-set
// Set ground truth for multiple jobs at once
interface BulkSetGroundTruthRequest {
  updates: Array<{
    jobId: string
    groundTruthData: Record<string, any>
  }>
  metadata?: {
    source: string
    setBy: string
  }
}

interface BulkSetGroundTruthResponse {
  success: number
  failed: number
  errors: Array<{ jobId: string; error: string }>
}

// Implementation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params
  const { updates, metadata } = await request.json()

  const results = { success: 0, failed: 0, errors: [] }

  // Use transaction for atomicity
  await db.transaction(async (tx) => {
    for (const update of updates) {
      try {
        await tx.update(jobs)
          .set({
            groundTruthData: update.groundTruthData,
            groundTruthMetadata: {
              setBy: metadata?.setBy || 'bulk_import',
              setAt: new Date().toISOString(),
              source: metadata?.source || 'bulk_edit',
              confidence: 1.0,
            },
            hasGroundTruth: true,
          })
          .where(eq(jobs.id, update.jobId))

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          jobId: update.jobId,
          error: error.message,
        })
      }
    }
  })

  // Trigger metrics recalculation asynchronously
  recalculateColumnMetrics(batchId).catch(console.error)

  return NextResponse.json(results)
}
```

```typescript
// POST /api/batches/[id]/ground-truth/bulk-edit
// Edit specific fields across multiple jobs
interface BulkEditGroundTruthRequest {
  jobIds: string[]
  fieldName: string
  operation: 'set' | 'clear' | 'copy_from_extracted'
  value?: any // For 'set' operation
}

export async function POST(request: NextRequest) {
  const { jobIds, fieldName, operation, value } = await request.json()

  if (operation === 'set') {
    await db.update(jobs)
      .set({
        groundTruthData: sql`jsonb_set(
          COALESCE(ground_truth_data, '{}'::jsonb),
          ${`{${fieldName}}`},
          ${JSON.stringify(value)}::jsonb
        )`,
        hasGroundTruth: true,
      })
      .where(inArray(jobs.id, jobIds))
  } else if (operation === 'copy_from_extracted') {
    // Copy from most recent session's extracted data
    const jobsToUpdate = await db.query.jobs.findMany({
      where: inArray(jobs.id, jobIds),
      with: {
        sessions: {
          orderBy: [desc(sessions.createdAt)],
          limit: 1,
        },
      },
    })

    for (const job of jobsToUpdate) {
      if (job.sessions[0]?.extractedData?.[fieldName]) {
        await db.update(jobs)
          .set({
            groundTruthData: sql`jsonb_set(
              COALESCE(ground_truth_data, '{}'::jsonb),
              ${`{${fieldName}}`},
              ${JSON.stringify(job.sessions[0].extractedData[fieldName])}::jsonb
            )`,
            hasGroundTruth: true,
          })
          .where(eq(jobs.id, job.id))
      }
    }
  }

  return NextResponse.json({ success: true })
}
```

**1.4.2 Column-Level Metrics**

```typescript
// GET /api/batches/[id]/ground-truth/column-metrics
// Calculate and return column-level accuracy metrics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params

  // Check if we have cached metrics
  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, batchId),
  })

  const shouldRecalculate = !batch.lastGtMetricsCalculation ||
    (Date.now() - new Date(batch.lastGtMetricsCalculation).getTime() > 5 * 60 * 1000) // 5 min cache

  if (shouldRecalculate) {
    await recalculateColumnMetrics(batchId)
  }

  const metrics = await db.query.groundTruthColumnMetrics.findMany({
    where: eq(groundTruthColumnMetrics.batchId, batchId),
    orderBy: [desc(groundTruthColumnMetrics.accuracyPercentage)],
  })

  return NextResponse.json(metrics)
}

// Helper function to recalculate metrics
async function recalculateColumnMetrics(batchId: string) {
  // Get all jobs with ground truth in this batch
  const batchJobs = await db.query.jobs.findMany({
    where: and(
      eq(jobs.batchId, batchId),
      eq(jobs.hasGroundTruth, true)
    ),
    with: {
      sessions: {
        where: eq(sessions.status, 'completed'),
        orderBy: [desc(sessions.createdAt)],
        limit: 1,
      },
    },
  })

  // Extract all unique column names
  const columnNames = new Set<string>()
  batchJobs.forEach(job => {
    if (job.groundTruthData) {
      Object.keys(job.groundTruthData).forEach(key => columnNames.add(key))
    }
  })

  // Calculate metrics for each column
  const metricsToInsert = []

  for (const columnName of columnNames) {
    let totalJobs = 0
    let jobsWithGroundTruth = 0
    let exactMatches = 0
    let partialMatches = 0
    let mismatches = 0
    let missingExtractions = 0
    const errorExamples: Map<string, { count: number; examples: string[] }> = new Map()

    for (const job of batchJobs) {
      totalJobs++

      const gtValue = job.groundTruthData?.[columnName]
      if (gtValue === undefined || gtValue === null) continue

      jobsWithGroundTruth++

      const extractedValue = job.sessions[0]?.extractedData?.[columnName]

      if (extractedValue === undefined || extractedValue === null) {
        missingExtractions++
        errorExamples.set('missing_extraction', {
          count: (errorExamples.get('missing_extraction')?.count || 0) + 1,
          examples: [...(errorExamples.get('missing_extraction')?.examples || []).slice(0, 2), job.id],
        })
        continue
      }

      // Normalize values for comparison
      const gtNormalized = String(gtValue).trim().toLowerCase()
      const extractedNormalized = String(extractedValue).trim().toLowerCase()

      if (gtNormalized === extractedNormalized) {
        exactMatches++
      } else if (gtNormalized.includes(extractedNormalized) || extractedNormalized.includes(gtNormalized)) {
        partialMatches++
        errorExamples.set('partial_match', {
          count: (errorExamples.get('partial_match')?.count || 0) + 1,
          examples: [...(errorExamples.get('partial_match')?.examples || []).slice(0, 2), job.id],
        })
      } else {
        mismatches++

        // Categorize error type
        const errorType = categorizeGroundTruthError(gtValue, extractedValue)
        errorExamples.set(errorType, {
          count: (errorExamples.get(errorType)?.count || 0) + 1,
          examples: [...(errorExamples.get(errorType)?.examples || []).slice(0, 2), job.id],
        })
      }
    }

    const accuracyPercentage = jobsWithGroundTruth > 0
      ? (exactMatches / jobsWithGroundTruth) * 100
      : 0

    metricsToInsert.push({
      batchId,
      columnName,
      totalJobs,
      jobsWithGroundTruth,
      exactMatches,
      partialMatches,
      mismatches,
      missingExtractions,
      accuracyPercentage,
      commonErrors: Array.from(errorExamples.entries()).map(([errorType, data]) => ({
        errorType,
        count: data.count,
        examples: data.examples.slice(0, 3),
      })),
      calculatedAt: new Date(),
    })
  }

  // Delete old metrics and insert new ones
  await db.transaction(async (tx) => {
    await tx.delete(groundTruthColumnMetrics)
      .where(eq(groundTruthColumnMetrics.batchId, batchId))

    if (metricsToInsert.length > 0) {
      await tx.insert(groundTruthColumnMetrics).values(metricsToInsert)
    }

    // Update batch with overall accuracy
    const overallAccuracy = metricsToInsert.length > 0
      ? metricsToInsert.reduce((sum, m) => sum + m.accuracyPercentage, 0) / metricsToInsert.length
      : 0

    await tx.update(batches)
      .set({
        lastGtMetricsCalculation: new Date(),
        overallAccuracy,
      })
      .where(eq(batches.id, batchId))
  })
}

function categorizeGroundTruthError(expected: any, actual: any): string {
  const expStr = String(expected).trim()
  const actStr = String(actual).trim()

  // Type mismatch
  if (typeof expected !== typeof actual) {
    return 'type_mismatch'
  }

  // Numeric errors
  if (!isNaN(Number(expected)) && !isNaN(Number(actual))) {
    const diff = Math.abs(Number(expected) - Number(actual))
    if (diff < 1) return 'numeric_rounding_error'
    return 'numeric_value_error'
  }

  // Date/time errors
  if (isDate(expected) || isDate(actual)) {
    return 'date_format_error'
  }

  // String similarity
  const similarity = stringSimilarity(expStr, actStr)
  if (similarity > 0.7) return 'typo_or_formatting'
  if (similarity > 0.4) return 'significant_difference'

  return 'completely_different'
}
```

**1.4.3 Accuracy Trends**

```typescript
// GET /api/batches/[id]/ground-truth/trends
// Get accuracy trends over time by comparing different execution runs
interface TrendDataPoint {
  timestamp: string
  batchId: string
  batchName: string
  overallAccuracy: number
  columnMetrics: Array<{
    columnName: string
    accuracy: number
  }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('project_id')

  // If project ID provided, get trends across all batches in project
  // Otherwise, get trends for re-runs of the same batch

  if (projectId) {
    // Cross-batch trends
    const projectBatches = await db.query.batches.findMany({
      where: eq(batches.projectId, projectId),
      orderBy: [asc(batches.createdAt)],
    })

    const trends: TrendDataPoint[] = []

    for (const batch of projectBatches) {
      if (batch.overallAccuracy !== null) {
        const columnMetrics = await db.query.groundTruthColumnMetrics.findMany({
          where: eq(groundTruthColumnMetrics.batchId, batch.id),
        })

        trends.push({
          timestamp: batch.lastGtMetricsCalculation?.toISOString() || batch.createdAt.toISOString(),
          batchId: batch.id,
          batchName: batch.name,
          overallAccuracy: batch.overallAccuracy,
          columnMetrics: columnMetrics.map(m => ({
            columnName: m.columnName,
            accuracy: m.accuracyPercentage,
          })),
        })
      }
    }

    return NextResponse.json(trends)
  } else {
    // Single batch trend (if re-executed multiple times)
    // Track metrics calculation history
    // This requires a new table for historical metrics
    return NextResponse.json([])
  }
}
```

### 1.5 Frontend Components

**1.5.1 Bulk Ground Truth Editor Component**

```typescript
// components/GroundTruthBulkEditor.tsx

interface GroundTruthBulkEditorProps {
  batchId: string
  jobs: Job[]
  onComplete: () => void
}

export function GroundTruthBulkEditor({ batchId, jobs, onComplete }: GroundTruthBulkEditorProps) {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [editMode, setEditMode] = useState<'field' | 'row'>('field')
  const [selectedField, setSelectedField] = useState<string>('')
  const [bulkValue, setBulkValue] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Extract all unique field names from jobs
  const fieldNames = useMemo(() => {
    const fields = new Set<string>()
    jobs.forEach(job => {
      if (job.csvRowData) {
        Object.keys(job.csvRowData).forEach(key => fields.add(key))
      }
      if (job.groundTruthData) {
        Object.keys(job.groundTruthData).forEach(key => fields.add(key))
      }
    })
    return Array.from(fields).sort()
  }, [jobs])

  const handleSelectAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(jobs.map(j => j.id)))
    }
  }

  const handleBulkSet = async () => {
    if (selectedJobs.size === 0 || !selectedField || !bulkValue) return

    setIsSubmitting(true)
    try {
      await fetch(`/api/batches/${batchId}/ground-truth/bulk-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobs),
          fieldName: selectedField,
          operation: 'set',
          value: bulkValue,
        }),
      })

      toast.success(`Updated ${selectedJobs.size} jobs`)
      onComplete()
    } catch (error) {
      toast.error('Failed to update ground truth')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyFromExtracted = async () => {
    if (selectedJobs.size === 0 || !selectedField) return

    setIsSubmitting(true)
    try {
      await fetch(`/api/batches/${batchId}/ground-truth/bulk-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobs),
          fieldName: selectedField,
          operation: 'copy_from_extracted',
        }),
      })

      toast.success(`Copied extracted values for ${selectedJobs.size} jobs`)
      onComplete()
    } catch (error) {
      toast.error('Failed to copy values')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bulk Ground Truth Editor</h3>
          <p className="text-sm text-gray-600">
            {selectedJobs.size} of {jobs.length} jobs selected
          </p>
        </div>
        <Button variant="outline" onClick={handleSelectAll}>
          {selectedJobs.size === jobs.length ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2">
        <Button
          variant={editMode === 'field' ? 'default' : 'outline'}
          onClick={() => setEditMode('field')}
        >
          Edit by Field
        </Button>
        <Button
          variant={editMode === 'row' ? 'default' : 'outline'}
          onClick={() => setEditMode('row')}
        >
          Edit by Row
        </Button>
      </div>

      {/* Field Edit Mode */}
      {editMode === 'field' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Field Name</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
              >
                <option value="">Select a field</option>
                {fieldNames.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Value</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder="Enter value for selected jobs"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleBulkSet}
              disabled={!selectedField || !bulkValue || selectedJobs.size === 0 || isSubmitting}
            >
              Set Value for {selectedJobs.size} Jobs
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyFromExtracted}
              disabled={!selectedField || selectedJobs.size === 0 || isSubmitting}
            >
              Copy from Extracted
            </Button>
          </div>
        </div>
      )}

      {/* Job List with Inline Editing */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedJobs.size === jobs.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium">Job ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                {selectedField && (
                  <>
                    <th className="px-4 py-2 text-left text-sm font-medium">Extracted</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Ground Truth</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Match</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map(job => (
                <GroundTruthJobRow
                  key={job.id}
                  job={job}
                  selectedField={selectedField}
                  isSelected={selectedJobs.has(job.id)}
                  onToggle={() => {
                    const newSelected = new Set(selectedJobs)
                    if (newSelected.has(job.id)) {
                      newSelected.delete(job.id)
                    } else {
                      newSelected.add(job.id)
                    }
                    setSelectedJobs(newSelected)
                  }}
                  onUpdate={onComplete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

**1.5.2 Column-Level Accuracy Dashboard**

```typescript
// components/ColumnAccuracyDashboard.tsx

interface ColumnMetric {
  columnName: string
  accuracyPercentage: number
  exactMatches: number
  partialMatches: number
  mismatches: number
  missingExtractions: number
  jobsWithGroundTruth: number
  commonErrors: Array<{
    errorType: string
    count: number
    examples: string[]
  }>
}

export function ColumnAccuracyDashboard({ batchId }: { batchId: string }) {
  const [metrics, setMetrics] = useState<ColumnMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'accuracy'>('accuracy')
  const [filterThreshold, setFilterThreshold] = useState<number>(0)

  useEffect(() => {
    fetchMetrics()
  }, [batchId])

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/batches/${batchId}/ground-truth/column-metrics`)
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      toast.error('Failed to load column metrics')
    } finally {
      setLoading(false)
    }
  }

  const sortedMetrics = useMemo(() => {
    let filtered = metrics.filter(m => m.accuracyPercentage >= filterThreshold)

    if (sortBy === 'accuracy') {
      return filtered.sort((a, b) => a.accuracyPercentage - b.accuracyPercentage)
    } else {
      return filtered.sort((a, b) => a.columnName.localeCompare(b.columnName))
    }
  }, [metrics, sortBy, filterThreshold])

  const overallAccuracy = useMemo(() => {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.accuracyPercentage, 0) / metrics.length
  }, [metrics])

  if (loading) {
    return <div>Loading metrics...</div>
  }

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Overall Accuracy</div>
          <div className="text-2xl font-bold">{overallAccuracy.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total Fields</div>
          <div className="text-2xl font-bold">{metrics.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Perfect Fields</div>
          <div className="text-2xl font-bold">
            {metrics.filter(m => m.accuracyPercentage === 100).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Struggling Fields</div>
          <div className="text-2xl font-bold text-red-600">
            {metrics.filter(m => m.accuracyPercentage < 50).length}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Sort by:</label>
          <select
            className="border rounded px-3 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="accuracy">Accuracy (Low to High)</option>
            <option value="name">Field Name</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Show fields with accuracy ≥</label>
          <input
            type="number"
            min="0"
            max="100"
            className="border rounded px-3 py-1 w-20"
            value={filterThreshold}
            onChange={(e) => setFilterThreshold(Number(e.target.value))}
          />
          <span className="text-sm">%</span>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Field Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Accuracy</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Exact Matches</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Partial</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Mismatches</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Missing</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Common Errors</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedMetrics.map(metric => (
              <tr key={metric.columnName} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{metric.columnName}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metric.accuracyPercentage >= 90 ? 'bg-green-500' :
                          metric.accuracyPercentage >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${metric.accuracyPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {metric.accuracyPercentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{metric.exactMatches}</td>
                <td className="px-4 py-3 text-sm">{metric.partialMatches}</td>
                <td className="px-4 py-3 text-sm">{metric.mismatches}</td>
                <td className="px-4 py-3 text-sm">{metric.missingExtractions}</td>
                <td className="px-4 py-3">
                  {metric.commonErrors.length > 0 && (
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => {
                        // Open modal with error details
                        showErrorDetailsModal(metric)
                      }}
                    >
                      View {metric.commonErrors.length} error types
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**1.5.3 Ground Truth Comparison Diff View**

```typescript
// components/GroundTruthDiffView.tsx

interface DiffViewProps {
  extracted: Record<string, any>
  groundTruth: Record<string, any>
  onAcceptExtracted: (field: string) => void
  onEditGroundTruth: (field: string, value: any) => void
}

export function GroundTruthDiffView({
  extracted,
  groundTruth,
  onAcceptExtracted,
  onEditGroundTruth,
}: DiffViewProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  // Merge all keys from both objects
  const allFields = useMemo(() => {
    const fields = new Set([
      ...Object.keys(extracted || {}),
      ...Object.keys(groundTruth || {}),
    ])
    return Array.from(fields).sort()
  }, [extracted, groundTruth])

  const getMatchStatus = (field: string) => {
    const extValue = extracted?.[field]
    const gtValue = groundTruth?.[field]

    if (gtValue === undefined || gtValue === null) {
      return 'no-ground-truth'
    }

    if (extValue === undefined || extValue === null) {
      return 'missing'
    }

    const extStr = String(extValue).trim().toLowerCase()
    const gtStr = String(gtValue).trim().toLowerCase()

    if (extStr === gtStr) return 'exact-match'
    if (extStr.includes(gtStr) || gtStr.includes(extStr)) return 'partial-match'
    return 'mismatch'
  }

  const handleSaveEdit = (field: string) => {
    onEditGroundTruth(field, editValue)
    setEditingField(null)
    setEditValue('')
  }

  return (
    <div className="space-y-2">
      {allFields.map(field => {
        const status = getMatchStatus(field)
        const extValue = extracted?.[field]
        const gtValue = groundTruth?.[field]
        const isEditing = editingField === field

        return (
          <div
            key={field}
            className={`border rounded-lg p-4 ${
              status === 'exact-match' ? 'border-green-200 bg-green-50' :
              status === 'partial-match' ? 'border-yellow-200 bg-yellow-50' :
              status === 'mismatch' ? 'border-red-200 bg-red-50' :
              'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{field}</span>
                  {status === 'exact-match' && (
                    <Badge className="bg-green-100 text-green-800">✓ Match</Badge>
                  )}
                  {status === 'partial-match' && (
                    <Badge className="bg-yellow-100 text-yellow-800">~ Partial</Badge>
                  )}
                  {status === 'mismatch' && (
                    <Badge className="bg-red-100 text-red-800">✗ Mismatch</Badge>
                  )}
                  {status === 'missing' && (
                    <Badge className="bg-gray-100 text-gray-800">Missing</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Extracted Value */}
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Extracted</div>
                    <div className="text-sm font-mono bg-white border rounded px-2 py-1">
                      {extValue !== undefined && extValue !== null ? String(extValue) : '—'}
                    </div>
                  </div>

                  {/* Ground Truth Value */}
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Ground Truth</div>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 text-sm border rounded px-2 py-1"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleSaveEdit(field)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingField(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="text-sm font-mono bg-white border rounded px-2 py-1 cursor-pointer hover:border-blue-300"
                        onClick={() => {
                          setEditingField(field)
                          setEditValue(gtValue !== undefined && gtValue !== null ? String(gtValue) : '')
                        }}
                      >
                        {gtValue !== undefined && gtValue !== null ? String(gtValue) : '—'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!isEditing && status !== 'exact-match' && (
                <div className="ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAcceptExtracted(field)}
                    disabled={extValue === undefined || extValue === null}
                  >
                    Accept Extracted
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### 1.6 EVA Agent Integration

**Ground Truth-Aware Execution**

When EVA agent executes a job with ground truth, it should:

1. **Pre-execution**: Load ground truth values to provide context
2. **Post-execution**: Automatically compare extracted vs ground truth
3. **Feedback Loop**: Use ground truth mismatches to improve instructions

```typescript
// lib/eva-executor.ts enhancement

interface EvaExecutionOptions {
  jobId: string
  instructions: string
  inputData: Record<string, any>
  groundTruth?: Record<string, any> // NEW: Pass ground truth if available
  returnGroundTruthComparison?: boolean // NEW: Request comparison
}

async function executeWithGroundTruth(options: EvaExecutionOptions) {
  const { jobId, instructions, inputData, groundTruth, returnGroundTruthComparison } = options

  // Step 1: Execute normal extraction
  const extractionResult = await evaClient.execute({
    instructions,
    inputData,
    sessionId: jobId,
  })

  // Step 2: If ground truth provided, perform comparison
  if (groundTruth && returnGroundTruthComparison) {
    const comparison = compareWithGroundTruth(
      extractionResult.extractedData,
      groundTruth
    )

    // Step 3: If significant mismatches, attempt self-correction
    if (comparison.accuracyPercentage < 70) {
      const correctionPrompt = generateCorrectionPrompt(
        instructions,
        extractionResult.extractedData,
        groundTruth,
        comparison.mismatches
      )

      // Retry with correction guidance
      const correctedResult = await evaClient.execute({
        instructions: correctionPrompt,
        inputData,
        sessionId: `${jobId}-correction`,
      })

      return {
        ...correctedResult,
        groundTruthComparison: compareWithGroundTruth(
          correctedResult.extractedData,
          groundTruth
        ),
        wasCorrected: true,
      }
    }

    return {
      ...extractionResult,
      groundTruthComparison: comparison,
      wasCorrected: false,
    }
  }

  return extractionResult
}

function generateCorrectionPrompt(
  originalInstructions: string,
  extractedData: Record<string, any>,
  groundTruth: Record<string, any>,
  mismatches: Array<{ field: string; extracted: any; expected: any }>
): string {
  return `
${originalInstructions}

IMPORTANT: Previous extraction had errors. Please correct these specific fields:

${mismatches.map(m => `
- Field: ${m.field}
  Previous extraction: ${m.extracted}
  Expected value: ${m.expected}
  Please extract this field more carefully.
`).join('\n')}
  `.trim()
}
```

### 1.7 User Flows

**Flow 1: Bulk Set Ground Truth from CSV**
1. User uploads batch with CSV containing ground truth columns
2. System auto-detects columns that match extracted field names
3. User confirms which columns are ground truth
4. System sets `groundTruthData` for all jobs in batch
5. System calculates initial column metrics
6. User views accuracy dashboard

**Flow 2: Manual Bulk Editing**
1. User navigates to batch detail page
2. Clicks "Edit Ground Truth" button
3. Bulk editor modal opens showing all jobs
4. User selects multiple jobs (checkbox or shift-click)
5. User selects field name from dropdown
6. User enters value or clicks "Copy from Extracted"
7. System updates selected jobs
8. Metrics auto-recalculate
9. Dashboard updates in real-time

**Flow 3: Field-by-Field Review**
1. User opens single job detail page
2. Ground truth diff view shows all fields
3. For each mismatch:
   - User can click "Accept Extracted" to update GT
   - User can click on GT value to inline-edit
   - User can see match status (exact/partial/mismatch)
4. Changes save immediately
5. Column metrics update

**Flow 4: Accuracy Trend Analysis**
1. User creates multiple batches with same structure
2. Each batch execution calculates metrics
3. User opens project-level analytics page
4. Charts show accuracy trends over time
5. User can drill down by field to see improvements
6. Export trend data to CSV for reporting

---

## 2. Failure Pattern Analysis

**Current State**: Not implemented
**Priority**: High (directly impacts debugging efficiency)

### 2.1 Problem Statement

When jobs fail, users need to:
- Understand WHY they failed (categorization)
- See common failure patterns across the batch
- Identify if failures are instruction-related, website-related, or data-related
- Take corrective action based on failure type

### 2.2 Database Schema

```typescript
export const failurePatterns = pgTable('failure_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),

  // Pattern identification
  patternType: text('pattern_type').notNull(), // 'selector_not_found', 'timeout', 'extraction_error', etc.
  patternName: text('pattern_name').notNull(), // Human-readable name
  patternSignature: text('pattern_signature').notNull(), // Hash of error characteristics

  // Occurrence tracking
  firstSeenAt: timestamp('first_seen_at').notNull(),
  lastSeenAt: timestamp('last_seen_at').notNull(),
  occurrenceCount: integer('occurrence_count').notNull().default(1),
  affectedJobIds: jsonb('affected_job_ids').$type<string[]>().notNull(),

  // Error details
  errorMessage: text('error_message'),
  stackTrace: text('stack_trace'),
  failureStage: text('failure_stage'), // 'navigation', 'extraction', 'validation'

  // Root cause analysis
  likelyRootCause: text('likely_root_cause'), // AI-generated analysis
  suggestedFix: text('suggested_fix'),

  // Resolution tracking
  status: text('status').notNull().default('open'), // 'open', 'investigating', 'resolved', 'ignored'
  resolvedAt: timestamp('resolved_at'),
  resolution: text('resolution'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

CREATE INDEX idx_failure_patterns_batch ON failure_patterns(batch_id);
CREATE INDEX idx_failure_patterns_type ON failure_patterns(pattern_type);
CREATE INDEX idx_failure_patterns_status ON failure_patterns(status);
```

### 2.3 Backend API

```typescript
// POST /api/batches/[id]/analyze-failures
// Analyze all failures in batch and detect patterns

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params

  // Get all failed jobs with their sessions
  const failedJobs = await db.query.jobs.findMany({
    where: and(
      eq(jobs.batchId, batchId),
      eq(jobs.status, 'failed')
    ),
    with: {
      sessions: {
        where: eq(sessions.status, 'failed'),
        orderBy: [desc(sessions.createdAt)],
        limit: 1, // Latest failure
      },
    },
  })

  if (failedJobs.length === 0) {
    return NextResponse.json({ message: 'No failures found' })
  }

  // Analyze and group failures by pattern
  const patterns = await detectFailurePatterns(failedJobs)

  // Save patterns to database
  await db.transaction(async (tx) => {
    // Clear old patterns for this batch
    await tx.delete(failurePatterns)
      .where(eq(failurePatterns.batchId, batchId))

    // Insert new patterns
    for (const pattern of patterns) {
      await tx.insert(failurePatterns).values({
        batchId,
        patternType: pattern.type,
        patternName: pattern.name,
        patternSignature: pattern.signature,
        firstSeenAt: new Date(Math.min(...pattern.jobs.map(j => j.timestamp))),
        lastSeenAt: new Date(Math.max(...pattern.jobs.map(j => j.timestamp))),
        occurrenceCount: pattern.jobs.length,
        affectedJobIds: pattern.jobs.map(j => j.id),
        errorMessage: pattern.representativeError,
        failureStage: pattern.stage,
        likelyRootCause: pattern.rootCause,
        suggestedFix: pattern.suggestedFix,
      })
    }
  })

  return NextResponse.json({ patternsDetected: patterns.length })
}

async function detectFailurePatterns(failedJobs: any[]) {
  const patterns: Map<string, any> = new Map()

  for (const job of failedJobs) {
    const session = job.sessions[0]
    if (!session) continue

    const analysis = analyzeFailure(session)
    const signature = generateFailureSignature(analysis)

    if (patterns.has(signature)) {
      const existing = patterns.get(signature)
      existing.jobs.push({
        id: job.id,
        timestamp: new Date(session.startedAt).getTime(),
      })
    } else {
      patterns.set(signature, {
        type: analysis.type,
        name: analysis.name,
        signature,
        stage: analysis.stage,
        representativeError: session.errorMessage,
        rootCause: analysis.rootCause,
        suggestedFix: analysis.suggestedFix,
        jobs: [{
          id: job.id,
          timestamp: new Date(session.startedAt).getTime(),
        }],
      })
    }
  }

  return Array.from(patterns.values())
}

function analyzeFailure(session: any) {
  const errorMsg = session.errorMessage || ''
  const rawOutput = session.rawOutput || ''

  // Pattern: Selector not found
  if (errorMsg.includes('selector') && errorMsg.includes('not found')) {
    return {
      type: 'selector_not_found',
      name: 'Element Not Found',
      stage: 'extraction',
      rootCause: 'The CSS selector or XPath used to locate an element on the page did not match any elements. The page structure may have changed, or the selector may be incorrect.',
      suggestedFix: 'Review the page structure and update the selector in your instructions. Consider using more robust selectors or adding fallback options.',
    }
  }

  // Pattern: Timeout
  if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
    return {
      type: 'timeout',
      name: 'Page Load Timeout',
      stage: 'navigation',
      rootCause: 'The page took too long to load or respond. This could be due to slow network, server issues, or infinite loading states.',
      suggestedFix: 'Increase timeout duration, check if the website is accessible, or add explicit wait conditions for specific elements.',
    }
  }

  // Pattern: Authentication required
  if (errorMsg.includes('login') || errorMsg.includes('unauthorized') || rawOutput.includes('sign in')) {
    return {
      type: 'authentication_required',
      name: 'Authentication Required',
      stage: 'navigation',
      rootCause: 'The target page requires authentication but no credentials were provided, or the session expired.',
      suggestedFix: 'Add login credentials to your input data, or ensure the authentication flow is included in your instructions.',
    }
  }

  // Pattern: Rate limiting
  if (errorMsg.includes('rate limit') || errorMsg.includes('too many requests') || rawOutput.includes('429')) {
    return {
      type: 'rate_limited',
      name: 'Rate Limited',
      stage: 'navigation',
      rootCause: 'The target website is blocking requests due to rate limiting. Too many requests were made in a short period.',
      suggestedFix: 'Reduce batch concurrency, add delays between requests, or rotate IP addresses if permitted.',
    }
  }

  // Pattern: Data extraction failed
  if (errorMsg.includes('extract') || session.extractedData === null) {
    return {
      type: 'extraction_failed',
      name: 'Data Extraction Failed',
      stage: 'extraction',
      rootCause: 'The agent could not extract the requested data fields. The data may not be present on the page, or the extraction instructions were unclear.',
      suggestedFix: 'Verify the data exists on the page, clarify extraction instructions, or add examples to guide the agent.',
    }
  }

  // Pattern: Validation failed
  if (errorMsg.includes('validation')) {
    return {
      type: 'validation_failed',
      name: 'Validation Failed',
      stage: 'validation',
      rootCause: 'The extracted data did not pass validation rules. The data format or values were incorrect.',
      suggestedFix: 'Review validation rules and ensure they match expected data format. Update extraction instructions if needed.',
    }
  }

  // Default: Unknown
  return {
    type: 'unknown',
    name: 'Unknown Error',
    stage: 'unknown',
    rootCause: 'The failure reason could not be automatically determined.',
    suggestedFix: 'Manually review the error message and raw output to diagnose the issue.',
  }
}

function generateFailureSignature(analysis: any): string {
  // Create a hash based on error type and key characteristics
  return `${analysis.type}:${analysis.stage}`
}
```

```typescript
// GET /api/batches/[id]/failure-patterns
// Get all detected failure patterns for a batch

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params

  const patterns = await db.query.failurePatterns.findMany({
    where: eq(failurePatterns.batchId, batchId),
    orderBy: [desc(failurePatterns.occurrenceCount)],
  })

  return NextResponse.json(patterns)
}

// PATCH /api/failure-patterns/[id]
// Update pattern status or resolution

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  await db.update(failurePatterns)
    .set({
      status: body.status,
      resolution: body.resolution,
      resolvedAt: body.status === 'resolved' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(failurePatterns.id, id))

  return NextResponse.json({ success: true })
}
```

### 2.4 Frontend Component

```typescript
// components/FailurePatternsDashboard.tsx

interface FailurePattern {
  id: string
  patternType: string
  patternName: string
  occurrenceCount: number
  affectedJobIds: string[]
  errorMessage: string
  failureStage: string
  likelyRootCause: string
  suggestedFix: string
  status: 'open' | 'investigating' | 'resolved' | 'ignored'
  firstSeenAt: string
  lastSeenAt: string
}

export function FailurePatternsDashboard({ batchId }: { batchId: string }) {
  const [patterns, setPatterns] = useState<FailurePattern[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState<FailurePattern | null>(null)

  const analyzeFailures = async () => {
    setAnalyzing(true)
    try {
      await fetch(`/api/batches/${batchId}/analyze-failures`, {
        method: 'POST',
      })
      await fetchPatterns()
      toast.success('Failure analysis complete')
    } catch (error) {
      toast.error('Failed to analyze failures')
    } finally {
      setAnalyzing(false)
    }
  }

  const fetchPatterns = async () => {
    const response = await fetch(`/api/batches/${batchId}/failure-patterns`)
    const data = await response.json()
    setPatterns(data)
  }

  const updatePatternStatus = async (patternId: string, status: string) => {
    await fetch(`/api/failure-patterns/${patternId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchPatterns()
  }

  useEffect(() => {
    fetchPatterns()
  }, [batchId])

  const patternsByType = useMemo(() => {
    const grouped: Record<string, FailurePattern[]> = {}
    patterns.forEach(p => {
      if (!grouped[p.patternType]) {
        grouped[p.patternType] = []
      }
      grouped[p.patternType].push(p)
    })
    return grouped
  }, [patterns])

  const totalFailures = patterns.reduce((sum, p) => sum + p.occurrenceCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Failure Pattern Analysis</h3>
          <p className="text-sm text-gray-600">
            {patterns.length} patterns detected affecting {totalFailures} jobs
          </p>
        </div>
        <Button onClick={analyzeFailures} disabled={analyzing}>
          {analyzing ? 'Analyzing...' : 'Re-analyze Failures'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600">Critical Patterns</div>
          <div className="text-2xl font-bold text-red-700">
            {patterns.filter(p => p.occurrenceCount > 10).length}
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-600">Under Investigation</div>
          <div className="text-2xl font-bold text-yellow-700">
            {patterns.filter(p => p.status === 'investigating').length}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600">Resolved</div>
          <div className="text-2xl font-bold text-green-700">
            {patterns.filter(p => p.status === 'resolved').length}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Unique Patterns</div>
          <div className="text-2xl font-bold text-gray-700">
            {patterns.length}
          </div>
        </div>
      </div>

      {/* Patterns List */}
      <div className="space-y-4">
        {Object.entries(patternsByType).map(([type, typePatterns]) => (
          <div key={type} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 font-medium">
              {type.replace(/_/g, ' ').toUpperCase()}
            </div>
            <div className="divide-y">
              {typePatterns.map(pattern => (
                <div
                  key={pattern.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{pattern.patternName}</span>
                        <Badge
                          className={
                            pattern.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            pattern.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {pattern.status}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {pattern.occurrenceCount} occurrences
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {pattern.likelyRootCause}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Stage: {pattern.failureStage}</span>
                        <span>First: {new Date(pattern.firstSeenAt).toLocaleString()}</span>
                        <span>Last: {new Date(pattern.lastSeenAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="ml-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          updatePatternStatus(pattern.id, 'investigating')
                        }}
                      >
                        Investigate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          updatePatternStatus(pattern.id, 'resolved')
                        }}
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pattern Detail Modal */}
      {selectedPattern && (
        <PatternDetailModal
          pattern={selectedPattern}
          onClose={() => setSelectedPattern(null)}
          onUpdate={fetchPatterns}
        />
      )}
    </div>
  )
}
```

### 2.5 User Flow

**Flow: Investigate and Fix Failures**
1. User sees batch has many failures on dashboard
2. Clicks "Analyze Failures" button
3. System groups failures into patterns
4. Dashboard shows patterns ranked by occurrence
5. User clicks on a pattern to see details:
   - Root cause analysis
   - Suggested fix
   - List of affected jobs
   - Representative error message
6. User marks pattern as "investigating"
7. User updates instructions based on suggested fix
8. User retries failed jobs
9. System tracks if pattern is resolved
10. User marks pattern as "resolved" if fixes work

---

## 3. Accuracy Analytics Dashboard

**Current State**: Not implemented
**Priority**: Medium (valuable for long-term improvement)

### 3.1 Problem Statement

Users need to:
- Track accuracy improvements over time
- Compare performance across different batches/projects
- Identify which instruction changes improved accuracy
- Visualize trends in data quality
- Export analytics for reporting to stakeholders

### 3.2 Database Schema

```typescript
export const accuracySnapshots = pgTable('accuracy_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),

  // Snapshot metadata
  snapshotDate: timestamp('snapshot_date').notNull(),
  triggerEvent: text('trigger_event').notNull(), // 'execution_complete', 'manual_trigger', 'scheduled'

  // Overall metrics
  totalJobs: integer('total_jobs').notNull(),
  jobsWithGroundTruth: integer('jobs_with_ground_truth').notNull(),
  overallAccuracy: real('overall_accuracy').notNull(),

  // Field-level aggregates
  fieldAccuracies: jsonb('field_accuracies').$type<Record<string, number>>().notNull(),

  // Success/failure breakdown
  successCount: integer('success_count').notNull(),
  failureCount: integer('failure_count').notNull(),
  partialSuccessCount: integer('partial_success_count').notNull(),

  // Performance metrics
  avgExecutionTimeMs: integer('avg_execution_time_ms'),
  avgCostPerJob: real('avg_cost_per_job'),

  // Context (what changed since last snapshot)
  instructionsVersion: text('instructions_version'),
  evaVersion: text('eva_version'),
  changesSinceLastSnapshot: text('changes_since_last_snapshot'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
})

CREATE INDEX idx_accuracy_snapshots_batch ON accuracy_snapshots(batch_id);
CREATE INDEX idx_accuracy_snapshots_project ON accuracy_snapshots(project_id);
CREATE INDEX idx_accuracy_snapshots_date ON accuracy_snapshots(snapshot_date);
```

### 3.3 Backend API

```typescript
// POST /api/batches/[id]/accuracy-snapshot
// Create a new accuracy snapshot

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params

  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, batchId),
    with: {
      jobs: {
        where: eq(jobs.hasGroundTruth, true),
        with: {
          sessions: {
            where: eq(sessions.status, 'completed'),
            orderBy: [desc(sessions.createdAt)],
            limit: 1,
          },
        },
      },
    },
  })

  if (!batch) {
    return NextResponse.json({ message: 'Batch not found' }, { status: 404 })
  }

  // Calculate metrics
  const totalJobs = batch.jobs.length
  const jobsWithGT = batch.jobs.filter(j => j.hasGroundTruth).length

  let successCount = 0
  let failureCount = 0
  let partialSuccessCount = 0
  const fieldAccuracies: Record<string, { total: number; correct: number }> = {}
  let totalExecutionTime = 0
  let executionCount = 0

  for (const job of batch.jobs) {
    const session = job.sessions[0]
    if (!session) continue

    if (session.executionTimeMs) {
      totalExecutionTime += session.executionTimeMs
      executionCount++
    }

    if (!job.groundTruthData) continue

    const extracted = session.extractedData || {}
    const groundTruth = job.groundTruthData

    let jobCorrectCount = 0
    let jobTotalCount = 0

    for (const field of Object.keys(groundTruth)) {
      jobTotalCount++

      if (!fieldAccuracies[field]) {
        fieldAccuracies[field] = { total: 0, correct: 0 }
      }
      fieldAccuracies[field].total++

      const extValue = String(extracted[field] || '').trim().toLowerCase()
      const gtValue = String(groundTruth[field] || '').trim().toLowerCase()

      if (extValue === gtValue) {
        jobCorrectCount++
        fieldAccuracies[field].correct++
      }
    }

    const jobAccuracy = jobTotalCount > 0 ? jobCorrectCount / jobTotalCount : 0

    if (jobAccuracy === 1) successCount++
    else if (jobAccuracy === 0) failureCount++
    else partialSuccessCount++
  }

  // Calculate field accuracy percentages
  const fieldAccuracyPercentages: Record<string, number> = {}
  for (const [field, data] of Object.entries(fieldAccuracies)) {
    fieldAccuracyPercentages[field] = data.total > 0
      ? (data.correct / data.total) * 100
      : 0
  }

  const overallAccuracy = jobsWithGT > 0
    ? ((successCount + partialSuccessCount * 0.5) / jobsWithGT) * 100
    : 0

  const avgExecutionTime = executionCount > 0
    ? Math.round(totalExecutionTime / executionCount)
    : null

  // Create snapshot
  const snapshot = await db.insert(accuracySnapshots).values({
    batchId: batch.id,
    projectId: batch.projectId,
    snapshotDate: new Date(),
    triggerEvent: 'manual_trigger',
    totalJobs,
    jobsWithGroundTruth: jobsWithGT,
    overallAccuracy,
    fieldAccuracies: fieldAccuracyPercentages,
    successCount,
    failureCount,
    partialSuccessCount,
    avgExecutionTimeMs: avgExecutionTime,
    instructionsVersion: batch.instructionsVersion || null,
  }).returning()

  return NextResponse.json(snapshot[0])
}

// GET /api/projects/[id]/accuracy-trends
// Get accuracy trends across all batches in a project

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const searchParams = request.nextUrl.searchParams
  const timeRange = searchParams.get('range') || '30d' // 7d, 30d, 90d, all

  let startDate: Date | null = null
  if (timeRange !== 'all') {
    const days = parseInt(timeRange)
    startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
  }

  const snapshots = await db.query.accuracySnapshots.findMany({
    where: and(
      eq(accuracySnapshots.projectId, projectId),
      startDate ? gte(accuracySnapshots.snapshotDate, startDate) : undefined
    ),
    orderBy: [asc(accuracySnapshots.snapshotDate)],
  })

  return NextResponse.json(snapshots)
}
```

### 3.4 Frontend Component

```typescript
// components/AccuracyTrendsDashboard.tsx

export function AccuracyTrendsDashboard({ projectId }: { projectId: string }) {
  const [snapshots, setSnapshots] = useState<AccuracySnapshot[]>([])
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrends()
  }, [projectId, timeRange])

  const fetchTrends = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/accuracy-trends?range=${timeRange}`
      )
      const data = await response.json()
      setSnapshots(data)
    } catch (error) {
      toast.error('Failed to load trends')
    } finally {
      setLoading(false)
    }
  }

  // Extract all unique field names across snapshots
  const allFields = useMemo(() => {
    const fields = new Set<string>()
    snapshots.forEach(s => {
      Object.keys(s.fieldAccuracies).forEach(f => fields.add(f))
    })
    return Array.from(fields).sort()
  }, [snapshots])

  // Prepare chart data
  const overallTrendData = snapshots.map(s => ({
    date: new Date(s.snapshotDate).toLocaleDateString(),
    accuracy: s.overallAccuracy,
    batchName: s.batch?.name || 'Unknown',
  }))

  const fieldTrendData = selectedField
    ? snapshots.map(s => ({
        date: new Date(s.snapshotDate).toLocaleDateString(),
        accuracy: s.fieldAccuracies[selectedField] || 0,
      }))
    : []

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Accuracy Trends</h3>
        <div className="flex items-center gap-4">
          <select
            className="border rounded px-3 py-2"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <Button onClick={fetchTrends}>Refresh</Button>
        </div>
      </div>

      {/* Summary Metrics */}
      {snapshots.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-600">Current Accuracy</div>
            <div className="text-2xl font-bold">
              {snapshots[snapshots.length - 1].overallAccuracy.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-600">Improvement</div>
            <div className="text-2xl font-bold text-green-600">
              +{(
                snapshots[snapshots.length - 1].overallAccuracy -
                snapshots[0].overallAccuracy
              ).toFixed(1)}%
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Snapshots</div>
            <div className="text-2xl font-bold">{snapshots.length}</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-600">Tracking Fields</div>
            <div className="text-2xl font-bold">{allFields.length}</div>
          </div>
        </div>
      )}

      {/* Overall Accuracy Chart */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-medium mb-4">Overall Accuracy Over Time</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={overallTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border rounded p-2 shadow-lg">
                      <p className="text-sm font-medium">{payload[0].payload.batchName}</p>
                      <p className="text-sm text-gray-600">{payload[0].payload.date}</p>
                      <p className="text-sm font-bold">
                        {payload[0].value}% accuracy
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Field Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          View trend for specific field:
        </label>
        <select
          className="border rounded px-3 py-2 w-64"
          value={selectedField || ''}
          onChange={(e) => setSelectedField(e.target.value || null)}
        >
          <option value="">Select a field</option>
          {allFields.map(field => (
            <option key={field} value={field}>{field}</option>
          ))}
        </select>
      </div>

      {/* Field-Specific Chart */}
      {selectedField && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-medium mb-4">
            Accuracy for "{selectedField}" Over Time
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fieldTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Snapshot History Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h4 className="font-medium">Snapshot History</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Batch</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Accuracy</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Success/Fail</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Avg Time</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {snapshots.map(snapshot => (
                <tr key={snapshot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(snapshot.snapshotDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">{snapshot.batch?.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        snapshot.overallAccuracy >= 90 ? 'text-green-600' :
                        snapshot.overallAccuracy >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}
                    >
                      {snapshot.overallAccuracy.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-green-600">{snapshot.successCount}</span>
                    {' / '}
                    <span className="text-red-600">{snapshot.failureCount}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {snapshot.avgExecutionTimeMs
                      ? `${(snapshot.avgExecutionTimeMs / 1000).toFixed(1)}s`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {snapshot.changesSinceLastSnapshot || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

---

## 4. Batch Export Enhancement

**Current State**: 50% complete - Basic CSV export exists, no ground truth comparison
**Priority**: Medium

### 4.1 Enhanced Export Features

```typescript
// POST /api/batches/[id]/export
// Enhanced export with multiple formats and options

interface ExportRequest {
  format: 'csv' | 'json' | 'xlsx'
  includeGroundTruth: boolean
  includeComparison: boolean // Show diff columns
  includeMetadata: boolean // Include execution times, status, etc.
  includeScreenshots: boolean // Add screenshot URLs
  fields?: string[] // Specific fields to export, or all if not specified
  filter?: {
    status?: string[]
    hasGroundTruth?: boolean
    accuracy?: { min: number; max: number }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params
  const options: ExportRequest = await request.json()

  // Fetch jobs with filters
  const jobs = await fetchJobsWithFilters(batchId, options.filter)

  // Transform data based on export options
  const exportData = await transformForExport(jobs, options)

  // Generate file based on format
  let fileContent: Buffer
  let contentType: string
  let fileName: string

  switch (options.format) {
    case 'csv':
      fileContent = generateCSV(exportData)
      contentType = 'text/csv'
      fileName = `batch-${batchId}-export.csv`
      break

    case 'json':
      fileContent = Buffer.from(JSON.stringify(exportData, null, 2))
      contentType = 'application/json'
      fileName = `batch-${batchId}-export.json`
      break

    case 'xlsx':
      fileContent = await generateExcel(exportData)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      fileName = `batch-${batchId}-export.xlsx`
      break
  }

  return new NextResponse(fileContent, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}

async function transformForExport(jobs: any[], options: ExportRequest) {
  return jobs.map(job => {
    const row: Record<string, any> = {}

    // Basic job info
    row['Job ID'] = job.id
    row['Status'] = job.status

    // Input data
    if (job.csvRowData) {
      Object.entries(job.csvRowData).forEach(([key, value]) => {
        row[`Input: ${key}`] = value
      })
    }

    // Extracted data
    const latestSession = job.sessions[0]
    if (latestSession?.extractedData) {
      Object.entries(latestSession.extractedData).forEach(([key, value]) => {
        row[`Extracted: ${key}`] = value
      })
    }

    // Ground truth and comparison
    if (options.includeGroundTruth && job.groundTruthData) {
      Object.entries(job.groundTruthData).forEach(([key, value]) => {
        row[`Ground Truth: ${key}`] = value

        if (options.includeComparison) {
          const extracted = latestSession?.extractedData?.[key]
          const match = String(extracted || '').trim().toLowerCase() ===
                        String(value || '').trim().toLowerCase()
          row[`Match: ${key}`] = match ? 'YES' : 'NO'
        }
      })
    }

    // Metadata
    if (options.includeMetadata) {
      row['Execution Time (ms)'] = latestSession?.executionTimeMs || ''
      row['Started At'] = latestSession?.startedAt || ''
      row['Finished At'] = latestSession?.finishedAt || ''
      row['Error'] = latestSession?.errorMessage || ''
    }

    // Screenshots
    if (options.includeScreenshots) {
      row['Screenshot URL'] = latestSession?.screenshotUrl || ''
      row['Streaming URL'] = latestSession?.streamingUrl || ''
    }

    return row
  })
}
```

---

## 5. Screenshot Playback System

**Current State**: Not implemented (screenshots saved but no playback UI)
**Priority**: Medium

### 5.1 Implementation Plan

```typescript
// components/ScreenshotPlayback.tsx

interface Screenshot {
  timestamp: string
  title: string
  description: string
  screenshotUrl: string
}

export function ScreenshotPlayback({ session }: { session: Session }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1000) // ms between frames

  const screenshots = session.screenshots || []

  useEffect(() => {
    if (!isPlaying || screenshots.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= screenshots.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, playbackSpeed)

    return () => clearInterval(timer)
  }, [isPlaying, playbackSpeed, screenshots.length])

  if (screenshots.length === 0) {
    return <div className="text-gray-500">No screenshots available</div>
  }

  const currentScreenshot = screenshots[currentIndex]

  return (
    <div className="space-y-4">
      {/* Main Screenshot Display */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={currentScreenshot.screenshotUrl}
          alt={currentScreenshot.title}
          className="w-full h-auto"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <div className="font-medium">{currentScreenshot.title}</div>
          <div className="text-sm">{currentScreenshot.description}</div>
          <div className="text-xs text-gray-300">{currentScreenshot.timestamp}</div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸ Pause' : '▶️ Play'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            ⏮ Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentIndex(Math.min(screenshots.length - 1, currentIndex + 1))}
            disabled={currentIndex === screenshots.length - 1}
          >
            Next ⏭
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Speed:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          >
            <option value={2000}>0.5x</option>
            <option value={1000}>1x</option>
            <option value={500}>2x</option>
            <option value={250}>4x</option>
          </select>
        </div>
      </div>

      {/* Timeline/Thumbnail Strip */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {screenshots.map((screenshot, index) => (
          <div
            key={index}
            className={`flex-shrink-0 cursor-pointer border-2 rounded overflow-hidden ${
              index === currentIndex ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => setCurrentIndex(index)}
          >
            <img
              src={screenshot.screenshotUrl}
              alt={screenshot.title}
              className="w-24 h-16 object-cover"
            />
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="relative h-1 bg-gray-200 rounded-full">
        <div
          className="absolute h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / screenshots.length) * 100}%` }}
        />
      </div>
      <div className="text-sm text-gray-600 text-center">
        {currentIndex + 1} / {screenshots.length} screenshots
      </div>
    </div>
  )
}
```

---

## 6. Instruction Versioning & A/B Testing

**Current State**: Not implemented
**Priority**: Low (advanced feature)

### 6.1 Database Schema

```typescript
export const instructionVersions = pgTable('instruction_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),

  versionNumber: integer('version_number').notNull(),
  versionName: text('version_name'), // e.g., "v2-improved-selectors"
  instructions: text('instructions').notNull(),

  // Metadata
  createdBy: text('created_by'),
  changelog: text('changelog'),

  // Performance tracking
  totalExecutions: integer('total_executions').default(0),
  successRate: real('success_rate'),
  avgAccuracy: real('avg_accuracy'),
  avgExecutionTime: integer('avg_execution_time'),

  // Status
  status: text('status').notNull().default('draft'), // draft, active, archived
  isDefault: boolean('is_default').default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  archivedAt: timestamp('archived_at'),
})

export const abTests = pgTable('ab_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),

  name: text('name').notNull(),
  description: text('description'),

  // Test configuration
  versionAId: uuid('version_a_id').references(() => instructionVersions.id).notNull(),
  versionBId: uuid('version_b_id').references(() => instructionVersions.id).notNull(),
  trafficSplit: real('traffic_split').notNull().default(0.5), // 0.5 = 50/50 split

  // Tracking
  status: text('status').notNull().default('active'), // active, paused, completed
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),

  // Results
  versionAExecutions: integer('version_a_executions').default(0),
  versionBExecutions: integer('version_b_executions').default(0),
  versionASuccessRate: real('version_a_success_rate'),
  versionBSuccessRate: real('version_b_success_rate'),
  versionAAccuracy: real('version_a_accuracy'),
  versionBAccuracy: real('version_b_accuracy'),

  // Winner
  winnerId: uuid('winner_id').references(() => instructionVersions.id),

  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

### 6.2 User Flow

**Flow: A/B Test Instructions**
1. User creates new instruction version
2. User starts A/B test comparing two versions
3. System randomly assigns jobs to version A or B
4. Both versions execute simultaneously
5. System tracks success rate, accuracy, execution time
6. User views A/B test dashboard with results
7. User declares winner and makes it default
8. All future executions use winner version

---

## 7. Advanced Filtering & Search

**Current State**: Basic status filtering only
**Priority**: Medium

### 7.1 Implementation

```typescript
// components/AdvancedFilterPanel.tsx

interface FilterOptions {
  status?: string[]
  hasGroundTruth?: boolean
  accuracy?: { min: number; max: number }
  executionTime?: { min: number; max: number }
  dateRange?: { start: Date; end: Date }
  searchQuery?: string // Full-text search in extracted data
  tags?: string[]
}

export function AdvancedFilterPanel({ onFilterChange }: {
  onFilterChange: (filters: FilterOptions) => void
}) {
  const [filters, setFilters] = useState<FilterOptions>({})

  // UI for building complex filters
  // Multi-select for status
  // Range sliders for accuracy and time
  // Date picker for date range
  // Text search with field targeting

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      {/* Filter controls */}
      <Button onClick={() => onFilterChange(filters)}>
        Apply Filters
      </Button>
    </div>
  )
}
```

---

## 8. Cost Estimation & Tracking

**Current State**: Not implemented
**Priority**: Medium (important for ROI)

### 8.1 Database Schema

```typescript
export const costTracking = pgTable('cost_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),

  // EVA costs
  evaExecutionCost: real('eva_execution_cost'), // USD
  evaTokensUsed: integer('eva_tokens_used'),

  // Infrastructure costs
  computeCost: real('compute_cost'),
  storageCost: real('storage_cost'),

  // Total
  totalCost: real('total_cost').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

### 8.2 Dashboard

Show per-batch, per-project, and overall cost analytics with trends and budget alerts.

---

## 9. User Authentication System

**Current State**: Not implemented
**Priority**: High for production

### 9.1 Implementation Plan

- Use NextAuth.js with multiple providers (Google, GitHub, Email)
- Implement role-based access control (RBAC)
- Add user management UI
- Secure all API endpoints with authentication middleware
- Add audit logs for sensitive operations

---

## 10. Complete User Flow Diagrams

### Flow 1: End-to-End Batch Execution with Ground Truth

```
[User] Create Project
  ↓
[User] Upload CSV with data + ground truth columns
  ↓
[System] Auto-detect ground truth columns
  ↓
[User] Confirm GT columns or manually select
  ↓
[System] Create batch, set hasGroundTruth=true for jobs
  ↓
[User] Set instructions
  ↓
[User] Click "Execute Batch"
  ↓
[System] Execute all jobs via EVA
  ↓
[System] Compare extracted vs ground truth automatically
  ↓
[System] Calculate column-level accuracy metrics
  ↓
[User] View accuracy dashboard
  ↓
[User] Identify low-accuracy fields
  ↓
[User] Update instructions to improve those fields
  ↓
[User] Re-execute failed/low-accuracy jobs
  ↓
[System] Track accuracy improvement over time
  ↓
[User] Export results with GT comparison
```

### Flow 2: Failure Investigation & Resolution

```
[System] Batch execution completes with failures
  ↓
[User] Sees failure count on batch dashboard
  ↓
[User] Clicks "Analyze Failures"
  ↓
[System] Groups failures into patterns
  ↓
[User] Views failure patterns ranked by occurrence
  ↓
[User] Clicks on most common pattern
  ↓
[System] Shows:
  - Root cause analysis
  - Suggested fix
  - List of affected jobs
  - Representative error message
  ↓
[User] Updates instructions based on suggested fix
  ↓
[User] Retries affected jobs
  ↓
[System] Tracks if pattern is resolved
  ↓
[User] Marks pattern as "Resolved" if fixed
```

### Flow 3: Ground Truth Bulk Editing

```
[User] Batch has completed but no GT set
  ↓
[User] Opens batch detail page
  ↓
[User] Clicks "Bulk Edit Ground Truth"
  ↓
[System] Opens bulk editor with all jobs
  ↓
[User] Selects field name (e.g., "price")
  ↓
[User] Selects multiple jobs (checkbox or shift-click)
  ↓
[User] Clicks "Copy from Extracted"
  ↓
[System] Sets GT = extracted for selected jobs
  ↓
[User] Reviews remaining jobs
  ↓
[User] Manually edits incorrect values inline
  ↓
[System] Auto-saves changes
  ↓
[System] Recalculates accuracy metrics
  ↓
[User] Views updated column accuracy dashboard
```

---

## Summary: Implementation Priority

### Phase 1 (Critical - Production Ready)
1. **Ground Truth Management** - Complete bulk editing and column metrics
2. **User Authentication** - Secure the application
3. **Failure Pattern Analysis** - Essential for debugging

### Phase 2 (High Value)
4. **Accuracy Analytics Dashboard** - Track improvements
5. **Batch Export Enhancement** - Better reporting
6. **Advanced Filtering** - Improve UX

### Phase 3 (Nice to Have)
7. **Screenshot Playback** - Better debugging
8. **Cost Tracking** - ROI analysis
9. **Instruction Versioning** - Advanced optimization

---

## Technical Implementation Notes

### Database Migrations
All new tables require Drizzle migrations:
```bash
# Generate migration
npx drizzle-kit generate

# Push to database
DATABASE_URL="..." npx drizzle-kit push
```

### API Response Caching
Implement caching for expensive operations:
- Column metrics calculation (5-minute cache)
- Accuracy trends (1-hour cache)
- Failure pattern detection (until batch changes)

### Real-time Updates
Use WebSocket for live updates:
- Accuracy metrics recalculation progress
- Bulk edit operation status
- A/B test results updates

### Performance Optimization
- Lazy load screenshot thumbnails
- Paginate job lists in bulk editor
- Index database queries properly
- Use React Query for client-side caching

---

## End of Document

**Total Features Planned**: 9 major feature sets
**Database Tables to Add**: 4 new tables
**API Endpoints to Create**: ~20 new endpoints
**Frontend Components to Build**: ~15 major components

This plan provides complete specifications for frontend, backend, and EVA agent integration for all identified feature gaps in MINO v2.
