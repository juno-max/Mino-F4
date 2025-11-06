# Jobs Table & Flow UX - Complete Redesign Plan

## 🎯 Core Problem

**Current State:** Users cannot see extraction results without multiple clicks. Data is buried, input takes priority over output.

**JTBD:** "When I run scraping jobs, I want to immediately see what data was extracted, identify issues, and take action - all from the table view."

## 📊 Current Pain Points

### 1. **Table View (Batch Dashboard)**
- ❌ All cells show "-" even when jobs "completed"
- ❌ No indication if extraction succeeded
- ❌ Can't see results without clicking through
- ❌ Status doesn't distinguish success/partial/failure
- ❌ View button buried at end of row

### 2. **Job Detail Page**
- ❌ Input data takes massive space at top
- ❌ Results buried below fold
- ❌ Have to scroll to see what was extracted
- ❌ Execution logs more prominent than results

### 3. **User Flow**
- ❌ 3 clicks to see if job extracted data successfully
- ❌ No bulk result review capability
- ❌ Can't compare results across jobs
- ❌ Hard to spot extraction issues

## 🎨 Complete Redesign Solution

### **PART 1: Enhanced Status Granularity**

Replace single "Completed" status with:

```typescript
type JobExecutionStatus =
  | 'queued'      // Waiting to run
  | 'running'     // Currently executing
  | 'success'     // ✅ Completed with data extracted
  | 'partial'     // ⚠️  Completed but missing some fields
  | 'no_data'     // ❌ Completed but no data extracted
  | 'failed'      // ❌ Execution error
  | 'timeout'     // ⏱  Execution timed out
```

**Visual Indicators:**
- `success` = Green ✓ + Data count "8/8 fields"
- `partial` = Amber ⚠ + "5/8 fields"
- `no_data` = Red ✗ + "0/8 fields"
- `failed` = Red ❌ + Error message preview
- `timeout` = Gray ⏱ + Duration

### **PART 2: Expandable Result Rows**

**Collapsed State (Default):**
```
┌─────────────────────────────────────────────────────────────────┐
│ ✓ Success  ▼  8/8    klook.com/activity...                     │
│               Product Name    Price    Rating    Availability   │
│               ✓ Disneyland    ✓ $89    ✓ 4.8    ✓ Available    │
└─────────────────────────────────────────────────────────────────┘
```

**Expanded State (Click anywhere on row):**
```
┌─────────────────────────────────────────────────────────────────┐
│ ✓ Success  ▲  8/8    klook.com/activity...    [View] [Retry]   │
│                                                                  │
│   📊 EXTRACTED DATA (8 fields)                                  │
│   ┌──────────────────────────────────────────────────┐         │
│   │ Product Name      ✓  Hong Kong Disneyland       │         │
│   │ Price            ✓  $89.00                       │         │
│   │ Rating           ✓  4.8/5                        │         │
│   │ Availability     ✓  Available                    │         │
│   │ Location         ✓  Hong Kong                    │         │
│   │ Duration         ✓  Full Day                     │         │
│   │ Category         ✓  Theme Park                   │         │
│   │ Reviews Count    ✓  12,450                       │         │
│   └──────────────────────────────────────────────────┘         │
│                                                                  │
│   ⚡ Execution: 45s  |  📸 Screenshot  |  📄 Raw HTML           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**For Failed Jobs:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ❌ Failed  ▲  0/8    klook.com/activity...    [Retry] [Debug]  │
│                                                                  │
│   ⚠️  ERROR                                                      │
│   ┌──────────────────────────────────────────────────┐         │
│   │ fetch failed: Connection timeout                 │         │
│   │ attempted addresses: 10.2.3.39:443               │         │
│   │                                                   │         │
│   │ This usually means:                              │         │
│   │ • Website is blocking requests                   │         │
│   │ • Network connectivity issues                    │         │
│   │ • Site requires authentication                   │         │
│   └──────────────────────────────────────────────────┘         │
│                                                                  │
│   💡 Try: [Retry with delay] [Check site manually] [View logs] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### **PART 3: Restructured Job Detail Page**

**NEW LAYOUT - Results First:**

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Batch                                            │
│                                                             │
│  ✅ Extraction Successful                    [Retry] [Edit] │
│  https://klook.com/activity/39-hong-kong...                │
│  Completed in 45s • 8/8 fields extracted                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 EXTRACTED DATA                          [Export JSON]  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │  Product Name      ✓  Hong Kong Disneyland          │ │
│  │  Price            ✓  $89.00      GT: $89.00  ✓      │ │
│  │  Rating           ✓  4.8/5       GT: 4.8     ✓      │ │
│  │  Availability     ✓  Available   GT: Available ✓    │ │
│  │  ...                                                 │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🎬 EXECUTION TIMELINE                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  0:00  Started execution                             │ │
│  │  0:05  → Visiting URL                                │ │
│  │  0:12  → Page loaded                                 │ │
│  │  0:18  → Extracting product name                     │ │
│  │  0:25  → Extracting price                            │ │
│  │  0:32  → Extracting rating                           │ │
│  │  0:45  ✓ Extraction complete                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [📸 View Screenshot]  [📄 View Raw HTML]  [🔍 View Logs]  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 INPUT DATA (Collapsed by default)          [Show ▼]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **PART 4: Smart Table Columns**

**Auto-configure based on extraction results:**

Instead of showing ALL columns from schema, show:
1. **Status** (compact)
2. **Result Quality** (8/8, 5/8, etc.)
3. **Top 3-4 most important extracted fields** (dynamic)
4. **Actions** (expand, view, retry)

Example:
```
┌──────────────────────────────────────────────────────────────┐
│ ☑  Status        Results  Product Name       Price     → │
├──────────────────────────────────────────────────────────────┤
│ ☐  ✅ Success    8/8      ✓ Disneyland      ✓ $89       › │
│ ☐  ⚠️  Partial   5/8      ✓ Ocean Park      ✗ N/A       › │
│ ☐  ❌ Failed     0/8      - No data          -           › │
└──────────────────────────────────────────────────────────────┘
```

Click "›" to expand row inline
Click row to navigate to detail page

### **PART 5: Bulk Result Review**

**New View Mode: "Results Grid"**

```
┌─────────────────────────────────────────────────────────────┐
│  View: [Table] [Grid] [Compare]                            │
└─────────────────────────────────────────────────────────────┘

GRID VIEW:

┌─────────────┬─────────────┬─────────────┬─────────────┐
│ ✅ 8/8      │ ⚠️  5/8      │ ✅ 8/8      │ ❌ 0/8      │
│ Disneyland  │ Ocean Park  │ Peak Tram   │ Failed      │
│ $89         │ $75         │ $12         │ -           │
│ 4.8★        │ 4.5★        │ 4.7★        │ -           │
│ Available   │ Available   │ Sold Out    │ -           │
│             │             │             │             │
│ [View Full] │ [View Full] │ [View Full] │ [Retry]     │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## 🔧 Implementation Plan

### **Phase 1: Enhanced Status System** ⭐ PRIORITY

**File:** `db/schema.ts`
```typescript
// Add new status enum
status: text('status', {
  enum: ['queued', 'running', 'success', 'partial', 'no_data', 'failed', 'timeout']
})

// Add result metrics
extractedFieldsCount: integer('extracted_fields_count').default(0)
totalFieldsCount: integer('total_fields_count').default(0)
extractionQuality: text('extraction_quality') // 'complete', 'partial', 'empty'
```

**File:** `app/api/projects/[id]/batches/[batchId]/execute/route.ts`
```typescript
// After EVA execution, calculate status
const extractedFields = Object.keys(result.extractedData || {}).length
const totalFields = columnSchema.filter(c => !c.isUrl).length

let status = 'failed'
let quality = 'empty'

if (result.success && extractedFields > 0) {
  if (extractedFields === totalFields) {
    status = 'success'
    quality = 'complete'
  } else {
    status = 'partial'
    quality = 'partial'
  }
} else if (result.success) {
  status = 'no_data'
} else if (result.error?.includes('timeout')) {
  status = 'timeout'
}

await db.update(jobs).set({
  status,
  extractedFieldsCount: extractedFields,
  totalFieldsCount: totalFields,
  extractionQuality: quality
})
```

### **Phase 2: Expandable Rows** ⭐ PRIORITY

**New Component:** `components/batch-dashboard/ExpandableJobRow.tsx`

```typescript
interface ExpandableJobRowProps {
  job: Job
  columnSchema: ColumnConfig[]
  isExpanded: boolean
  onToggle: () => void
}

export function ExpandableJobRow({
  job,
  columnSchema,
  isExpanded,
  onToggle
}: ExpandableJobRowProps) {
  return (
    <>
      {/* Collapsed Row */}
      <tr onClick={onToggle} className="cursor-pointer hover:bg-gray-50">
        <td>{getStatusBadge(job.status)}</td>
        <td>{job.extractedFieldsCount}/{job.totalFieldsCount}</td>
        <td>{/* Preview of top fields */}</td>
        <td>{isExpanded ? '▲' : '▼'}</td>
      </tr>

      {/* Expanded Content */}
      {isExpanded && (
        <tr>
          <td colSpan={100} className="p-6 bg-gray-50">
            <ResultPreviewCard job={job} columnSchema={columnSchema} />
          </td>
        </tr>
      )}
    </>
  )
}
```

**New Component:** `components/batch-dashboard/ResultPreviewCard.tsx`

Shows extracted data, errors, quick actions inline.

### **Phase 3: Restructured Job Detail** ⭐ PRIORITY

**File:** `app/projects/[id]/jobs/[jobId]/page.tsx`

**NEW LAYOUT:**
1. Hero section: Status + URL + metrics (top)
2. Extracted Data section (prominent, expanded by default)
3. Execution Timeline (collapsed by default)
4. Screenshots/Raw data (collapsed by default)
5. Input Data (collapsed by default, at bottom)

### **Phase 4: Smart Column Selection**

Auto-select most valuable columns:
1. Status (always)
2. Result quality (always)
3. First 3-4 extracted fields that have data
4. Actions (always)

**File:** `components/batch-dashboard/SmartColumnSelector.ts`
```typescript
function selectSmartColumns(jobs: Job[], columnSchema: ColumnConfig[]) {
  // Analyze which columns have the most data
  const columnPopularity = {}

  jobs.forEach(job => {
    Object.keys(job.extractedData || {}).forEach(field => {
      columnPopularity[field] = (columnPopularity[field] || 0) + 1
    })
  })

  // Return top 4 most populated columns
  return Object.entries(columnPopularity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name]) => name)
}
```

### **Phase 5: Grid View Mode**

**New Component:** `components/batch-dashboard/ResultsGridView.tsx`

Card-based layout showing results at a glance.

### **Phase 6: Quick Actions**

In-row actions:
- **Expand/Collapse** - See results inline
- **View Full** - Navigate to detail page
- **Retry** - Re-run the job
- **Export** - Download as JSON
- **Screenshot** - View captured screenshot
- **Compare** - Compare with ground truth

## 📈 Success Metrics

**Before:**
- 3+ clicks to see if data was extracted
- No way to bulk review results
- Input data obscures results

**After:**
- 0 clicks - See results immediately in table
- 1 click - See full results inline (expanded row)
- Grid view for bulk review
- Results always prominent, input hidden by default

## 🎯 Priority Implementation Order

1. ✅ **Enhanced Status** - Distinguish success/partial/failed/no_data
2. ✅ **Expandable Rows** - View results inline without navigation
3. ✅ **Restructure Job Detail** - Results first, input last
4. **Smart Columns** - Auto-select most valuable fields
5. **Grid View** - Bulk result review
6. **Quick Actions** - Retry, export, screenshot in-row

## 💡 Key Principles

1. **Results First** - What was extracted is more important than what was input
2. **Zero Navigation** - See everything from table view
3. **Smart Defaults** - Show what matters, hide what doesn't
4. **Clear Status** - Success ≠ Completed, be granular
5. **Bulk Actions** - Enable reviewing 10s/100s of results quickly

---

**Next Step:** Implement Phase 1 (Enhanced Status) and Phase 2 (Expandable Rows) first - these give maximum UX improvement for minimum effort.
