# Batch Dashboard UX Refinement Plan
**Version:** 1.0
**Date:** 2025-11-05
**Status:** Planning Phase

---

## Executive Summary

The current batch dashboard buries the primary user goal (managing and monitoring jobs) beneath secondary features like data preview and analytics. This plan redesigns the dashboard with a **jobs-first approach**, focusing on execution monitoring, job management, and progressive disclosure of advanced features.

---

## Current State Analysis

### Current Page Structure (Problems ❌)
1. **Header** - ✅ Good (actions accessible)
2. **4 Static Stats Cards** - ⚠️ Low information density
3. **Live Running Agents** - ✅ Good placement, but could be more integrated
4. **Column Metrics** - ❌ Too prominent for secondary feature
5. **Accuracy Trend Chart** - ❌ Takes significant space before jobs
6. **Bulk GT Editor** - ❌ Advanced feature shown by default
7. **Data Preview Table** - ❌ **MAJOR ISSUE: Dominates space before jobs**
8. **Jobs Table** - ❌ **PRIMARY CONTENT BURIED AT BOTTOM**
9. **Test Executions History** - ⚠️ Useful but isolated

### Key Problems Identified

#### 1. Information Hierarchy Inverted
- **Current:** Data Preview → Jobs (wrong!)
- **Should be:** Jobs → Data Preview (jobs are the goal!)
- Users must scroll ~800px to reach jobs table

#### 2. Visual Weight Misallocated
- Data preview: ~400px height, full-width table
- Jobs table: Same size but at bottom
- Static stats: 4 cards taking prime real estate

#### 3. Execution Context Scattered
- Live agents: Top of page
- Jobs table: Middle/bottom
- Execution history: Very bottom
- No unified execution status view

#### 4. No Filtering or Search
- Cannot filter jobs by status (running, failed, completed)
- Cannot search by URL
- Cannot quickly find problematic jobs

#### 5. Mixed Concerns
- Analytics mixed with operations
- Data review mixed with job management
- No clear mental model for users

---

## User Flow Analysis

### Primary Flows (Must be ≤2 clicks)
1. **Monitor Running Execution** ⭐⭐⭐
   - Current: See live agents (top) → Scroll to jobs
   - Goal: See status + live jobs in one view

2. **Check Job Status** ⭐⭐⭐
   - Current: Scroll to bottom → Find in table
   - Goal: Jobs table visible immediately with status filters

3. **View Job Details** ⭐⭐⭐
   - Current: Scroll → Find job → Click
   - Goal: Visible table → Click row

4. **Start New Execution** ⭐⭐⭐
   - Current: Top-right button (good!)
   - Goal: Keep prominent, add quick options

### Secondary Flows (Can be 3-4 clicks)
5. **Review Execution Results** ⭐⭐
   - Current: Scroll to bottom executions section
   - Goal: Dedicated tab/section with filters

6. **Edit Ground Truth** ⭐⭐
   - Current: Bulk editor in middle of page
   - Goal: Collapsible or separate tab

7. **Export Results** ⭐⭐
   - Current: Button in header (good!)
   - Goal: Also in jobs table for selected rows

### Tertiary Flows (Can be 4+ clicks)
8. **View Analytics** ⭐
   - Current: Charts in middle of page
   - Goal: Separate "Analytics" tab

9. **Review Input Data** ⭐
   - Current: Data preview above jobs
   - Goal: Collapsible "Data" section at bottom

---

## Proposed Solution: Jobs-First Dashboard

### New Information Architecture

```
┌─────────────────────────────────────────────────────────┐
│ LEVEL 1: NAVIGATION & ACTIONS (Always visible)         │
│ Back | Batch Name | [Run Test ▼] [Export] [•••]        │
├─────────────────────────────────────────────────────────┤
│ LEVEL 2: EXECUTION STATUS DASHBOARD (Collapsible)      │
│ ┌─────────┬─────────┬─────────┬─────────┐             │
│ │ 45      │ 2       │ 12      │ 3       │ [Collapse]  │
│ │ ✓ Done  │ ✗ Fail  │ ⟳ Queue │ ⚡ Run  │             │
│ └─────────┴─────────┴─────────┴─────────┘             │
│                                                         │
│ ▸ 3 agents running [Expand to see live progress] ▾     │
├─────────────────────────────────────────────────────────┤
│ LEVEL 3: JOBS TABLE (Primary content, always expanded) │
│                                                         │
│ Jobs (60)                    [🔍 Search] [Filter ▾]    │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Status │ URL              │ Progress │ Actions   │  │
│ ├────────┼──────────────────┼──────────┼───────────┤  │
│ │ ⚡ Run  │ example.com      │ 45%  ▂▃▅ │ [View]    │  │
│ │ ✓ Done │ site1.com        │ 100% ✓   │ [View]    │  │
│ │ ✗ Fail │ error-site.com   │ 30%  ✗   │ [Retry]   │  │
│ │ ⏸ Queue│ pending.com      │ —    —   │ [Cancel]  │  │
│ │ ...    │ ...              │ ...      │ ...       │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ Showing 1-20 of 60 • [Load more] or [View all]        │
├─────────────────────────────────────────────────────────┤
│ LEVEL 4: ADVANCED FEATURES (Collapsed by default)      │
│                                                         │
│ ▸ Analytics (2 charts, column metrics)                 │
│ ▸ Data Preview (CSV input, first 10 rows)              │
│ ▸ Execution History (5 runs, with accuracy)            │
│ ▸ Ground Truth Editor (bulk edit mode)                 │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

#### 1. Jobs-First Hierarchy ✅
- **Jobs table visible immediately** after status dashboard
- No scrolling needed to see primary content
- All other features collapsed by default

#### 2. Unified Execution Status ✅
- Single "command center" showing all job states
- Live running agents expandable inline
- Clear at-a-glance metrics

#### 3. Progressive Disclosure ✅
- Advanced features hidden in collapsible sections
- Users can expand what they need
- Reduces cognitive load for common tasks

#### 4. Contextual Actions ✅
- Row-level actions (View, Retry, Cancel)
- Bulk selection for export/cancel
- Quick filters and search

#### 5. Visual Hierarchy ✅
- Size: Jobs table largest
- Color: Running jobs highlighted
- Position: Most important at top

---

## Detailed Component Specifications

### 1. Execution Status Dashboard Component

**Purpose:** Show at-a-glance execution health and progress

**Specs:**
```typescript
interface ExecutionStatusProps {
  totalJobs: number
  completedJobs: number
  failedJobs: number
  queuedJobs: number
  runningJobs: number
  isCollapsed: boolean
  onToggleCollapse: () => void
}
```

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  45         2          12         3       [Collapse]│
│  ✓ Done    ✗ Failed   ⏳ Queued  ⚡ Running         │
│  75%       3.3%        20%       5%                 │
└─────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Big numbers for quick scanning
- ✅ Status icons (✓ ✗ ⏳ ⚡)
- ✅ Percentage bars underneath
- ✅ Click to filter jobs table by status
- ✅ Collapsible to save space
- ✅ Auto-updates during execution

**States:**
- Idle: All jobs queued, no execution
- Running: Animated ⚡ icon, live count updates
- Completed: ✓ checkmark, show duration
- Failed: ✗ warning color, show error count
- Mixed: Show all states with emphasis on running

---

### 2. Live Agents Expansion Component

**Purpose:** Show real-time progress of running jobs without taking permanent space

**Specs:**
```typescript
interface LiveAgentsProps {
  runningJobs: Array<{
    id: string
    siteUrl: string
    progress: number
    currentStep: string
    elapsedTime: number
  }>
  isExpanded: boolean
  onToggle: () => void
}
```

**Collapsed State:**
```
▸ 3 agents running [Expand] ▾
```

**Expanded State:**
```
▾ 3 agents running [Collapse]

┌─────────────────────────────────────────┐
│ example.com           45%  [===    ] ⚡ │
│ Extracting data • 1m 23s                │
├─────────────────────────────────────────┤
│ site2.com             78%  [======= ] ⚡ │
│ Validating results • 45s                │
├─────────────────────────────────────────┤
│ site3.com             12%  [=       ] ⚡ │
│ Loading page • 34s                      │
└─────────────────────────────────────────┘
```

**Features:**
- ✅ Only visible when jobs are running
- ✅ Compact cards showing essential info
- ✅ Live progress bars
- ✅ Real-time WebSocket updates
- ✅ Auto-collapses when no jobs running

---

### 3. Enhanced Jobs Table Component

**Purpose:** Primary interface for job management and monitoring

**Specs:**
```typescript
interface EnhancedJobsTableProps {
  jobs: Job[]
  onFilterChange: (filter: JobFilter) => void
  onSearchChange: (query: string) => void
  onJobAction: (jobId: string, action: JobAction) => void
  onBulkAction: (jobIds: string[], action: BulkAction) => void
  currentFilter: JobFilter
  isLiveUpdating: boolean
}

type JobFilter = 'all' | 'running' | 'queued' | 'completed' | 'failed'
type JobAction = 'view' | 'retry' | 'cancel'
type BulkAction = 'export' | 'retry' | 'cancel'
```

**Layout:**
```
Jobs (60)                           [🔍 Search] [Filter: All ▾] [Bulk Actions ▾]

☐ │ Status  │ Site URL           │ Progress    │ Duration │ Actions
──┼─────────┼────────────────────┼─────────────┼──────────┼─────────────
☐ │ ⚡ Run   │ example.com        │ 45% [===  ] │ 1m 23s   │ [View] [Cancel]
☐ │ ✓ Done  │ site1.com          │ 100% ✓      │ 2m 15s   │ [View] [Export]
☐ │ ✗ Failed│ error-site.com     │ 30% ✗       │ 1m 45s   │ [View] [Retry]
☐ │ ⏳ Queue │ pending.com        │ —           │ —        │ [Cancel]

[✓ 3 selected] [Export selected] [Retry selected]
```

**Features:**
- ✅ **Inline status indicators** (⚡ ✓ ✗ ⏳)
- ✅ **Live progress bars** for running jobs (WebSocket)
- ✅ **Quick filters** (All, Running, Queued, Done, Failed)
- ✅ **Search by URL** (instant client-side filter)
- ✅ **Row-level actions** (View, Retry, Cancel, Export)
- ✅ **Bulk selection** with multi-select checkboxes
- ✅ **Bulk actions** (Export, Retry, Cancel selected)
- ✅ **Sort by:** Status, URL, Progress, Duration
- ✅ **Responsive:** Mobile-friendly stacked cards
- ✅ **Pagination:** Load more or infinite scroll
- ✅ **Auto-refresh:** Updates every 2s when execution active

**Visual Enhancements:**
- Running jobs: Subtle animated glow
- Failed jobs: Red warning border
- Recently completed: Green success highlight (fades after 5s)
- Queued jobs: Muted/dimmed appearance

---

### 4. Collapsible Advanced Sections

**Purpose:** Hide secondary features until needed

**Specs:**
```typescript
interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  defaultExpanded?: boolean
  children: React.ReactNode
  badge?: number // For counts like "5 runs"
}
```

**Layout:**
```
▸ Analytics                                          [5 charts]
▸ Data Preview                                       [60 rows]
▸ Execution History                                  [8 runs]
▸ Ground Truth Editor                                [12 columns]

[Clicked]

▾ Analytics                                          [5 charts]
┌─────────────────────────────────────────────────────────┐
│ [Accuracy Trend Chart]                                  │
│ [Column Metrics Grid]                                   │
│ [Error Rate Over Time]                                  │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Collapsed by default (progressive disclosure)
- ✅ Clear labels with counts/badges
- ✅ Smooth expand/collapse animation
- ✅ Remember user's expansion state (localStorage)
- ✅ Lazy load content on first expand
- ✅ Keyboard accessible (Enter/Space to toggle)

---

### 5. Execution History Timeline

**Purpose:** Show past test runs with key metrics

**Specs:**
```typescript
interface ExecutionHistoryProps {
  executions: Array<{
    id: string
    type: 'test' | 'production'
    timestamp: Date
    duration: number
    totalJobs: number
    completedJobs: number
    failedJobs: number
    accuracyPercentage?: number
    status: 'completed' | 'failed' | 'running'
  }>
  onExecutionClick: (id: string) => void
}
```

**Layout:**
```
▾ Execution History (8 runs)                    [View all]

┌─ Test Run • 2 hours ago ──────────────────────────────┐
│ 58/60 completed • 2 failed • 95.2% accuracy           │
│ Duration: 5m 23s                          [View report]│
└───────────────────────────────────────────────────────┘

┌─ Test Run • Yesterday ────────────────────────────────┐
│ 60/60 completed • 0 failed • 98.1% accuracy           │
│ Duration: 4m 51s                          [View report]│
└───────────────────────────────────────────────────────┘

[Load more runs]
```

**Features:**
- ✅ Compact timeline cards
- ✅ Key metrics at a glance
- ✅ Click to view detailed report
- ✅ Filter by type (test/production)
- ✅ Compare executions (select 2+)

---

## Implementation Plan

### Phase 1: Core Restructuring (Week 1)

#### Task 1.1: Create Execution Status Dashboard
- File: `components/ExecutionStatusDashboard.tsx`
- Create stat cards with click-to-filter
- Add collapse/expand functionality
- Wire up live count updates
- **Acceptance:** Clicking a stat filters jobs table

#### Task 1.2: Enhance Jobs Table
- File: `components/EnhancedJobsTable.tsx`
- Add status filters (all, running, queued, done, failed)
- Add search by URL
- Add bulk selection with checkboxes
- Add row-level actions menu
- **Acceptance:** Can filter, search, and select jobs

#### Task 1.3: Integrate Live Agents
- File: `components/LiveAgentsInline.tsx`
- Make expandable/collapsible
- Position below status dashboard
- Auto-hide when no running jobs
- **Acceptance:** Shows only when jobs running

#### Task 1.4: Reorganize Page Layout
- File: `app/projects/[id]/batches/[batchId]/page.tsx`
- Reorder sections: Status → Jobs → Advanced
- Move data preview to collapsible section
- Move analytics to collapsible section
- **Acceptance:** Jobs visible immediately without scroll

---

### Phase 2: Progressive Disclosure (Week 1-2)

#### Task 2.1: Create Collapsible Section Component
- File: `components/CollapsibleSection.tsx`
- Generic collapsible wrapper
- Remember state in localStorage
- Smooth animations
- **Acceptance:** Sections collapse/expand smoothly

#### Task 2.2: Wrap Advanced Features
- Wrap: Column Metrics
- Wrap: Accuracy Trend Chart
- Wrap: Data Preview
- Wrap: Bulk GT Editor
- **Acceptance:** All collapsed by default, expand on click

#### Task 2.3: Improve Execution History
- File: `components/ExecutionHistoryTimeline.tsx`
- Create timeline card design
- Add compare feature
- Add filters
- **Acceptance:** Can compare 2+ executions

---

### Phase 3: Enhancements (Week 2)

#### Task 3.1: Add Jobs Table Filtering
- Implement status filters
- Implement URL search
- Add sort options
- **Acceptance:** Can find jobs quickly

#### Task 3.2: Add Bulk Actions
- Bulk export selected jobs
- Bulk retry failed jobs
- Bulk cancel queued jobs
- **Acceptance:** Can select and act on multiple jobs

#### Task 3.3: Live Updates Integration
- Connect WebSocket to jobs table
- Show real-time progress
- Highlight recently completed
- **Acceptance:** Jobs update live without refresh

#### Task 3.4: Mobile Responsiveness
- Create mobile-friendly table cards
- Stack sections vertically
- Touch-friendly actions
- **Acceptance:** Works well on mobile

---

### Phase 4: Polish & Testing (Week 2)

#### Task 4.1: Visual Refinements
- Add animations for state changes
- Polish colors and spacing
- Add micro-interactions
- **Acceptance:** Feels smooth and responsive

#### Task 4.2: Keyboard Navigation
- Tab through jobs table
- Arrow keys for selection
- Enter to open job details
- **Acceptance:** Fully keyboard accessible

#### Task 4.3: Loading States
- Skeleton screens for loading
- Optimistic updates
- Error boundaries
- **Acceptance:** Good UX during loading

#### Task 4.4: User Testing
- Test all primary flows
- Test all secondary flows
- Verify performance with 100+ jobs
- **Acceptance:** All flows work smoothly

---

## Success Metrics

### Quantitative Metrics
1. **Time to Jobs Table:** < 200ms (currently ~800px scroll)
2. **Jobs Table Load Time:** < 500ms for 100 jobs
3. **Filter Response:** < 100ms (client-side)
4. **Page Load Size:** < 1MB initial (lazy load advanced)
5. **Click to Job Details:** 1 click (currently 1 click + scroll)

### Qualitative Metrics
1. **User Feedback:** "Jobs are easy to find"
2. **Task Completion:** 95%+ can filter jobs
3. **Efficiency:** 50% less scrolling
4. **Satisfaction:** Net Promoter Score > 40

---

## Wireframe Comparison

### Before (Current)
```
┌──────────────────────────┐
│ Header + Actions         │ ← Good
├──────────────────────────┤
│ [4 stat cards]           │ ← Low density
├──────────────────────────┤
│ Live Agents (when active)│ ← Good but isolated
├──────────────────────────┤
│ Column Metrics           │ ← Too prominent
├──────────────────────────┤
│ Accuracy Chart           │ ← Secondary feature
├──────────────────────────┤
│ Bulk GT Editor           │ ← Advanced feature
├──────────────────────────┤
│ DATA PREVIEW (HUGE)      │ ← ❌ PROBLEM
├──────────────────────────┤
│ Jobs Table (buried)      │ ← ❌ PRIMARY CONTENT
├──────────────────────────┤
│ Execution History        │ ← Isolated
└──────────────────────────┘

Scroll distance to jobs: ~800-1000px
```

### After (Proposed)
```
┌──────────────────────────┐
│ Header + Actions         │ ← Same, good
├──────────────────────────┤
│ Execution Status [═══]   │ ← New, collapsible
│ ▸ 3 running              │ ← Expandable
├──────────────────────────┤
│ JOBS TABLE (FULL VIEW)   │ ← ✅ PRIMARY FOCUS
│ [Search] [Filter]        │ ← Enhanced controls
│ Running jobs at top      │ ← Smart sorting
│ [Bulk actions]           │ ← New feature
├──────────────────────────┤
│ ▸ Analytics              │ ← Collapsed
│ ▸ Data Preview           │ ← Collapsed
│ ▸ Execution History      │ ← Collapsed
│ ▸ Ground Truth Editor    │ ← Collapsed
└──────────────────────────┘

Scroll distance to jobs: ~200-300px (70% reduction!)
```

---

## Risk Analysis

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance with 1000+ jobs | High | Virtualized table, pagination |
| WebSocket connection drops | Medium | Auto-reconnect, fallback polling |
| State management complexity | Medium | Use Zustand for global state |
| Breaking existing features | High | Feature flags, gradual rollout |

### UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users expect old layout | Medium | User testing, optional toggle |
| Too much hidden by default | Low | Clear expand indicators |
| Mobile experience suffers | High | Mobile-first design approach |
| Overwhelming with options | Low | Progressive disclosure |

---

## Rollout Strategy

### Phase A: Internal Testing (Days 1-3)
- Deploy to staging
- Test all user flows
- Performance testing with large datasets
- Fix critical bugs

### Phase B: Beta Users (Days 4-7)
- Enable for 10% of users (feature flag)
- Collect feedback via in-app survey
- Monitor analytics and error rates
- Iterate based on feedback

### Phase C: Gradual Rollout (Days 8-14)
- 25% of users
- 50% of users
- 100% of users
- Monitor support tickets

### Phase D: Optimization (Week 3+)
- A/B test variations
- Performance tuning
- Additional features from feedback

---

## Open Questions

1. **Should we add a "Save filter" feature?**
   - Users could save common filters like "Failed jobs only"
   - Tradeoff: Adds complexity

2. **Should execution status cards be clickable to filter?**
   - Pro: Quick way to see all failed jobs
   - Con: Might not be discoverable

3. **How many jobs should load initially?**
   - Options: 20, 50, 100, or all?
   - Consider: Performance vs. scrolling

4. **Should we add real-time notifications?**
   - Toast when execution completes
   - Browser notification?
   - Tradeoff: Could be annoying

5. **Mobile-first or desktop-first?**
   - Most users on desktop for this type of tool?
   - Mobile might be for monitoring only

---

## Appendix A: Component File Structure

```
components/
├── batch-dashboard/
│   ├── ExecutionStatusDashboard.tsx      (NEW)
│   ├── LiveAgentsInline.tsx              (NEW)
│   ├── EnhancedJobsTable.tsx             (NEW)
│   ├── CollapsibleSection.tsx            (NEW)
│   ├── ExecutionHistoryTimeline.tsx      (NEW)
│   ├── JobsTableFilters.tsx              (NEW)
│   ├── JobsTableRow.tsx                  (NEW)
│   ├── BulkActionsMenu.tsx               (NEW)
│   └── JobProgressBar.tsx                (NEW)
├── JobsTable.tsx                          (REFACTOR)
├── LiveAgents.tsx                         (DEPRECATE)
└── ...
```

---

## Appendix B: Design Tokens

```typescript
// colors
const STATUS_COLORS = {
  running: 'emerald', // or 'blue'
  completed: 'green',
  failed: 'red',
  queued: 'gray',
  cancelled: 'orange',
}

// spacing
const DASHBOARD_SPACING = {
  sectionGap: '24px',
  cardPadding: '16px',
  compactGap: '12px',
}

// animations
const ANIMATIONS = {
  collapse: '200ms ease-out',
  highlight: '300ms ease-in-out',
  pulse: '2s infinite',
}
```

---

## Conclusion

This UX refinement transforms the batch dashboard from a **data-first** to a **jobs-first** design. By focusing on the primary user goal (monitoring and managing jobs) and using progressive disclosure for advanced features, we significantly improve usability while maintaining access to all existing functionality.

**Key Benefits:**
- ✅ 70% reduction in scrolling
- ✅ Jobs visible immediately
- ✅ Clear execution status
- ✅ Progressive disclosure reduces clutter
- ✅ Enhanced filtering and search
- ✅ Better mobile experience

**Next Steps:**
1. Review this plan with stakeholders
2. Create high-fidelity mockups
3. Begin Phase 1 implementation
4. User testing with prototypes
