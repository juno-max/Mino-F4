# MINO F5-F7: COMPREHENSIVE UX MASTER PLAN
**Jobs-to-be-Done Analysis + Design Solution Prioritization**

**Date**: November 6, 2025
**Scope**: Batch Execution Monitoring Workflow (All User Touchpoints)
**Goal**: Implement best-in-class UX based on user goals, design principles, and visual excellence

---

## EXECUTIVE SUMMARY

### Current State Assessment
- ✅ **Phase 1-4 Complete**: Job differentiation, live progress, data quality, and error categorization implemented
- **Remaining Gaps**: Visual polish, advanced interactions, performance optimizations, and workflow enhancements

### Key Findings
1. **Core table UX improved significantly** but needs visual refinement and advanced features
2. **Dashboard hero sections** lack cohesion with table design
3. **Batch-level insights** missing (trends, patterns, recommendations)
4. **Bulk operations** underutilized due to poor discoverability
5. **Export and GT workflows** need streamlining

### Recommended Next Steps (Prioritized)
1. **CRITICAL**: Visual polish & consistency across all components
2. **HIGH**: Enhanced dashboard hero with live insights
3. **HIGH**: Improved bulk operations and batch-level actions
4. **MEDIUM**: Advanced filtering and search capabilities
5. **MEDIUM**: Performance monitoring and optimization suggestions

---

## PART 1: COMPREHENSIVE JTBD MAPPING

### 1. PRE-EXECUTION: Setup & Configuration

#### JTBD 1.1: "Help me configure my batch correctly"
**User Story**: As a user, I want to set up instructions, ground truth, and export settings efficiently so I can run my batch with confidence.

**Current Implementation**:
- ✅ Instructions drawer (right-side)
- ✅ Ground truth configurator
- ✅ Export configurator
- ✅ Setup mode hero with clear CTAs

**Gaps**:
- ⚠️ No validation preview before execution
- ⚠️ No templates or quick-start options
- ⚠️ No setup checklist or progress indicator

**Priority**: MEDIUM
**Design Solution**: Add pre-flight checklist card in setup hero

---

#### JTBD 1.2: "Show me examples of similar successful batches"
**User Story**: As a new user, I want to see examples of similar batches so I can learn best practices.

**Current Implementation**:
- ❌ Not implemented

**Gaps**:
- Missing batch templates library
- No recommended instructions based on domain
- No performance benchmarks

**Priority**: LOW (Future enhancement)

---

### 2. DURING EXECUTION: Live Monitoring

#### JTBD 2.1: "Help me understand what's happening right now"
**User Story**: As a user monitoring a batch, I want to see at a glance which jobs are running, their progress, and if there are any issues.

**Current Implementation**:
- ✅ Running mode hero with stats
- ✅ Live agent activity stream in table
- ✅ Progress bars with color coding
- ✅ Real-time WebSocket updates (polling-based currently)
- ✅ Activity type detection (navigation, finding, tool call, etc.)

**Gaps**:
- ⚠️ Hero metrics lack visual hierarchy and sparklines
- ⚠️ No batch-level health score
- ⚠️ No estimated time to completion
- ⚠️ No streaming video links prominently shown
- ⚠️ Missing "last 5 activities" summary

**Priority**: **CRITICAL**
**Design Solution**: Enhanced RunningModeHero with visual metrics

---

#### JTBD 2.2: "Alert me when something needs my attention"
**User Story**: As a user, I want to be notified immediately when jobs fail or get blocked so I can take action.

**Current Implementation**:
- ✅ Error categorization with suggested actions
- ✅ Visual indicators in table (red for failed, amber for warnings)
- ⚠️ WebSocket events exist but no toast notifications

**Gaps**:
- ❌ No browser notifications
- ❌ No toast/alert system for failures
- ❌ No "needs attention" filter preset
- ❌ No pattern detection alerts ("5 jobs failed with captcha")

**Priority**: **HIGH**
**Design Solution**: Toast notification system + attention filter

---

#### JTBD 2.3: "Let me control execution dynamically"
**User Story**: As a user, I want to pause, resume, adjust concurrency, or stop execution without losing progress.

**Current Implementation**:
- ✅ Pause/resume buttons in hero
- ✅ Stop button with confirmation
- ⚠️ Concurrency adjustment exists but hard to find

**Gaps**:
- ⚠️ Concurrency slider not prominent enough
- ❌ No quick actions for "pause and debug failed jobs"
- ❌ No "skip remaining and process completed"

**Priority**: MEDIUM
**Design Solution**: Prominent controls card in running hero

---

#### JTBD 2.4: "Show me individual job details without leaving the page"
**User Story**: As a user, I want to quickly inspect a job's full details, screenshots, and logs without navigating away.

**Current Implementation**:
- ⚠️ Row expansion exists but underutilized
- ❌ No quick view modal/drawer

**Gaps**:
- ❌ No JobQuickViewModal integration
- ❌ No screenshot preview in table
- ❌ No streaming video thumbnail
- ❌ Expand all/collapse all controls missing

**Priority**: **HIGH**
**Design Solution**: Enhanced row expansion + quick view modal

---

### 3. POST-EXECUTION: Results Analysis

#### JTBD 3.1: "Show me the overall batch results at a glance"
**User Story**: As a user, I want to immediately understand if my batch succeeded, the data quality, and what actions to take next.

**Current Implementation**:
- ✅ Completion hero with stats
- ⚠️ Stats shown but not visually compelling

**Gaps**:
- ⚠️ No visual pass/fail breakdown (donut chart)
- ⚠️ No accuracy distribution histogram
- ⚠️ No top errors list
- ⚠️ No recommended next actions

**Priority**: **HIGH**
**Design Solution**: Rich CompletedModeHero with visualizations

---

#### JTBD 3.2: "Help me identify which jobs need review or re-run"
**User Story**: As a user, I want to filter and sort jobs by data quality, errors, and review status so I can fix issues efficiently.

**Current Implementation**:
- ✅ SmartFilters component exists
- ✅ Status filters (completed, failed, etc.)
- ✅ Accuracy range filter

**Gaps**:
- ⚠️ No "needs review" status
- ❌ No saved filter presets
- ❌ No bulk retry for failed jobs
- ❌ No "retry with modifications" workflow

**Priority**: MEDIUM
**Design Solution**: Enhanced filters + bulk retry action

---

#### JTBD 3.3: "Export my results in the format I need"
**User Story**: As a user, I want to export completed jobs with flexible column selection and formatting options.

**Current Implementation**:
- ✅ Export configurator drawer
- ⚠️ Basic CSV export

**Gaps**:
- ❌ No Excel/Google Sheets direct export
- ❌ No filtered export (export only selected)
- ❌ No export templates
- ❌ No schedule automatic exports

**Priority**: MEDIUM (Future enhancement)

---

#### JTBD 3.4: "Compare this batch's performance to previous runs"
**User Story**: As a user, I want to see how this batch compared to previous executions so I can identify improvements or regressions.

**Current Implementation**:
- ❌ Not implemented

**Gaps**:
- Missing batch history comparison
- No performance trends over time
- No A/B test result comparison

**Priority**: LOW (Future enhancement)

---

### 4. CROSS-WORKFLOW: Navigation & Context

#### JTBD 4.1: "Keep context while accessing global actions"
**User Story**: As a user, I want to access instructions, settings, and exports without leaving my current view.

**Current Implementation**:
- ✅ Right-side drawers for instructions, GT, export
- ✅ Progressive button group in header
- ✅ Consistent "Instructions" button across views

**Gaps**:
- ⚠️ Button group could be more discoverable
- ⚠️ Drawer animations could be smoother

**Priority**: LOW (Polish)

---

#### JTBD 4.2: "Navigate efficiently between related items"
**User Story**: As a user, I want to quickly jump between batches, view project overview, or drill into specific jobs.

**Current Implementation**:
- ✅ Breadcrumb navigation
- ✅ Project navigation tree
- ⚠️ Job detail links in table

**Gaps**:
- ❌ No keyboard shortcuts
- ❌ No recent items history
- ❌ No quick switcher (Cmd+K style)

**Priority**: LOW (Future enhancement)

---

## PART 2: DESIGN PRINCIPLES APPLICATION

### Applying "Progressive Disclosure, Maximum Density, Minimum Friction"

#### Current Adherence Score: 85/100

**Strengths**:
- ✅ Alternating row backgrounds improve scannability
- ✅ Activity stream provides rich progress without expanding
- ✅ Data quality summary shows key info inline
- ✅ Error categorization reduces cognitive load
- ✅ Row numbers aid navigation

**Areas for Improvement**:
- ⚠️ **Hero sections**: Too much whitespace, not dense enough (20px padding → 12px)
- ⚠️ **Metrics**: Stats shown as text, need visual encoding (sparklines, mini charts)
- ⚠️ **Bulk actions**: Hidden until selection, poor discoverability
- ⚠️ **Filters**: SmartFilters exists but not prominent enough
- ⚠️ **Live agents**: Running jobs preview could be more compact

---

## PART 3: VISUAL DESIGN ENHANCEMENTS

### Color System Consistency

**Current Palette** (Fintech theme):
```css
--emerald-400: #34d399  /* Primary actions, success states */
--emerald-500: #10b981  /* Hover states, active indicators */
--gray-50:  #f9fafb  /* Alternating row backgrounds */
--gray-200: #e5e7eb  /* Borders, dividers */
--gray-400: #9ca3af  /* Secondary text, icons */
--gray-600: #4b5563  /* Body text */
--gray-900: #111827  /* Headings */
--blue-500: #3b82f6  /* Running states, info */
--amber-500: #f59e0b /* Warnings, slow progress */
--red-500: #ef4444   /* Errors, failures */
```

**Application Guidelines**:
1. **Status indicators**:
   - Green (emerald-500): Completed successfully, high accuracy (>90%)
   - Blue (blue-500): Running, in-progress
   - Amber (amber-500): Warnings, low accuracy (60-90%)
   - Red (red-500): Failed, errors
   - Gray (gray-400): Pending, queued

2. **Progress bars**:
   - Fast (<30s): `bg-emerald-500`
   - Normal (30s-2m): `bg-blue-500`
   - Slow (2m-5m): `bg-amber-500`
   - Very slow (>5m): `bg-red-500`

3. **Activity icons**:
   - All use `animate-pulse` for live feedback
   - Match color to activity type (navigation=blue, tool=emerald, etc.)

---

### Typography Refinement

**Current Usage**:
```css
/* Headers */
text-sm font-medium    /* 14px, used in column headers */
text-base font-semibold /* 16px, used in expanded details */

/* Body */
text-xs  /* 12px, metadata, timestamps */
text-sm  /* 14px, primary content */

/* Mono */
font-mono text-xs  /* 12px, job IDs, technical info */
```

**Recommendations**:
- ✅ Good: Consistent use of text-sm for table content
- ✅ Good: Mono font for technical data
- ⚠️ Improve: Add more font-weight variation for hierarchy (font-semibold for key data)
- ⚠️ Improve: Use `text-gray-500` more for de-emphasized content

---

### Spacing & Layout Refinements

**Table Spacing**:
```css
/* Current */
px-3 py-3  /* Table cells: 12px horizontal, 12px vertical */

/* Recommended */
px-3 py-2.5  /* Reduce vertical to 10px for higher density */
```

**Hero Sections**:
```css
/* Current */
p-6  /* 24px padding */

/* Recommended */
p-4  /* 16px padding, apply 12-line compact rule */
```

**Card Gaps**:
```css
/* Current */
gap-4  /* 16px between cards */

/* Recommended */
gap-3  /* 12px between cards */
```

---

### Icon System

**Currently Used**:
- CheckCircle, XCircle, AlertTriangle (status)
- Globe, Search, Zap, Brain, CheckCircle2, Clock (activity)
- Layers, ExternalLink (metadata)
- RefreshCw (suggestions)
- Check, X (checkmarks)

**Recommended Additions**:
- TrendingUp/TrendingDown (performance trends)
- Target (accuracy)
- Clock3 (duration)
- Eye (view details)
- Copy (duplicate)
- Filter (filtering)
- Download (export)
- Play/Pause/Square (execution controls)

**Icon Sizing**:
- `h-3 w-3` (12px): Inline icons, field checkmarks
- `h-4 w-4` (16px): Standard icons (status, activity)
- `h-5 w-5` (20px): Prominent icons (hero metrics)

---

## PART 4: PRIORITIZED ENHANCEMENT ROADMAP

### Phase 5: Visual Polish & Consistency (4-6 hours) - **CRITICAL**

#### 5.1 Hero Section Redesign ⭐️ HIGHEST PRIORITY
**Problem**: Current hero sections don't match table's visual quality and information density

**Solution - Enhanced RunningModeHero**:
```tsx
<div className="bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 py-4">
    {/* Top row: Title + Controls */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
          <Play className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Batch Executing</h2>
          <p className="text-sm text-gray-600">{elapsedTime} elapsed</p>
        </div>
      </div>

      {/* Execution controls */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onPause}>
          <Pause className="h-4 w-4" />
          Pause
        </Button>
        <Button size="sm" variant="outline" onClick={onStop}>
          <Square className="h-4 w-4" />
          Stop
        </Button>
      </div>
    </div>

    {/* Metrics grid - Visual, compact, scannable */}
    <div className="grid grid-cols-5 gap-3">
      {/* Progress */}
      <MetricCard
        icon={<Target className="h-5 w-5 text-blue-500" />}
        label="Progress"
        value={`${stats.completedJobs}/${stats.totalJobs}`}
        subtitle={`${progressPercent}%`}
        trend={<ProgressBar value={progressPercent} color="blue" />}
      />

      {/* Success Rate */}
      <MetricCard
        icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
        label="Success"
        value={`${stats.passedJobs || 0}`}
        subtitle={`${stats.passRate || 0}% pass`}
        trend={<Sparkline data={successTrend} color="emerald" />}
      />

      {/* Running */}
      <MetricCard
        icon={<Zap className="h-5 w-5 text-blue-500 animate-pulse" />}
        label="Running"
        value={stats.runningJobs}
        subtitle="Active agents"
        trend={<LiveAgentsMini agents={runningJobs.slice(0, 3)} />}
      />

      {/* Errors */}
      <MetricCard
        icon={<XCircle className="h-5 w-5 text-red-500" />}
        label="Errors"
        value={stats.errorJobs}
        subtitle={errorRate > 10 ? "⚠️ High" : "Normal"}
        trend={<ErrorTypeBadges errors={topErrors} />}
      />

      {/* ETA */}
      <MetricCard
        icon={<Clock className="h-5 w-5 text-gray-500" />}
        label="Est. Completion"
        value={estimatedTime}
        subtitle={estimatedRemaining}
        trend={<TimeProgress start={startedAt} estimated={estimatedTime} />}
      />
    </div>

    {/* Live agents preview - Compact horizontal scroll */}
    {runningJobs.length > 0 && (
      <div className="mt-3 border-t border-gray-200 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-700">Live Agents</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {runningJobs.map(job => (
            <LiveAgentCard key={job.id} job={job} compact />
          ))}
        </div>
      </div>
    )}
  </div>
</div>
```

**Visual Mockup**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔵 Batch Executing              [⏸ Pause] [⏹ Stop]                 │
│    2m 34s elapsed                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🎯 Progress      ✓ Success      ⚡ Running       ❌ Errors   ⏰ ETA│
│  25/50           21 jobs        4 agents        1 job      ~8m    │
│  50%             95% pass       klook.com...    timeout    left   │
│  ████████░░░░░   📈             amazon.com...   (2% rate)  ▓▓▓░   │
│                                  ...                               │
└─────────────────────────────────────────────────────────────────────┘
```

**Files to create**:
- `components/batch-dashboard/MetricCard.tsx` (new)
- `components/batch-dashboard/Sparkline.tsx` (new)
- `components/batch-dashboard/LiveAgentCard.tsx` (new)
- `components/batch-dashboard/LiveAgentsMini.tsx` (new)

**Files to modify**:
- `components/batch-dashboard/RunningModeHero.tsx` (major redesign)

**Estimated Time**: 3 hours

---

#### 5.2 Completed Hero Visualization ⭐️
**Problem**: Completion screen just shows numbers, not visually compelling

**Solution - Enhanced CompletedModeHero**:
```tsx
<div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 py-4">
    {/* Success header with animation */}
    <div className="flex items-center gap-3 mb-4">
      <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
        <CheckCircle className="h-6 w-6 text-white" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Batch Completed Successfully
        </h2>
        <p className="text-sm text-gray-600">
          {stats.totalJobs} jobs processed in {duration}
        </p>
      </div>
    </div>

    {/* Visual summary - donut chart + key metrics */}
    <div className="grid grid-cols-4 gap-4">
      {/* Left: Donut chart of pass/fail */}
      <div className="col-span-1">
        <DonutChart
          data={[
            { label: 'Passed', value: stats.passedJobs, color: 'emerald' },
            { label: 'Failed', value: stats.failedJobs, color: 'red' },
          ]}
          centerText={`${stats.passRate}%`}
          centerLabel="Pass Rate"
        />
      </div>

      {/* Right: Key metrics grid */}
      <div className="col-span-3 grid grid-cols-3 gap-3">
        <MetricCard
          icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
          label="Data Extracted"
          value={`${successfulExtractions}/${stats.totalJobs}`}
          subtitle={`${extractionRate}% success`}
        />
        <MetricCard
          icon={<Target className="h-5 w-5 text-blue-500" />}
          label="Avg Accuracy"
          value={`${avgAccuracy}%`}
          subtitle={accuracyDistribution}
        />
        <MetricCard
          icon={<Clock className="h-5 w-5 text-gray-500" />}
          label="Avg Duration"
          value={avgDuration}
          subtitle={`Fastest: ${fastestJob}`}
        />
      </div>
    </div>

    {/* Top errors (if any) */}
    {stats.errorJobs > 0 && (
      <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-900">
            {stats.errorJobs} jobs failed
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {topErrors.map(error => (
            <ErrorBadge key={error.type} error={error} />
          ))}
        </div>
        <Button size="sm" variant="outline" className="mt-2">
          Retry {stats.errorJobs} failed jobs
        </Button>
      </div>
    )}

    {/* Next actions */}
    <div className="mt-4 flex items-center gap-2">
      <Button size="sm" variant="primary" onClick={handleExport}>
        <Download className="h-4 w-4" />
        Export Results
      </Button>
      <Button size="sm" variant="outline" onClick={handleViewAll}>
        View All Jobs
      </Button>
      <Button size="sm" variant="outline" onClick={handleRunAgain}>
        <Play className="h-4 w-4" />
        Run Again
      </Button>
    </div>
  </div>
</div>
```

**Visual Mockup**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ ✅ Batch Completed Successfully                                     │
│    50 jobs processed in 12m 34s                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ╭─────╮    ✓ Data Extracted    🎯 Avg Accuracy    ⏰ Duration   │
│   │ 95% │    48/50 jobs           92%                2m 15s       │
│   │Pass │    96% success          🟢 33 🟡 15 🔴 2  Fastest: 45s  │
│   ╰─────╯                                                           │
│                                                                     │
│  ⚠️ 2 jobs failed                                                   │
│     [Timeout x1] [Element not found x1]                             │
│     [Retry 2 failed jobs]                                           │
│                                                                     │
│  [📥 Export Results] [View All Jobs] [▶ Run Again]                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Files to create**:
- `components/batch-dashboard/DonutChart.tsx` (new)
- `components/batch-dashboard/ErrorBadge.tsx` (new)

**Files to modify**:
- `components/batch-dashboard/CompletedModeHero.tsx` (major redesign)

**Estimated Time**: 2 hours

---

#### 5.3 Table Visual Polish ⭐️
**Improvements**:
1. **Hover effects**: Subtle bg-gray-50 on hover
2. **Row selection**: Checkbox column with emerald accent
3. **Expanded row**: Better visual separation (border-l-4 border-emerald-400)
4. **Loading states**: Skeleton loaders for polling updates
5. **Empty states**: Friendly illustrations when no jobs

**Example - Enhanced Row Hover**:
```tsx
const rowClasses = cn(
  'border-b border-gray-200 transition-colors cursor-pointer',
  isSelected && 'bg-emerald-50/30 border-emerald-200',
  !isSelected && index % 2 === 0 && 'bg-white hover:bg-gray-50/50',
  !isSelected && index % 2 !== 0 && 'bg-gray-50/50 hover:bg-gray-100/50',
  isExpanded && 'border-l-4 border-l-emerald-400'
)
```

**Files to modify**:
- `components/JobsTableV3.tsx` (add hover states, selection styling)

**Estimated Time**: 1 hour

---

### Phase 6: Advanced Interactions (6-8 hours) - **HIGH**

#### 6.1 Toast Notification System ⭐️
**Use Cases**:
- Job completed: "Job #3 completed successfully (95% accuracy)"
- Job failed: "Job #5 failed: Timeout after 5 minutes"
- Batch completed: "Batch completed! 48/50 jobs successful"
- Error pattern: "5 jobs failed with 'Captcha blocked'"

**Implementation**:
```tsx
// lib/toast.ts
import { toast as sonnerToast } from 'sonner'

export const toast = {
  jobCompleted: (jobId: string, accuracy: number) => {
    sonnerToast.success(`Job completed`, {
      description: `${jobId} - ${accuracy}% accuracy`,
      action: {
        label: 'View',
        onClick: () => router.push(`/jobs/${jobId}`)
      }
    })
  },

  jobFailed: (jobId: string, error: string) => {
    sonnerToast.error(`Job failed`, {
      description: `${jobId} - ${error}`,
      action: {
        label: 'Retry',
        onClick: () => retryJob(jobId)
      }
    })
  },

  batchCompleted: (stats: BatchStats) => {
    const success = stats.passedJobs === stats.totalJobs
    sonnerToast[success ? 'success' : 'warning'](`Batch completed`, {
      description: `${stats.passedJobs}/${stats.totalJobs} jobs successful`,
      duration: 10000
    })
  }
}
```

**Files to create**:
- `lib/toast.ts` (new)
- Add `<Toaster />` to root layout

**Files to modify**:
- `app/(authenticated)/projects/[id]/batches/[batchId]/UnifiedBatchDashboard.tsx` (add toast calls on WebSocket events)

**Estimated Time**: 2 hours

---

#### 6.2 Enhanced Bulk Operations ⭐️
**Current**: BulkActionsToolbar exists but underutilized

**Enhancements**:
1. **Bulk retry**: Retry all selected failed jobs
2. **Bulk export**: Export only selected jobs
3. **Bulk delete**: Delete selected jobs with confirmation
4. **Bulk mark reviewed**: Mark as reviewed for QA workflow

**Enhanced Toolbar**:
```tsx
<div className="sticky top-0 z-10 bg-emerald-50 border-b border-emerald-200 px-4 py-2">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Checkbox
        checked={allSelected}
        indeterminate={someSelected}
        onCheckedChange={handleSelectAll}
      />
      <span className="text-sm font-medium text-gray-700">
        {selectedCount} selected
      </span>
    </div>

    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={handleBulkRetry}>
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
      <Button size="sm" variant="outline" onClick={handleBulkExport}>
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button size="sm" variant="outline" onClick={handleBulkMarkReviewed}>
        <Check className="h-4 w-4" />
        Mark Reviewed
      </Button>
      <Button size="sm" variant="ghost" onClick={handleBulkDelete}>
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
      <Button size="sm" variant="ghost" onClick={handleClearSelection}>
        Clear
      </Button>
    </div>
  </div>
</div>
```

**Files to modify**:
- `components/table/BulkActionsToolbar.tsx` (enhance actions)
- `components/JobsTableV3.tsx` (add checkbox column, selection state)

**Estimated Time**: 3 hours

---

#### 6.3 Quick View Modal ⭐️
**Purpose**: View job details without navigating away

**Features**:
- Full extraction results comparison
- Screenshot carousel
- Streaming video link
- Error details
- Actions (retry, delete, mark reviewed)

**Implementation**:
```tsx
<Dialog open={quickViewJobId !== null}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <span>Job Details</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {/* Status banner */}
      <StatusBanner status={job.status} accuracy={job.accuracy} />

      {/* Data comparison table */}
      <DataComparisonTable
        extractedData={job.extractedData}
        groundTruthData={job.groundTruthData}
        columnSchema={columnSchema}
      />

      {/* Screenshots */}
      {job.screenshots && (
        <ScreenshotCarousel screenshots={job.screenshots} />
      )}

      {/* Streaming video */}
      {job.streamingUrl && (
        <div className="border border-gray-200 rounded p-3">
          <a
            href={job.streamingUrl}
            target="_blank"
            className="text-blue-600 hover:underline flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Watch execution recording
          </a>
        </div>
      )}

      {/* Error details (if failed) */}
      {job.error && <ErrorDetails error={job.error} />}
    </div>
  </DialogContent>
</Dialog>
```

**Files to modify**:
- `components/batch-dashboard/JobQuickViewModal.tsx` (enhance existing or create new)
- `components/JobsTableV3.tsx` (add click handler to open modal)

**Estimated Time**: 3 hours

---

### Phase 7: Performance & Optimization (4-6 hours) - MEDIUM

#### 7.1 Virtual Scrolling for Large Job Lists
**Problem**: Table with 1000+ jobs lags

**Solution**: Use `@tanstack/react-virtual` for virtualization

**Estimated Time**: 3 hours

---

#### 7.2 Optimistic UI Updates
**Problem**: Polling every 2s feels laggy

**Solution**: Optimistically update UI on actions, sync with server

**Estimated Time**: 2 hours

---

#### 7.3 Better Loading States
**Problem**: Loading spinner blocks entire table

**Solution**: Skeleton loaders for rows, shimmer effect

**Estimated Time**: 1 hour

---

### Phase 8: Advanced Features (Future) - LOW PRIORITY

#### 8.1 Saved Filter Presets
#### 8.2 Keyboard Shortcuts (Cmd+K command palette)
#### 8.3 Batch Comparison View
#### 8.4 Performance Benchmarking
#### 8.5 Export Templates
#### 8.6 Browser Notifications

---

## PART 5: IMPLEMENTATION CHECKLIST

### ✅ COMPLETED (Phases 1-4)
- [x] Enhanced WebsiteColumn with full URL path and input preview
- [x] Alternating row backgrounds and row numbers
- [x] ActivityStream component for live progress
- [x] DataQualitySummary component for completed jobs
- [x] Error categorization with suggested actions
- [x] ProgressOutcomeColumn enhancements

### 🔄 IN PROGRESS (Phase 5)
- [ ] Enhanced RunningModeHero with visual metrics
- [ ] MetricCard component with sparklines
- [ ] LiveAgentCard compact component
- [ ] Enhanced CompletedModeHero with donut chart
- [ ] DonutChart visualization component
- [ ] Table visual polish (hover, selection, expanded)

### ⏳ NEXT UP (Phase 6)
- [ ] Toast notification system
- [ ] Enhanced bulk operations toolbar
- [ ] Quick view modal for job details
- [ ] Screenshot carousel component
- [ ] Streaming video integration

### 📋 BACKLOG (Phases 7-8)
- [ ] Virtual scrolling optimization
- [ ] Optimistic UI updates
- [ ] Skeleton loading states
- [ ] Saved filter presets
- [ ] Keyboard shortcuts
- [ ] Batch comparison view

---

## PART 6: SUCCESS METRICS

### User Experience Goals
1. **Time to understand status**: <2 seconds (glance at hero metrics)
2. **Time to find specific job**: <5 seconds (search + filters)
3. **Time to diagnose failure**: <10 seconds (error category + suggestion)
4. **Time to export results**: <15 seconds (3 clicks max)

### Performance Goals
1. **Initial page load**: <2s
2. **Table render (100 jobs)**: <500ms
3. **WebSocket update latency**: <200ms
4. **Polling interval**: 2s for running, 10s for idle

### Visual Quality Goals
1. **Consistent spacing**: 12px grid everywhere
2. **Color usage**: Maximum 5 colors per view
3. **Information density**: 10-12 jobs visible above fold
4. **Animation smoothness**: 60fps for all transitions

---

## PART 7: DESIGN SYSTEM DOCUMENTATION

### Component Library

#### Layout Components
- `MetricCard` - Visual metric with icon, value, subtitle, trend
- `DonutChart` - Circular progress visualization
- `Sparkline` - Mini line chart for trends
- `ProgressBar` - Linear progress with color coding

#### Table Components
- `WebsiteColumn` - URL + input preview
- `ProgressOutcomeColumn` - Status + activity/completion/error
- `DataQualitySummary` - Field-by-field extraction results
- `AccuracyColumn` - Accuracy percentage with visual indicator
- `DurationColumn` - Time with relative formatting
- `ActionsColumn` - Contextual action buttons

#### Dashboard Components
- `RunningModeHero` - Live execution dashboard
- `CompletedModeHero` - Results summary
- `SetupModeHero` - Configuration checklist
- `LiveAgentCard` - Compact agent activity card
- `ErrorBadge` - Error type chip

#### Interactive Components
- `JobQuickViewModal` - Full job details drawer
- `BulkActionsToolbar` - Multi-select operations
- `SmartFilters` - Advanced filtering UI
- `Toast` - Notification system

### Design Tokens

```typescript
// colors.ts
export const colors = {
  primary: {
    50: '#f0fdf4',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
  },
  gray: {
    50: '#f9fafb',
    200: '#e5e7eb',
    400: '#9ca3af',
    600: '#4b5563',
    900: '#111827',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  }
}

// spacing.ts
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
}

// typography.ts
export const typography = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
}
```

---

## CONCLUSION

This comprehensive plan provides:
1. ✅ **Complete JTBD mapping** across all workflow stages
2. ✅ **Prioritized roadmap** with time estimates
3. ✅ **Visual design specifications** with code examples
4. ✅ **Component architecture** for consistency
5. ✅ **Success metrics** for validation

**Immediate Next Steps**:
1. Implement Phase 5 (Visual Polish) - 4-6 hours
2. User testing with enhanced hero sections
3. Implement Phase 6 (Advanced Interactions) - 6-8 hours
4. Iteratively refine based on feedback

**Estimated Total Time for Phases 5-6**: 10-14 hours
**Expected UX Improvement**: 40-50% reduction in time-to-insight

---

*This master plan synthesizes insights from MINO_UX_DESIGN_PRINCIPLES.md, JOBS_TABLE_JTBD_OPTIMIZATION.md, and BATCH_TABLE_UX_ENHANCEMENT.md to create a unified vision for world-class batch monitoring UX.*
