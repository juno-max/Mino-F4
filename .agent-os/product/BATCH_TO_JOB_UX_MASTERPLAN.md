# Batch-to-Job UX Masterplan
**Date:** 2025-11-05
**Goal:** Transform MINO from data-entry-focused to **results-focused** platform
**Scope:** Batch Dashboard → Job Detail complete UX overhaul

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### Issue #1: Empty Batch Table (Screenshot 1)
**Current State:**
- Table shows only "Error" status and empty cells (all dashes)
- No extracted data visible
- No insight into what failed
- User must click each row to see what happened

**Impact:**
- ❌ Can't quickly assess batch health
- ❌ Can't identify patterns in failures
- ❌ Can't see results without 50+ clicks
- ❌ Wastes time drilling into each job

---

### Issue #2: Wrong Focus in Job Detail (Screenshot 2)
**Current State:**
- Job shows "Completed" but actually blocked by CAPTCHA
- Input Data section takes 60% of screen space
- Extraction Results buried at bottom
- Generic status doesn't explain what happened

**Impact:**
- ❌ User thinks job succeeded when it failed
- ❌ Focuses on input instead of output
- ❌ Have to scroll to see results
- ❌ No granular error information

---

### Issue #3: Multiple Layers to Results
**Current State:**
- Projects → Batch → Jobs Table → Job Detail → Scroll to Results
- 3-4 clicks + scroll to see a single result

**Impact:**
- ❌ High friction to see outcomes
- ❌ Can't quickly scan results
- ❌ Time-consuming to review batches

---

## 🎯 JOBS TO BE DONE (JTBD)

### JTBD at Batch Level

| # | Job | Current Pain | Desired Outcome |
|---|-----|--------------|-----------------|
| 1 | **Quickly assess batch health** | Must click every job to see status | See success rate, error types at a glance |
| 2 | **See extracted data inline** | Empty table, no data visible | Preview extracted data in table cells |
| 3 | **Identify failure patterns** | Generic "Error", no grouping | "15 jobs failed: CAPTCHA (12), Timeout (3)" |
| 4 | **Compare to ground truth** | Can't see GT vs extracted side-by-side | Inline diff showing matches/mismatches |
| 5 | **Take bulk actions** | No batch operations | "Retry all CAPTCHA failures" |
| 6 | **Track live progress** | Polling, unclear status | Real-time progress with % complete |
| 7 | **Spot anomalies** | Manual review of each job | Visual indicators for outliers |
| 8 | **Export results** | Hard to filter, export all or nothing | Export filtered results (e.g., only failures) |

---

### JTBD at Job Detail Level

| # | Job | Current Pain | Desired Outcome |
|---|-----|--------------|-----------------|
| 1 | **See results FIRST** | Input data takes 60% of screen | Extracted data at top, large and clear |
| 2 | **Understand what happened** | "Completed" when actually blocked | Precise status: "Blocked by CAPTCHA at step 3" |
| 3 | **Validate accuracy** | Manual comparison to GT | Side-by-side diff with visual indicators |
| 4 | **Debug failures** | Generic logs, hard to parse | Timeline of agent steps with screenshots |
| 5 | **See partial results** | All-or-nothing status | "Got 3/5 fields. Missing: price, availability" |
| 6 | **Re-run quickly** | No re-run button | "Retry" button with optional instruction edits |
| 7 | **See input context** | Input collapsed or hidden | Input visible but secondary |
| 8 | **Watch live execution** | Polling logs, no visuals | Live stream + step-by-step timeline |

---

## 🎨 DESIGN SOLUTIONS

### Solution 1: Granular Job Status System

Replace binary "completed/error" with **9 granular statuses**:

```typescript
type JobStatus =
  | 'queued'           // In queue
  | 'running'          // Currently executing
  | 'completed'        // All data extracted successfully
  | 'partial'          // Some data extracted, some missing
  | 'blocked'          // Blocked by CAPTCHA, login, etc.
  | 'timeout'          // Execution timed out
  | 'failed'           // Technical error (network, crash)
  | 'validation_failed' // Data extracted but doesn't match validation
  | 'not_found'        // Page not found / 404

type BlockedReason =
  | 'captcha'
  | 'login_required'
  | 'paywall'
  | 'geo_blocked'
  | 'rate_limited'
  | 'cloudflare'

type PartialResult = {
  status: 'partial'
  fieldsExtracted: string[]      // ['price', 'title']
  fieldsMissing: string[]         // ['availability', 'rating']
  completionPercentage: number    // 60
}
```

**Visual Design:**
- ✅ **Completed**: Green with checkmark
- ⚠️ **Partial**: Yellow with "3/5" badge
- 🔒 **Blocked**: Orange with lock icon + reason
- ⏱️ **Timeout**: Red clock icon
- ❌ **Failed**: Red with X + error type
- 🔍 **Validation Failed**: Purple with magnifying glass

---

### Solution 2: Results-First Batch Table

**Current Table:**
```
| Status | ROW # | COLUMN 1 | COLUMN 2 | ... |
|--------|-------|----------|----------|-----|
| Error  |  -    |    -     |    -     | ... |
```

**New Table (Redesigned):**
```
| Site | Status | Extracted Data → | Actions |
|------|--------|------------------|---------|
| klook.com/... | ✅ 5/5 | Title: "Hong Kong..." | [View] [Retry] |
|               |        | Price: $127          |                |
|               |        | Rating: 4.5 ⭐       |                |
| amazon.com... | 🔒 CAPTCHA | (no data) | [View] [Retry] |
| expedia.com.. | ⚠️ 3/5 | Title: "Hotel..." | [View] [Retry] |
|               |        | Price: $89        |                |
|               |        | ❌ Rating: (missing) |             |
```

**Key Changes:**
1. **Inline extracted data** - Show top 3 fields in table
2. **Status badges** - Visual + text
3. **Quick actions** - View detail, retry, edit
4. **Expandable rows** - Click to see all fields
5. **Smart grouping** - Group by status, error type
6. **Bulk selection** - Checkbox for batch operations

---

### Solution 3: Results-First Job Detail Page

**New Layout Hierarchy:**

```
┌─────────────────────────────────────────────┐
│ 1. HERO SECTION - Extraction Results        │ <- BIGGEST, TOP
│    [Large cards showing extracted data]     │
│    With GT comparison if available          │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ 2. STATUS & METRICS - What Happened         │ <- VISUAL TIMELINE
│    [Timeline of agent execution steps]      │
│    [Live stream or screenshot playback]     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ 3. CONTEXT - Input & Instructions           │ <- COLLAPSIBLE
│    [Workflow instructions]                   │
│    [Input data from CSV]                     │
└─────────────────────────────────────────────┘
```

**Detailed Design:**

#### Section 1: Hero - Extraction Results (60% of screen)
```tsx
<div className="bg-white rounded-xl p-8 shadow-lg">
  <h2>Extracted Data</h2>
  <div className="grid grid-cols-2 gap-6">
    {/* Each field as a large card */}
    <Card>
      <Label>Title</Label>
      <Value large>Hong Kong Disneyland Park Ticket</Value>
      {groundTruth && (
        <Comparison>
          ✅ Matches GT: "Hong Kong Disneyland..."
        </Comparison>
      )}
    </Card>

    <Card status="error">
      <Label>Rating</Label>
      <Value>❌ Not found</Value>
      {groundTruth && (
        <Comparison>
          ❌ Expected: 4.5 ⭐
        </Comparison>
      )}
    </Card>
  </div>
</div>
```

#### Section 2: Execution Timeline (30% of screen)
```tsx
<Timeline>
  <Step status="success" duration="2.1s">
    ✅ Page loaded
  </Step>
  <Step status="success" duration="1.3s">
    ✅ Found product title
  </Step>
  <Step status="success" duration="0.8s">
    ✅ Found price: $127
  </Step>
  <Step status="blocked" duration="5.2s">
    🔒 CAPTCHA detected at step 4
    [Screenshot showing CAPTCHA]
  </Step>
  <Step status="failed" duration="0s">
    ❌ Extraction stopped
  </Step>
</Timeline>
```

#### Section 3: Context (Collapsed by default)
```tsx
<Accordion defaultOpen={false}>
  <AccordionItem title="Input Data" badge="7 fields">
    {/* Input data here */}
  </AccordionItem>
  <AccordionItem title="Workflow Instructions">
    {/* Instructions here */}
  </AccordionItem>
</Accordion>
```

---

### Solution 4: Smart Status Detection

**Implement AI-powered status detection:**

```typescript
// In lib/job-executor.ts
async function detectJobOutcome(session: Session): Promise<JobOutcome> {
  const logs = session.rawOutput
  const screenshots = session.screenshots
  const extractedData = session.extractedData

  // Rule-based detection
  if (logs.includes('CAPTCHA') || screenshots.some(detectCAPTCHA)) {
    return {
      status: 'blocked',
      reason: 'captcha',
      message: 'Page presented a CAPTCHA challenge'
    }
  }

  if (logs.includes('Login required')) {
    return {
      status: 'blocked',
      reason: 'login_required',
      message: 'Site requires authentication'
    }
  }

  // Check for partial extraction
  const expectedFields = getExpectedFields(job)
  const extractedFields = Object.keys(extractedData || {})
  const missingFields = expectedFields.filter(f => !extractedFields.includes(f))

  if (missingFields.length > 0 && extractedFields.length > 0) {
    return {
      status: 'partial',
      fieldsExtracted: extractedFields,
      fieldsMissing: missingFields,
      completionPercentage: (extractedFields.length / expectedFields.length) * 100
    }
  }

  // Full success
  if (extractedFields.length === expectedFields.length) {
    return {
      status: 'completed',
      completionPercentage: 100
    }
  }

  // Default to failed
  return {
    status: 'failed',
    reason: 'unknown',
    message: session.errorMessage || 'Extraction failed'
  }
}
```

---

### Solution 5: Batch Dashboard Enhancements

**Add smart filters and groupings:**

```tsx
<BatchDashboard>
  {/* Quick stats */}
  <StatsBar>
    <Stat label="Completed" value={45} color="green" />
    <Stat label="Partial" value={8} color="yellow" />
    <Stat label="Blocked" value={12} color="orange">
      <Breakdown>
        - CAPTCHA: 10
        - Login: 2
      </Breakdown>
    </Stat>
    <Stat label="Failed" value={3} color="red" />
  </StatsBar>

  {/* Smart filters */}
  <FilterBar>
    <Filter label="All" count={68} active />
    <Filter label="Needs Attention" count={23} badge="warning" />
    <Filter label="Completed" count={45} />
    <Filter label="Blocked by CAPTCHA" count={10} />
  </FilterBar>

  {/* Bulk actions */}
  {selectedJobs.length > 0 && (
    <BulkActions>
      <Button>Retry {selectedJobs.length} jobs</Button>
      <Button>Export selected</Button>
      <Button>Delete</Button>
    </BulkActions>
  )}

  {/* Enhanced table */}
  <JobsTable expandableRows inlineData />
</BatchDashboard>
```

---

## 🔨 IMPLEMENTATION PLAN

### Phase 1: Granular Status System (Day 1)
**Files to modify:**
- `db/schema.ts` - Add status fields
- `lib/job-executor.ts` - Implement status detection
- `components/StatusBadge.tsx` - New component

**New fields:**
```sql
ALTER TABLE jobs ADD COLUMN detailed_status TEXT;
ALTER TABLE jobs ADD COLUMN blocked_reason TEXT;
ALTER TABLE jobs ADD COLUMN fields_extracted TEXT[];
ALTER TABLE jobs ADD COLUMN fields_missing TEXT[];
ALTER TABLE jobs ADD COLUMN completion_percentage INTEGER;
```

---

### Phase 2: Enhanced Batch Table (Day 2-3)
**Files to create:**
- `components/batch-dashboard/EnhancedJobsTable.tsx` - New table
- `components/batch-dashboard/InlineDataPreview.tsx` - Inline data
- `components/batch-dashboard/JobRowExpanded.tsx` - Expandable rows
- `components/batch-dashboard/BulkActionsBar.tsx` - Bulk actions

**Features:**
- Inline data preview (top 3 fields)
- Expandable rows for full data
- Status badges with icons
- Quick action buttons
- Bulk selection
- Smart filters

---

### Phase 3: Results-First Job Detail (Day 4-5)
**Files to modify:**
- `app/projects/[id]/jobs/[jobId]/JobDetailClient.tsx` - Complete rewrite

**New layout:**
1. **Hero section** - Extracted data (large cards)
2. **Timeline section** - Execution steps with status
3. **Context section** - Input data (collapsed)

**New components:**
- `components/job-detail/ExtractionResultsHero.tsx`
- `components/job-detail/ExecutionTimeline.tsx`
- `components/job-detail/FieldComparisonCard.tsx`

---

### Phase 4: Smart Detection & Polish (Day 6)
- Implement CAPTCHA detection
- Add partial extraction logic
- Improve error messages
- Add retry functionality
- Polish animations and transitions

---

## 📊 SUCCESS METRICS

### User Experience Metrics
- ⏱️ Time to see results: **< 2 clicks** (down from 4)
- 📊 Data visibility: **100% jobs show preview** (up from 0%)
- 🎯 Status accuracy: **95%+ correct status** (up from 60%)
- 🔍 Error clarity: **100% failures have reason** (up from 20%)

### User Satisfaction Metrics
- 👀 Less scrolling: **60% reduction** in scroll depth
- 🖱️ Fewer clicks: **50% reduction** to see all results
- ⚡ Faster review: **5x faster** batch review time
- 😊 User happiness: **"I can finally see what happened!"**

---

## 🎨 VISUAL DESIGN MOCKUP

### Before (Current):
```
Batch Page:
┌────────────────────────────────────┐
│ STATUS | ROW # | COL 1 | COL 2    │
│ Error  |   -   |   -   |   -      │ <- Empty!
│ Error  |   -   |   -   |   -      │ <- No data!
└────────────────────────────────────┘

Job Detail Page:
┌────────────────────────────────────┐
│ ✅ Completed (WRONG!)               │
├────────────────────────────────────┤
│ Input Data (60% of space)          │ <- Wrong focus
│ - Field 1: ...                     │
│ - Field 2: ...                     │
│ - Field 3: ...                     │
├────────────────────────────────────┤
│ (scroll down...)                   │
│                                    │
│ Extraction Results (buried)        │ <- Should be at top!
└────────────────────────────────────┘
```

### After (New):
```
Batch Page:
┌──────────────────────────────────────────────┐
│ ✅ 45 | ⚠️ 8 | 🔒 12 (CAPTCHA) | ❌ 3       │ <- Stats
├──────────────────────────────────────────────┤
│ Site             | Status | Data Preview    │
│ klook.com/...    | ✅ 5/5 | Title: "Hong..." │ <- Inline data!
│                  |        | Price: $127      │
│ [Expand] [Retry]                             │
├──────────────────────────────────────────────┤
│ amazon.com/...   | 🔒 CAPTCHA | (blocked)   │ <- Clear status
│ [View] [Retry with proxy]                    │
└──────────────────────────────────────────────┘

Job Detail Page:
┌──────────────────────────────────────────────┐
│ 🎯 EXTRACTION RESULTS (HERO)                 │ <- Results first!
│ ┌────────────┐ ┌────────────┐               │
│ │Title ✅    │ │Price ✅    │               │
│ │Hong Kong...│ │$127        │               │
│ │✓ Matches GT│ │✓ Matches GT│               │
│ └────────────┘ └────────────┘               │
│ ┌────────────┐ ┌────────────┐               │
│ │Rating ❌   │ │Avail. ⚠️   │               │
│ │Not found   │ │Partial     │               │
│ │✗ Expected  │ │⚠️ Check GT │               │
│ │4.5 ⭐      │ │            │               │
│ └────────────┘ └────────────┘               │
├──────────────────────────────────────────────┤
│ 📍 EXECUTION TIMELINE                        │
│ ✅ Loaded (2.1s) → ✅ Found title (1.3s)    │
│ → 🔒 CAPTCHA detected (5.2s) → ❌ Stopped   │ <- Clear what happened
├──────────────────────────────────────────────┤
│ ▼ Context (click to expand)                 │ <- Secondary
└──────────────────────────────────────────────┘
```

---

## 🚀 NEXT STEPS

1. **Review this plan** - Approve overall direction
2. **Start Phase 1** - Implement granular status system
3. **Build iteratively** - Ship each phase to get feedback
4. **Measure impact** - Track before/after metrics
5. **Iterate** - Refine based on user feedback

---

**Goal:** Transform MINO from "where's my data?" to "here's your data!" 🎯
