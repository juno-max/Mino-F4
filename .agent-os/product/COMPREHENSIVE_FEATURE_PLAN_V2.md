# MINO v2 - Comprehensive Feature Planning Document

**Version**: 2.0
**Date**: 2025-11-05
**Status**: Production-Ready Planning
**Completion**: Ground Truth System 85% Complete

---

## Table of Contents

1. [Ground Truth Management System](#1-ground-truth-management-system-priority) ✅ 85% Complete
2. [Accuracy Analytics Dashboard](#2-accuracy-analytics-dashboard)
3. [Batch Export Enhancement](#3-batch-export-enhancement)
4. [Screenshot Playback System](#4-screenshot-playback-system)
5. [Instruction Versioning](#5-instruction-versioning)
6. [Advanced Filtering & Search](#6-advanced-filtering--search)
7. [Complete User Workflows](#7-complete-user-workflows)

---

## Core User Personas & Workflows

### Persona 1: QA Engineer (Primary User)
**Goals**: Validate accuracy, identify failures, establish baselines
**Key Workflows**:
1. Upload batch → Set ground truth → Run test → Review results → Export report
2. Bulk edit GT for failed jobs → Re-run → Compare before/after
3. Debug specific failure → Watch playback → Update instructions

### Persona 2: Data Analyst
**Goals**: Understand patterns, measure improvement, report metrics
**Key Workflows**:
1. View accuracy dashboard → Drill into specific columns → Identify weak fields
2. Compare instruction versions → Analyze delta → Recommend improvements
3. Export data with GT comparison → Create executive reports

### Persona 3: Product Manager
**Goals**: Track progress, measure ROI, prioritize improvements
**Key Workflows**:
1. View high-level accuracy trends over time
2. Compare different batches/datasets
3. Filter to see only high-value failures

### Persona 4: Developer
**Goals**: Debug agent behavior, improve extraction logic
**Key Workflows**:
1. Review failed job → Watch screenshot sequence → Understand what agent saw
2. Test instruction changes → Compare accuracy → Iterate quickly
3. Search for specific error patterns across all jobs

---

## 1. Ground Truth Management System (PRIORITY)

**Current State**: 85% Complete
**Status**: ✅ Schema, APIs, Bulk Editor, Column Metrics, Visual Diff all implemented
**Remaining**: Trend tracking, historical comparison

### 1.1 Completed Features

✅ **Database Schema**
- `ground_truth_column_metrics` table with indexes
- `batches.lastGtMetricsCalculation`, `batches.overallAccuracy`
- `jobs.groundTruthMetadata` for tracking provenance

✅ **API Endpoints**
- `POST /api/batches/[id]/ground-truth/bulk-set` - Bulk set GT for multiple jobs
- `POST /api/batches/[id]/ground-truth/bulk-edit` - Field-specific bulk operations
- `GET /api/batches/[id]/ground-truth/column-metrics` - Real-time accuracy calculation

✅ **UI Components**
- `BulkGTEditor` - Table-based bulk editing with select/set/copy/clear operations
- `ColumnMetrics` - Visual breakdown with progress bars, error examples
- `GroundTruthDiff` - Enhanced comparison with similarity scoring

### 1.2 Remaining Work: Historical Trend Tracking

**Problem**: Users can't see how accuracy improves over time as they iterate on instructions

**Solution**: Track metrics history and visualize trends

#### Database Schema Addition

```typescript
// New table to store historical snapshots of metrics
export const groundTruthMetricsHistory = pgTable('ground_truth_metrics_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  executionId: uuid('execution_id').references(() => executions.id, { onDelete: 'cascade' }),

  // Snapshot of overall metrics at this point in time
  overallAccuracy: real('overall_accuracy').notNull(),
  totalJobs: integer('total_jobs').notNull(),
  jobsEvaluated: integer('jobs_evaluated').notNull(),
  exactMatches: integer('exact_matches').notNull(),
  partialMatches: integer('partial_matches').notNull(),

  // Column-level breakdown
  columnMetrics: jsonb('column_metrics').$type<Array<{
    columnName: string
    accuracy: number
    exactMatches: number
    mismatches: number
  }>>(),

  // Context
  instructionVersionId: uuid('instruction_version_id').references(() => instructionVersions.id),
  notes: text('notes'), // User can add notes about what changed

  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Index for efficient time-series queries
CREATE INDEX idx_gt_metrics_history_batch_time
ON ground_truth_metrics_history(batch_id, created_at DESC);

CREATE INDEX idx_gt_metrics_history_execution
ON ground_truth_metrics_history(execution_id);
```

#### API Endpoint

```typescript
// GET /api/batches/[id]/ground-truth/trends
// Returns time-series data for charting
interface TrendResponse {
  dataPoints: Array<{
    timestamp: string
    executionId: string
    overallAccuracy: number
    columnMetrics: Array<{
      columnName: string
      accuracy: number
    }>
    instructionVersion?: number
    notes?: string
  }>

  // Statistical summary
  summary: {
    firstRecorded: string
    latestRecorded: string
    averageAccuracy: number
    bestAccuracy: number
    worstAccuracy: number
    trend: 'improving' | 'declining' | 'stable' // Based on linear regression
    improvementRate: number // Percentage points per day
  }
}

// POST /api/batches/[id]/ground-truth/snapshot
// Create a manual snapshot (user wants to mark a milestone)
interface SnapshotRequest {
  notes?: string
  executionId?: string
}
```

#### UI Component: Accuracy Trend Chart

```typescript
// components/AccuracyTrendChart.tsx
// Line chart showing accuracy over time
// Features:
// - Overall accuracy line (bold)
// - Per-column accuracy lines (lighter, toggleable)
// - Markers for instruction version changes
// - Hover tooltip showing full metrics
// - Zoom/pan for long time ranges
// - Download chart as PNG
// - Annotations for user notes

interface AccuracyTrendChartProps {
  batchId: string
  dateRange?: { start: Date; end: Date }
  highlightColumns?: string[] // Which columns to show prominently
}
```

**User Flow**:
1. User runs initial test → Auto-snapshot created
2. User edits instructions and re-runs → New snapshot created, linked to instruction version
3. User views trend chart → Sees improvement from 65% → 82%
4. User clicks data point → Drills into that execution's details
5. User adds note "Fixed price extraction logic" → Visible on chart

**Implementation Estimate**: 2-3 days
- 1 day: Database table, API endpoints, snapshot logic
- 1 day: Trend chart component with interactions
- 0.5 day: Integration and testing

---

## 2. Accuracy Analytics Dashboard

**Current State**: Column-level metrics exist, need comprehensive dashboard
**Goal**: Single-page view of all accuracy insights

### 2.1 Problem Statement

Users need to:
- Quickly assess overall batch health at a glance
- Identify which columns need the most attention
- Understand accuracy distribution (how many jobs at each accuracy level)
- See failure patterns and common errors
- Compare current state vs historical best

### 2.2 Dashboard Layout (Research-Based Design)

**Inspiration**: Datadog, Grafana, Google Analytics dashboards
**Principle**: F-pattern reading, most important metrics top-left, drill-down capability

```
┌─────────────────────────────────────────────────────────────┐
│ Batch: Product Scraping Test #3              [Export] [⚙️]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   82%    │  │ 164/200  │  │   🟢     │  │   ↑ +7%  │    │
│  │ Accuracy │  │Jobs w/ GT│  │  Status  │  │ vs Last  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Accuracy Distribution                                  │  │
│  │ ████████████████ 90-100%: 120 jobs (60%)             │  │
│  │ ████████ 70-89%: 40 jobs (20%)                       │  │
│  │ ████ 50-69%: 20 jobs (10%)                           │  │
│  │ ██ <50%: 20 jobs (10%)                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Column Performance (Worst to Best)                    │  │
│  │ shipping_cost    ████████░░░░░░░░░░  45% (⚠️ Critical)│  │
│  │ price           ███████████████░░░░░  72% (⚠️ Needs   │  │
│  │ product_name    ██████████████████░░  88% (✓ Good)    │  │
│  │ availability    ████████████████████  95% (✓ Excellent│  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │ Common Errors       │  │ Accuracy Trend (7 days)    │  │
│  │ 1. Missing extract  │  │      📈                     │  │
│  │    (32 jobs)        │  │     /                       │  │
│  │ 2. Format mismatch  │  │    /                        │  │
│  │    (18 jobs)        │  │   /                         │  │
│  │ 3. Type error       │  │  /                          │  │
│  │    (12 jobs)        │  │ ─────────────────────────   │  │
│  │ [View All →]        │  │ Mon  Tue  Wed  Thu  Fri     │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Quick Actions                                          │  │
│  │ [Bulk Edit GT for Failed Jobs]  [Export Failed Jobs]  │  │
│  │ [Re-run Failed Only]  [Compare with Previous Run]     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Database Schema

No new tables needed - uses existing `groundTruthColumnMetrics` and `groundTruthMetricsHistory`

### 2.4 API Endpoint

```typescript
// GET /api/batches/[id]/analytics/dashboard
// Single endpoint that returns all dashboard data for efficiency

interface DashboardResponse {
  overview: {
    overallAccuracy: number
    totalJobs: number
    jobsWithGroundTruth: number
    statusHealth: 'excellent' | 'good' | 'needs_attention' | 'critical'
    deltaFromLast: number | null // Percentage point change vs last run
  }

  distribution: {
    ranges: Array<{
      label: string // "90-100%", "70-89%", etc.
      count: number
      percentage: number
      jobIds: string[] // For drill-down
    }>
  }

  columnPerformance: Array<{
    columnName: string
    accuracy: number
    status: 'excellent' | 'good' | 'needs_attention' | 'critical'
    exactMatches: number
    mismatches: number
    trend: 'up' | 'down' | 'stable' | null
  }>

  commonErrors: Array<{
    errorType: string
    count: number
    affectedColumns: string[]
    exampleJobIds: string[]
  }>

  recentTrend: {
    dataPoints: Array<{
      date: string
      accuracy: number
    }>
    trendDirection: 'improving' | 'declining' | 'stable'
  }
}
```

### 2.5 UI Component

```typescript
// app/projects/[id]/batches/[batchId]/analytics/page.tsx
// Full-page dashboard with interactive charts

// Key interactions:
// 1. Click accuracy distribution bar → Filter jobs to that range
// 2. Click column → Drill into column-specific view
// 3. Click error type → See affected jobs
// 4. Hover trend chart → See exact metrics
// 5. Export button → Download dashboard as PDF
```

**Implementation Estimate**: 3-4 days
- 1.5 days: API endpoint with efficient queries
- 2 days: Dashboard UI with charts (use recharts library)
- 0.5 day: Interactivity and drill-downs

---

## 3. Batch Export Enhancement

**Current State**: No export functionality
**Goal**: Export execution results in multiple formats with flexible column selection

### 3.1 Problem Statement

Users need to:
- Export results for reporting to stakeholders
- Download specific columns only (not all data)
- Include or exclude ground truth comparison
- Export in different formats (CSV, JSON, Excel)
- Batch download all screenshots from a run
- Schedule automated exports (future)

### 3.2 Export Types

#### 3.2.1 Data Export

**Format Options**:
- CSV (most common for spreadsheet users)
- JSON (for developers/APIs)
- Excel (.xlsx) with multiple sheets (for analysts)

**Column Selection**:
- Input columns (from CSV)
- Output columns (extracted data)
- Ground truth columns
- Comparison columns (match status, similarity score)
- Metadata (status, execution time, error messages)
- Screenshots URLs

**Filter Options**:
- All jobs vs selected jobs only
- Only jobs with ground truth
- Only failed/passed jobs
- Date range

#### 3.2.2 Screenshot Export

**Options**:
- ZIP file with all screenshots from a batch
- Individual screenshot download
- Include screenshot metadata (timestamp, description)

### 3.3 Database Schema

```typescript
// Track export history for audit and re-download
export const exports = pgTable('exports', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  executionId: uuid('execution_id').references(() => executions.id),

  exportType: text('export_type').notNull(), // 'data' | 'screenshots'
  format: text('format').notNull(), // 'csv' | 'json' | 'xlsx' | 'zip'

  // Configuration used for this export
  config: jsonb('config').$type<{
    columns: string[]
    includeGroundTruth: boolean
    includeComparison: boolean
    filters: {
      status?: string[]
      hasGroundTruth?: boolean
      accuracyRange?: { min: number; max: number }
    }
  }>(),

  // Result
  fileUrl: text('file_url'), // S3/storage URL
  fileSize: integer('file_size'), // bytes
  rowCount: integer('row_count'),

  status: text('status').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage: text('error_message'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
})
```

### 3.4 API Endpoints

```typescript
// POST /api/batches/[id]/export
// Create a new export job
interface ExportRequest {
  type: 'data' | 'screenshots'
  format: 'csv' | 'json' | 'xlsx' | 'zip'
  config: {
    columns?: string[] // If omitted, include all
    includeGroundTruth?: boolean
    includeComparison?: boolean
    filters?: {
      jobIds?: string[] // Specific jobs
      status?: string[]
      hasGroundTruth?: boolean
      accuracyRange?: { min: number; max: number }
    }
  }
}

interface ExportResponse {
  exportId: string
  status: 'pending' | 'processing'
  estimatedWaitTime: number // seconds
}

// GET /api/exports/[exportId]
// Check status and get download URL
interface ExportStatusResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number // 0-100
  downloadUrl?: string // Present when status === 'completed'
  errorMessage?: string
}

// GET /api/exports/[exportId]/download
// Direct download link (redirects to file)
```

### 3.5 Export Processing Logic

```typescript
// lib/export-processor.ts
// Background job that generates export files

async function processDataExport(exportId: string) {
  const exportJob = await db.query.exports.findFirst({ where: eq(exports.id, exportId) })

  // Update status to processing
  await db.update(exports)
    .set({ status: 'processing' })
    .where(eq(exports.id, exportId))

  try {
    // Fetch jobs based on filters
    const jobs = await fetchJobsForExport(exportJob.batchId, exportJob.config.filters)

    // Generate file based on format
    let fileBuffer: Buffer
    if (exportJob.format === 'csv') {
      fileBuffer = await generateCSV(jobs, exportJob.config)
    } else if (exportJob.format === 'json') {
      fileBuffer = await generateJSON(jobs, exportJob.config)
    } else if (exportJob.format === 'xlsx') {
      fileBuffer = await generateExcel(jobs, exportJob.config)
    }

    // Upload to storage (S3 or local)
    const fileUrl = await uploadToStorage(fileBuffer, `exports/${exportId}.${exportJob.format}`)

    // Update export record
    await db.update(exports)
      .set({
        status: 'completed',
        fileUrl,
        fileSize: fileBuffer.length,
        rowCount: jobs.length,
        completedAt: new Date(),
      })
      .where(eq(exports.id, exportId))
  } catch (error) {
    await db.update(exports)
      .set({
        status: 'failed',
        errorMessage: error.message,
      })
      .where(eq(exports.id, exportId))
  }
}

async function generateCSV(jobs: Job[], config: ExportConfig): Promise<Buffer> {
  const rows: any[] = []

  for (const job of jobs) {
    const row: any = {}

    // Add selected columns
    const latestSession = job.sessions[0]
    const extractedData = latestSession?.extractedData || {}
    const groundTruthData = job.groundTruthData || {}

    for (const columnName of config.columns) {
      row[columnName] = extractedData[columnName]

      if (config.includeGroundTruth && groundTruthData[columnName]) {
        row[`${columnName}_expected`] = groundTruthData[columnName]
      }

      if (config.includeComparison && groundTruthData[columnName]) {
        const isMatch = normalizeValue(extractedData[columnName]) ===
                       normalizeValue(groundTruthData[columnName])
        row[`${columnName}_match`] = isMatch ? 'PASS' : 'FAIL'
      }
    }

    // Add metadata
    row['job_id'] = job.id
    row['status'] = job.status
    row['url'] = job.siteUrl

    rows.push(row)
  }

  // Convert to CSV using papaparse or similar
  const csv = Papa.unparse(rows)
  return Buffer.from(csv, 'utf-8')
}

async function generateExcel(jobs: Job[], config: ExportConfig): Promise<Buffer> {
  // Use exceljs library
  const workbook = new ExcelJS.Workbook()

  // Sheet 1: Data
  const dataSheet = workbook.addWorksheet('Results')
  // ... populate with jobs data

  // Sheet 2: Summary
  const summarySheet = workbook.addWorksheet('Summary')
  // ... add accuracy metrics, column performance

  // Sheet 3: Ground Truth Comparison (if included)
  if (config.includeComparison) {
    const comparisonSheet = workbook.addWorksheet('GT Comparison')
    // ... show side-by-side comparison
  }

  return await workbook.xlsx.writeBuffer()
}
```

### 3.6 UI Component

```typescript
// components/ExportDialog.tsx
// Modal dialog for configuring and triggering export

interface ExportDialogProps {
  batchId: string
  preSelectedJobIds?: string[] // If user selected specific jobs
}

// Features:
// - Format selector (CSV, JSON, Excel)
// - Column multi-select with "Select All" / "Deselect All"
// - Checkboxes for "Include Ground Truth", "Include Comparison"
// - Filter section (status, accuracy range)
// - Preview: Shows "X jobs, Y columns, estimated file size ~Z MB"
// - Export button → Shows progress → Provides download link
```

**User Flow**:
1. User clicks "Export" button on batch page
2. Dialog opens with default settings (all columns, all jobs)
3. User selects CSV format, unchecks some columns
4. User checks "Include Ground Truth Comparison"
5. Preview updates: "200 jobs, 8 columns, ~1.2 MB"
6. User clicks "Export"
7. Progress bar shows "Generating export... 45%"
8. When complete, "Download" button appears
9. User downloads CSV
10. Export remains in "Export History" for 30 days

**Implementation Estimate**: 4-5 days
- 1 day: Database schema, export history tracking
- 2 days: Export processor (CSV, JSON, Excel generation)
- 1.5 days: UI dialog with preview and download
- 0.5 day: Screenshot export (ZIP generation)

---

## 4. Screenshot Playback System

**Current State**: Screenshots stored but no playback UI
**Goal**: Timeline-based playback with annotations

### 4.1 Problem Statement

Users need to:
- Understand what the agent "saw" during execution
- Identify exactly where extraction failed
- Share specific screenshots with team members
- Compare screenshots across different runs
- Download screenshots for documentation

### 4.2 Current Screenshot Storage

Sessions already store:
```typescript
screenshots: jsonb('screenshots').$type<Array<{
  timestamp: string
  title: string
  description: string
  screenshotUrl: string
}>>()
```

### 4.3 Playback UI Design

**Inspiration**: YouTube/Vimeo video players, Loom screen recording viewer
**Key Features**:
- Timeline scrubber
- Auto-play with adjustable speed
- Keyboard shortcuts (space = play/pause, arrows = prev/next)
- Fullscreen mode
- Annotations overlay
- Download individual frame or sequence

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Job                          Screenshot Playback  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                     ┌───────────────┐                        │
│                     │               │                        │
│                     │               │                        │
│                     │  Screenshot   │                        │
│                     │    Image      │                        │
│                     │               │                        │
│                     └───────────────┘                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📍 Step 3: Navigate to product page                  │   │
│  │ Product name extracted: "Nike Air Max 90"            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ◄  ▶  ❚❚  [═════●══════════════] 3 of 12  ⚡ 🔍 ↗️ ⬇️       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Timeline                                              │   │
│  │ ●─────●────────●─────●────────────────●──────────●  │   │
│  │ Load  Search  Click  Extract  Scroll  Verify  Done  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │ Extracted Data   │  │ Keyboard Shortcuts              │ │
│  │ • Name: ✓        │  │ Space:  Play/Pause              │ │
│  │ • Price: ✓       │  │ ←/→:    Prev/Next Frame         │ │
│  │ • Stock: ✗       │  │ F:      Fullscreen              │ │
│  └──────────────────┘  │ D:      Download Current        │ │
│                        └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 API Endpoints

```typescript
// GET /api/jobs/[id]/screenshots
// Returns all screenshots for a job session
interface ScreenshotsResponse {
  sessionId: string
  screenshots: Array<{
    id: string // Generated ID for referencing
    timestamp: string
    title: string
    description: string
    url: string
    extractedData?: Record<string, any> // Data extracted at this step
    annotations?: Array<{
      type: 'click' | 'extract' | 'scroll' | 'input'
      x: number
      y: number
      width?: number
      height?: number
      label: string
    }>
  }>
  totalDuration: number // milliseconds
}

// GET /api/jobs/[id]/screenshots/[screenshotId]/download
// Direct download link for single screenshot

// POST /api/jobs/[id]/screenshots/download-all
// Generate ZIP of all screenshots
interface DownloadAllResponse {
  zipUrl: string
  expiresAt: string // Temporary download link
}
```

### 4.5 UI Component

```typescript
// components/ScreenshotPlayback.tsx

interface ScreenshotPlaybackProps {
  jobId: string
  sessionId: string
  autoPlay?: boolean
  startAtIndex?: number
}

export function ScreenshotPlayback({ jobId, sessionId }: ScreenshotPlaybackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 0.5x, 1x, 2x
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    ' ': () => togglePlayPause(),
    'ArrowLeft': () => previousFrame(),
    'ArrowRight': () => nextFrame(),
    'f': () => toggleFullscreen(),
    'd': () => downloadCurrent(),
  })

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      if (currentIndex < screenshots.length - 1) {
        setCurrentIndex(i => i + 1)
      } else {
        setIsPlaying(false) // Stop at end
      }
    }, 2000 / playbackSpeed) // 2 seconds per frame at 1x speed

    return () => clearInterval(interval)
  }, [isPlaying, currentIndex, playbackSpeed])

  // Render screenshot with annotations
  return (
    <div className={isFullscreen ? 'fullscreen' : ''}>
      <div className="screenshot-viewer">
        <img src={currentScreenshot.url} alt={currentScreenshot.title} />

        {/* Annotation overlays */}
        {currentScreenshot.annotations?.map(annotation => (
          <div
            key={annotation.label}
            className="annotation"
            style={{
              left: annotation.x,
              top: annotation.y,
              width: annotation.width,
              height: annotation.height,
            }}
          >
            {annotation.label}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="playback-controls">
        <button onClick={previousFrame}>◄</button>
        <button onClick={togglePlayPause}>{isPlaying ? '❚❚' : '▶'}</button>
        <button onClick={nextFrame}>►</button>

        <input
          type="range"
          min="0"
          max={screenshots.length - 1}
          value={currentIndex}
          onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
        />

        <span>{currentIndex + 1} of {screenshots.length}</span>

        <select value={playbackSpeed} onChange={e => setPlaybackSpeed(Number(e.target.value))}>
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
        </select>

        <button onClick={toggleFullscreen}>🔍</button>
        <button onClick={downloadCurrent}>⬇️</button>
      </div>

      {/* Timeline */}
      <div className="timeline">
        {screenshots.map((s, idx) => (
          <div
            key={idx}
            className={`timeline-marker ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          >
            <div className="tooltip">{s.title}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 4.6 Screenshot Comparison Feature

**Use Case**: User wants to compare how agent behaved in two different runs

```typescript
// components/ScreenshotComparison.tsx
// Side-by-side view of screenshots from two different sessions

interface ScreenshotComparisonProps {
  jobId1: string
  sessionId1: string
  jobId2: string
  sessionId2: string
}

// Shows:
// - Two playback viewers side-by-side
// - Synchronized playback (both play together)
// - Highlight differences in extracted data
// - Show where execution diverged
```

**Implementation Estimate**: 3-4 days
- 1 day: API endpoints, screenshot aggregation
- 2 days: Playback UI with timeline, controls
- 0.5 day: Keyboard shortcuts, fullscreen mode
- 0.5 day: Download functionality

---

## 5. Instruction Versioning

**Current State**: `instructionVersions` table exists but no UI
**Goal**: Track, compare, and revert instruction changes

### 5.1 Problem Statement

Users need to:
- Track how instructions evolved over time
- Compare accuracy between different instruction versions
- Revert to a previous version if new version performs worse
- Understand which instruction changes had the biggest impact
- Branch and experiment without affecting production

### 5.2 Database Schema Enhancement

```typescript
// Existing table (already in schema)
export const instructionVersions = pgTable('instruction_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  instructions: text('instructions').notNull(),
  versionNumber: integer('version_number').notNull(),
  changeDescription: text('change_description'),
  accuracyImpact: decimal('accuracy_impact', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Add new fields
ALTER TABLE instruction_versions ADD COLUMN parent_version_id UUID REFERENCES instruction_versions(id);
ALTER TABLE instruction_versions ADD COLUMN is_production BOOLEAN DEFAULT false;
ALTER TABLE instruction_versions ADD COLUMN tags TEXT[]; // ['production', 'experiment', 'v2.0']

// Link executions to instruction versions
ALTER TABLE executions ADD COLUMN instruction_version_id UUID REFERENCES instruction_versions(id);
```

### 5.3 Version Management API

```typescript
// POST /api/projects/[id]/instructions/versions
// Create a new version
interface CreateVersionRequest {
  instructions: string
  changeDescription: string
  parentVersionId?: string // For branching
  tags?: string[]
  setAsProduction?: boolean // Make this the active version
}

// GET /api/projects/[id]/instructions/versions
// List all versions with metrics
interface VersionListResponse {
  versions: Array<{
    id: string
    versionNumber: number
    instructions: string
    changeDescription: string
    accuracyImpact: number | null
    executionCount: number // How many times this version was used
    avgAccuracy: number | null
    tags: string[]
    isProduction: boolean
    createdAt: string
  }>

  productionVersionId: string
}

// GET /api/projects/[id]/instructions/versions/[versionId]/compare/[otherVersionId]
// Compare two versions
interface VersionComparisonResponse {
  versionA: {
    id: string
    versionNumber: number
    instructions: string
    avgAccuracy: number
  }
  versionB: {
    id: string
    versionNumber: number
    instructions: string
    avgAccuracy: number
  }

  // Text diff
  diff: Array<{
    type: 'added' | 'removed' | 'unchanged'
    line: string
  }>

  // Performance comparison
  accuracyDelta: number // versionB - versionA
  columnComparison: Array<{
    columnName: string
    accuracyA: number
    accuracyB: number
    delta: number
  }>

  // Execution history
  executionsA: number
  executionsB: number
}

// POST /api/projects/[id]/instructions/versions/[versionId]/activate
// Set a version as production
```

### 5.4 UI: Version History View

```
┌─────────────────────────────────────────────────────────────┐
│ Product Scraping Instructions              [+ New Version]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🟢 Production: v5 (82% avg accuracy)                         │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Version History                                        │   │
│ │                                                        │   │
│ │ ● v5 - Current (🟢 Production)              82% ───▲   │   │
│ │   "Fixed price extraction, added currency"   4 runs   │   │
│ │   Oct 15, 2024 • [View] [Compare] [Revert]           │   │
│ │                                                        │   │
│ │ ● v4                                         75% ───   │   │
│ │   "Improved product name matching"           8 runs   │   │
│ │   Oct 12, 2024 • [View] [Compare]                    │   │
│ │                                                        │   │
│ │ ● v3                                         68% ───   │   │
│ │   "Initial extraction logic"                 3 runs   │   │
│ │   Oct 10, 2024 • [View] [Compare]                    │   │
│ │                                                        │   │
│ │ ● v2                                         62% ───▼  │   │
│ │   "First iteration"                          1 run    │   │
│ │   Oct 8, 2024 • [View] [Compare]                     │   │
│ │                                                        │   │
│ │ ● v1                                         N/A       │   │
│ │   "Initial version"                          0 runs   │   │
│ │   Oct 5, 2024 • [View]                               │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 UI: Version Comparison View

```
┌─────────────────────────────────────────────────────────────┐
│ Compare: v4 vs v5                              [← Back]     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 📊 Performance Delta: +7% (75% → 82%)                        │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Column-Level Impact                                    │   │
│ │ price:         +12% (65% → 77%) ⬆️ Major improvement   │   │
│ │ product_name:   +5% (83% → 88%) ⬆️ Improved            │   │
│ │ shipping:       +3% (72% → 75%) ⬆️ Slight improvement  │   │
│ │ availability:   -1% (92% → 91%) ⬇️ Minor regression    │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Instruction Changes                                    │   │
│ │                                                        │   │
│ │ v4                          │  v5                      │   │
│ │ ──────────────────────────  │  ─────────────────────  │   │
│ │ Extract the product price   │  Extract the product    │   │
│ │ from the page              │  price with currency    │   │
│ │                            │  (e.g., $99.99 USD)     │   │
│ │                            │                          │   │
│ │ + Added: "Include currency symbol and code"          │   │
│ │ + Added: "Handle sale prices in red text"            │   │
│ │ ~ Modified: "Product price" → "Product price with    │   │
│ │              currency"                                │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ 💡 Recommendation: v5 shows consistent improvement across    │
│    all columns. Consider making this the production version. │
│                                                               │
│ [Set v5 as Production]  [Run Side-by-Side Test]              │
└─────────────────────────────────────────────────────────────┘
```

### 5.6 Workflow: Creating and Testing a New Version

**User Flow**:
1. User is on project page → Clicks "Instructions" tab
2. Sees current production version (v5) with 82% accuracy
3. Clicks "Edit" → Opens instruction editor
4. Makes changes: "Extract product rating out of 5 stars"
5. Clicks "Save as New Version"
6. Dialog: "Version name?" → User enters "v6 - Added rating"
7. Dialog: "Test before making production?" → User selects "Yes, run test"
8. System creates v6, queues test execution with 20 sample jobs
9. User waits for test to complete
10. Results: v6 achieved 84% accuracy (+2% vs v5)
11. User clicks "Set as Production"
12. v6 is now active for all new batches

**Implementation Estimate**: 3-4 days
- 1 day: Version CRUD APIs, production flag management
- 1.5 days: Version history UI, comparison UI
- 0.5 day: Text diff implementation
- 1 day: Integration with execution system, metrics calculation

---

## 6. Advanced Filtering & Search

**Current State**: Basic table display, no filtering
**Goal**: Powerful filtering to find exactly what you're looking for

### 6.1 Problem Statement

Users need to:
- Find jobs by status (failed, completed, running)
- Filter by accuracy range (e.g., show me 50-70% accuracy jobs)
- Search by URL, extracted values, or ground truth
- Combine multiple filters (failed AND has ground truth AND accuracy < 80%)
- Save filter presets for common queries
- Share filtered views via URL

### 6.2 Filter Types

#### 6.2.1 Basic Filters (UI Toggles/Dropdowns)

```typescript
interface JobFilters {
  // Status
  status: ('queued' | 'running' | 'completed' | 'error')[]

  // Ground Truth
  hasGroundTruth: boolean | null
  evaluationResult: ('pass' | 'fail')[] | null

  // Accuracy
  accuracyRange: {
    min: number // 0-100
    max: number
  } | null

  // Date
  dateRange: {
    start: Date
    end: Date
  } | null

  // Execution
  executionId: string | null

  // Text search
  searchQuery: string // Searches in URL, extracted data, ground truth
}
```

#### 6.2.2 Advanced Search (Query Builder)

```typescript
// Allow users to build complex queries like:
// (status = 'error' OR accuracy < 70%) AND hasGroundTruth = true

interface SearchQuery {
  operator: 'AND' | 'OR'
  conditions: Array<{
    field: string
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith'
    value: any
  } | SearchQuery> // Nested queries
}
```

#### 6.2.3 Saved Filter Presets

```typescript
interface FilterPreset {
  id: string
  name: string
  filters: JobFilters
  isDefault: boolean

  // Examples:
  // "Failed with GT" - status = error, hasGroundTruth = true
  // "Needs Review" - accuracy < 80%, hasGroundTruth = true
  // "High Performers" - accuracy >= 95%
}
```

### 6.3 Database Schema

```typescript
// Store user's saved filter presets
export const filterPresets = pgTable('filter_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  filters: jsonb('filters').$type<JobFilters>().notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Add indexes for commonly filtered fields
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_has_ground_truth ON jobs(has_ground_truth);
CREATE INDEX idx_jobs_evaluation_result ON jobs(evaluation_result);
CREATE INDEX idx_jobs_batch_status ON jobs(batch_id, status);
```

### 6.4 API Endpoints

```typescript
// GET /api/batches/[id]/jobs?filter=...
// Supports all filter parameters via query string
// Uses URL state for shareability

interface JobsQueryParams {
  status?: string // Comma-separated
  hasGroundTruth?: 'true' | 'false'
  evaluationResult?: string // Comma-separated
  accuracyMin?: number
  accuracyMax?: number
  search?: string
  executionId?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Example:
// GET /api/batches/abc123/jobs?status=error,completed&hasGroundTruth=true&accuracyMax=80&search=nike

interface JobsResponse {
  jobs: Job[]
  total: number
  page: number
  pageSize: number
  filters: JobFilters // Echo back applied filters
}

// GET /api/projects/[id]/filter-presets
// List saved presets

// POST /api/projects/[id]/filter-presets
// Create new preset
interface CreatePresetRequest {
  name: string
  filters: JobFilters
  setAsDefault?: boolean
}

// DELETE /api/projects/[id]/filter-presets/[presetId]
```

### 6.5 UI Component

```typescript
// components/JobsFilterPanel.tsx

interface JobsFilterPanelProps {
  projectId: string
  batchId: string
  currentFilters: JobFilters
  onChange: (filters: JobFilters) => void
}

export function JobsFilterPanel({ currentFilters, onChange }: JobsFilterPanelProps) {
  return (
    <div className="filter-panel">
      {/* Quick Filters */}
      <div className="quick-filters">
        <button onClick={() => setPreset('failed-with-gt')}>
          Failed with GT
        </button>
        <button onClick={() => setPreset('needs-review')}>
          Needs Review
        </button>
        <button onClick={() => setPreset('high-performers')}>
          High Performers
        </button>
      </div>

      {/* Status Filter */}
      <div className="filter-group">
        <label>Status</label>
        <CheckboxGroup
          options={['queued', 'running', 'completed', 'error']}
          value={currentFilters.status}
          onChange={(status) => onChange({ ...currentFilters, status })}
        />
      </div>

      {/* Ground Truth Filter */}
      <div className="filter-group">
        <label>Ground Truth</label>
        <select
          value={currentFilters.hasGroundTruth}
          onChange={(e) => onChange({
            ...currentFilters,
            hasGroundTruth: e.target.value === 'all' ? null : e.target.value === 'true'
          })}
        >
          <option value="all">All Jobs</option>
          <option value="true">With GT Only</option>
          <option value="false">Without GT</option>
        </select>
      </div>

      {/* Evaluation Result */}
      <div className="filter-group">
        <label>Evaluation</label>
        <CheckboxGroup
          options={['pass', 'fail']}
          value={currentFilters.evaluationResult}
          onChange={(evaluationResult) => onChange({ ...currentFilters, evaluationResult })}
        />
      </div>

      {/* Accuracy Range */}
      <div className="filter-group">
        <label>Accuracy Range</label>
        <RangeSlider
          min={0}
          max={100}
          value={[currentFilters.accuracyRange?.min || 0, currentFilters.accuracyRange?.max || 100]}
          onChange={([min, max]) => onChange({
            ...currentFilters,
            accuracyRange: { min, max }
          })}
        />
        <span>{currentFilters.accuracyRange?.min || 0}% - {currentFilters.accuracyRange?.max || 100}%</span>
      </div>

      {/* Search */}
      <div className="filter-group">
        <label>Search</label>
        <input
          type="text"
          placeholder="Search URLs, data..."
          value={currentFilters.searchQuery}
          onChange={(e) => onChange({ ...currentFilters, searchQuery: e.target.value })}
        />
      </div>

      {/* Save Preset */}
      <div className="filter-actions">
        <button onClick={clearAll}>Clear All</button>
        <button onClick={saveAsPreset}>Save Preset</button>
      </div>
    </div>
  )
}
```

### 6.6 URL State Management

**Key Feature**: Filters are reflected in URL for shareability

```typescript
// Use Next.js router to sync filters with URL
import { useRouter, useSearchParams } from 'next/navigation'

function useJobFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse filters from URL
  const filters: JobFilters = {
    status: searchParams.get('status')?.split(',') || [],
    hasGroundTruth: searchParams.get('hasGroundTruth') === 'true' ? true :
                   searchParams.get('hasGroundTruth') === 'false' ? false : null,
    // ... parse all filters
  }

  // Update URL when filters change
  const updateFilters = (newFilters: JobFilters) => {
    const params = new URLSearchParams()

    if (newFilters.status.length > 0) {
      params.set('status', newFilters.status.join(','))
    }

    if (newFilters.hasGroundTruth !== null) {
      params.set('hasGroundTruth', String(newFilters.hasGroundTruth))
    }

    // ... set all params

    router.push(`?${params.toString()}`)
  }

  return { filters, updateFilters }
}

// User can now share:
// https://mino.app/projects/abc/batches/xyz?status=error&hasGroundTruth=true&accuracyMax=80
// And recipient sees exact same filtered view
```

### 6.7 Keyboard Shortcuts

**Power User Feature**:
- `/` - Focus search box
- `Cmd+F` - Open filter panel
- `Cmd+K` - Quick command palette (search presets, actions)
- `Esc` - Clear filters

**Implementation Estimate**: 3-4 days
- 1 day: Backend filtering logic, indexed queries
- 1.5 days: Filter panel UI with all controls
- 0.5 day: URL state sync
- 1 day: Saved presets functionality

---

## 7. Complete User Workflows

### 7.1 Workflow 1: First-Time Setup

**Persona**: QA Engineer setting up first test batch

**Steps**:
1. ✅ Create new project "E-commerce Product Scraping"
2. ✅ Enter instructions: "Extract product name, price, availability"
3. ✅ Upload CSV with 200 URLs + ground truth columns (gt_product_name, gt_price, gt_availability)
4. ✅ System auto-detects GT columns, shows preview
5. ✅ User confirms, clicks "Create Batch"
6. ✅ Batch created, redirects to batch detail page
7. ⏳ User clicks "Run Test" → Configures: 20 sample jobs, concurrency 5
8. ⏳ Execution starts, shows live progress
9. ⏳ 20 jobs complete in 5 minutes
10. ✅ User views column metrics: product_name 95%, price 75%, availability 60%
11. ✅ User identifies "availability" needs work
12. ✅ User filters jobs: status=error, column=availability
13. 🔄 User opens first failed job, watches screenshot playback
14. 🔄 User sees agent looked at wrong element
15. 🔄 User updates instructions: "Look for green/red stock indicator"
16. 🔄 User saves as v2
17. ⏳ User re-runs test with same 20 jobs
18. ✅ New results: availability now 85%
19. ✅ User views trend chart: sees improvement
20. ✅ User runs full batch (200 jobs)
21. ✅ Final accuracy: 88%
22. ✅ User exports results as Excel
23. ✅ User shares with manager

**Features Used**:
- ✅ Project creation
- ✅ Ground truth auto-detection
- ✅ Batch creation
- ⏳ Test execution
- ✅ Column metrics
- ✅ Filtering
- 🔄 Screenshot playback (to build)
- 🔄 Instruction versioning (to build)
- 🔄 Accuracy trends (to build)
- 🔄 Export (to build)

### 7.2 Workflow 2: Debugging Failed Jobs

**Persona**: Developer investigating why certain jobs fail

**Steps**:
1. ✅ Navigate to batch with 15% error rate
2. 🔄 Apply filter: status=error, hasGroundTruth=true
3. ✅ 30 jobs shown
4. ✅ User notices all failed jobs are from domain "example-shop.com"
5. ✅ User clicks first job → Goes to job detail
6. 🔄 User clicks "View Execution" → Screenshot playback opens
7. 🔄 User scrubs through timeline
8. 🔄 User sees: Agent clicked "Add to Cart" instead of product price
9. ✅ User compares extracted vs expected: price is $0.00, expected $99.99
10. ✅ User realizes: "Add to Cart" button text looks like price
11. 🔄 User goes back to instructions, adds: "Ignore buttons when extracting price"
12. 🔄 User creates v3, tags it "fix-cart-button-issue"
13. 🔄 User selects the 30 failed jobs, clicks "Re-run Selected"
14. ⏳ Re-execution completes
15. ✅ All 30 now pass
16. 🔄 User compares v2 vs v3: +15% on price column for example-shop.com
17. ✅ User bulk updates GT for these jobs (copy from extracted)
18. ✅ User marks investigation as resolved

**Features Used**:
- ✅ Filtering by status and GT
- ✅ Job detail view
- 🔄 Screenshot playback
- ✅ GT comparison
- 🔄 Instruction versioning with tags
- 🔄 Selective re-run (subset of jobs)
- 🔄 Version comparison
- ✅ Bulk GT update

### 7.3 Workflow 3: Batch Operations & Export

**Persona**: Data Analyst preparing weekly accuracy report

**Steps**:
1. ✅ Navigate to project with 5 batches from this week
2. 🔄 View "Analytics Dashboard"
3. 🔄 See overall trend: 72% → 85% over 7 days
4. ✅ Identify top 3 problematic columns
5. 🔄 Apply filter preset "Needs Review" (accuracy < 80%, has GT)
6. ✅ 150 jobs shown across all batches
7. ✅ User selects all 150 jobs
8. ✅ User clicks "Bulk Edit GT"
9. ✅ User selects column "shipping_cost"
10. ✅ User clicks "Copy from Extracted" (since they look correct)
11. ✅ 150 jobs updated
12. 🔄 Metrics recalculate: shipping_cost now 92%
13. 🔄 User goes to Export dialog
14. 🔄 User selects: CSV format, all columns, include GT comparison
15. 🔄 User applies filter: all jobs from this week
16. 🔄 Preview: "750 jobs, 12 columns, ~2.3 MB"
17. 🔄 User clicks Export → Progress shows
18. 🔄 Download ready in 30 seconds
19. 🔄 User downloads CSV
20. ✅ User creates pivot table in Excel
21. ✅ User presents to team

**Features Used**:
- 🔄 Analytics dashboard
- 🔄 Trend visualization
- ✅ Column metrics
- 🔄 Filter presets
- ✅ Multi-select jobs
- ✅ Bulk GT editing
- 🔄 Metrics recalculation
- 🔄 Export with filters
- 🔄 Export preview

### 7.4 Workflow 4: A/B Testing Instructions (Without A/B Tool)

**Persona**: Product Manager comparing two instruction approaches

**Steps**:
1. ✅ User has batch with 100 jobs
2. 🔄 User creates instruction v4: "Be very specific about CSS selectors"
3. 🔄 User runs test with v4 → 78% accuracy
4. 🔄 User creates instruction v5 (branch from v4): "Use AI to intelligently find elements"
5. 🔄 User runs test with v5 → 82% accuracy
6. 🔄 User goes to "Compare Versions"
7. 🔄 User selects v4 vs v5
8. 🔄 See side-by-side: v5 better on 3/4 columns
9. 🔄 User sees instruction diff: v5 added "intelligent element detection"
10. 🔄 User sets v5 as production
11. 🔄 User archives v4 with tag "experiment-css-selectors"

**Features Used**:
- 🔄 Instruction versioning
- 🔄 Branching versions
- 🔄 Test execution with specific version
- 🔄 Version comparison
- 🔄 Set production version
- 🔄 Tagging

---

## Implementation Priority & Timeline

### Phase 1: Complete GT System (1 week) - **In Progress**

- [x] Database schema ✅
- [x] Bulk GT APIs ✅
- [x] Column metrics API ✅
- [x] Bulk editor UI ✅
- [x] Column metrics visualization ✅
- [x] Enhanced diff component ✅
- [ ] Historical trend tracking 🔄 (2-3 days remaining)

**Completion**: 85% → 100%

### Phase 2: Analytics & Export (1.5 weeks)

- [ ] Analytics dashboard (3-4 days)
- [ ] Batch export system (4-5 days)

**Value**: High - enables reporting and stakeholder communication

### Phase 3: Instruction Versioning (1 week)

- [ ] Version CRUD APIs (1 day)
- [ ] Version history UI (1.5 days)
- [ ] Comparison UI (1.5 days)
- [ ] Integration with executions (1 day)

**Value**: High - enables iteration and improvement tracking

### Phase 4: Screenshot Playback (1 week)

- [ ] Playback UI with timeline (2 days)
- [ ] Keyboard shortcuts, fullscreen (1 day)
- [ ] Download functionality (0.5 day)
- [ ] Comparison view (1.5 days)

**Value**: Medium-High - critical for debugging but works without it

### Phase 5: Advanced Filtering (1 week)

- [ ] Backend filtering logic (1 day)
- [ ] Filter panel UI (1.5 days)
- [ ] URL state sync (0.5 day)
- [ ] Saved presets (1 day)
- [ ] Keyboard shortcuts (1 day)

**Value**: Medium - improves UX but not blocking

**Total Implementation Time**: ~5.5 weeks (27-28 days)

---

## Success Metrics

### Feature Adoption
- 80%+ of users use bulk GT editing
- 60%+ of users export results regularly
- 50%+ of users create multiple instruction versions
- 70%+ of users use filtering for debugging

### Performance
- Dashboard loads in < 2 seconds
- Export generates in < 1 minute for 1000 jobs
- Column metrics calculate in < 5 seconds
- Screenshot playback smooth (>30 fps)

### Accuracy Improvement
- Users improve from baseline to 80%+ accuracy within 3 iterations
- Average 10-15% improvement per instruction version
- 90% of failed jobs debugged successfully with playback

### User Satisfaction
- Net Promoter Score > 40
- <5% error rate in production
- >85% task completion rate

---

## Technical Architecture Notes

### Performance Optimizations

1. **Caching Strategy**
   - Cache column metrics for 5 minutes
   - Cache execution results in Redis
   - Use CDN for screenshots
   - Implement pagination (50 jobs per page)

2. **Database Indexes**
   - All foreign keys indexed
   - Composite indexes on (batch_id, status)
   - Full-text index on URLs and extracted data
   - Time-series index for trends

3. **Async Processing**
   - Export generation in background job
   - Metrics calculation triggered async
   - Screenshot upload to S3 in parallel

4. **API Design**
   - GraphQL for complex dashboard queries
   - REST for CRUD operations
   - WebSocket for live execution updates
   - Rate limiting: 100 req/min per user

### Security Considerations

1. **Data Access**
   - All queries scoped to user's projects
   - Row-level security in database
   - API key authentication for external access

2. **File Storage**
   - S3 presigned URLs for screenshot access
   - 24-hour expiry on export download links
   - Virus scanning on CSV uploads

3. **Input Validation**
   - Sanitize all user inputs
   - Validate CSV structure before processing
   - Limit file upload sizes (50MB max)

---

## Future Enhancements (Post-MVP)

1. **Collaboration Features**
   - Team comments on jobs
   - Approval workflows for GT changes
   - Shared filter presets across team

2. **AI-Powered Insights**
   - Auto-detect common failure patterns
   - Suggest instruction improvements
   - Predict accuracy before running

3. **Scheduled Executions**
   - Recurring batch runs (daily, weekly)
   - Email alerts on accuracy drops
   - Automated exports to S3/Google Sheets

4. **Integration Ecosystem**
   - Zapier integration
   - Slack notifications
   - API webhooks for external systems

---

**End of Plan**
