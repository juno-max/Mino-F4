# 🎯 Jobs Table UX Refinement - Comprehensive Plan

**Date:** 2025-11-05
**Goal:** Transform the jobs table from error-focused to data-focused, with best-in-class UX

---

## 🔍 Problem Analysis

### Current Issues
1. **❌ Error-first visual hierarchy** - Red error badges dominate, creating negative perception
2. **❌ Wrong data focus** - Shows input URL, not extracted output (the actual value)
3. **❌ No live indicators** - Can't tell which jobs are actively running
4. **❌ Hidden value** - Extracted data is completely invisible
5. **❌ Poor scannability** - Hard to quickly assess job results
6. **❌ No inline actions** - Must navigate away for every interaction
7. **❌ Static display** - No real-time updates during execution
8. **❌ One-size-fits-all** - Doesn't adapt to batch schema

### User's Key Insight
> "The primary focus should be the **extracted data** (output based on instructions), not the error status or input URL. And users need to see **live updates** of what agents are working on."

---

## 🎯 Jobs To Be Done (JTBD)

### Primary Jobs
1. **"I want to see if the agent extracted the RIGHT data"** ⭐ #1 Priority
2. **"I want to know which jobs are actively being processed"** ⭐ Live Status
3. **"I want to quickly spot and fix accuracy issues"** ⭐ Quality Focus
4. **"I want to validate against ground truth"** (if available)
5. **"I want to retry failed jobs without losing context"**

### Secondary Jobs
6. "I want to see execution progress and ETA"
7. "I want to export successful results"
8. "I want to compare output across similar URLs"
9. "I want to fix ground truth inline"
10. "I want to group/filter by domain or status"

---

## ✨ Design Principles

### 1. Data-First, Not Error-First
- **Lead with extracted data** (the value)
- De-emphasize status (utility info, not primary)
- Success indicators > error badges
- Positive framing by default

### 2. Live Transparency
- Show what's happening RIGHT NOW
- Real-time progress updates
- Active job indicators
- Current step display

### 3. Progressive Disclosure
- Summary view by default
- Expand for full details
- Inline actions without navigation
- Context-sensitive information

### 4. Adaptive Intelligence
- Columns based on batch schema
- Show extracted fields dynamically
- Compare with ground truth inline
- Smart defaults per use case

### 5. Action Proximity
- Actions next to relevant data
- Bulk actions when selected
- Inline editing where possible
- Quick preview without navigation

---

## 🎨 Proposed Design Solution

### NEW Table Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Filter: All ▾] [Search URL...]           [Export] [Retry Selected (3)]    │
├───┬─────────┬───────────────┬──────────────┬────────┬──────────┬───────────┤
│ ☐ │ Site    │ Extracted Data Columns      │ Match  │ Status   │ Actions   │
│   │         │ (Dynamic based on schema)   │        │          │           │
├───┼─────────┼───────────────┼──────────────┼────────┼──────────┼───────────┤
│ ☐ │ amazon  │ $29.99 │ In Stock │ Prime   │ 100% ✓ │ ✓ 2.3s   │ [👁][↻]  │
│   │ .com    │ ✓      │ ✓        │ ✓       │        │          │           │
├───┼─────────┼───────────────┼──────────────┼────────┼──────────┼───────────┤
│ ☐ │ ebay    │ $25.50 │ ⚠ "Unknown" │ -    │ 85% ⚠  │ ✓ 3.1s   │ [👁][↻]  │
│   │ .com    │ ✓      │ ✗           │       │        │          │           │
├───┼─────────┼───────────────┼──────────────┼────────┼──────────┼───────────┤
│ ⚡ │ etsy    │ [Processing... 67%]          │   -    │ ⚡ 1.2s  │ [👁]      │
│   │ .com    │ → Extracting product price   │        │ Running  │           │
├───┼─────────┼───────────────┼──────────────┼────────┼──────────┼───────────┤
│ ☐ │ target  │ - │ - │ -                    │   -    │ ✗ Failed │ [👁][↻]  │
│   │ .com    │ ❌ Network timeout            │        │ 0.5s     │           │
└───┴─────────┴───────────────┴──────────────┴────────┴──────────┴───────────┘
```

### Key Changes

#### 1. **Dynamic Data Columns** (LEFT SIDE - PRIMARY FOCUS)
- Extract column definitions from `columnSchema`
- Show each extracted field as a table column
- Display actual values with validation indicators:
  - ✓ Green check = matches ground truth
  - ✗ Red X = doesn't match ground truth
  - ⚠ Amber warning = extracted but no ground truth
  - - Dash = not extracted yet

#### 2. **Accuracy/Match Column** (NEW)
- Overall accuracy score (if ground truth available)
- Color-coded:
  - 100% = Green with ✓
  - 80-99% = Amber with ⚠
  - <80% = Red with ✗
- Shows "N/A" if no ground truth

#### 3. **Compact Site Column**
- Show domain only (not full URL)
- Hover for full URL tooltip
- Click to open in new tab
- Much less visual weight

#### 4. **Status Column** (RIGHT SIDE - DE-EMPHASIZED)
- Moved to right side (utility info)
- More compact badges
- Success states:
  - ✓ Completed (green text, no badge)
  - ⚡ Running (blue pulse icon + time)
  - ⏳ Queued (gray text)
  - ✗ Failed (red text + error icon)

#### 5. **Live Execution Indicators**
- Running jobs get special treatment:
  - ⚡ Lightning bolt icon (animated pulse)
  - Progress bar (if available)
  - Current step text: "→ Extracting product price"
  - Elapsed time counter (updates in real-time)
  - Blue-tinted row background

#### 6. **Quick Actions** (INLINE)
- 👁 Quick View = Open modal with full details (no navigation)
- ↻ Retry = Retry this job
- Only show relevant actions per row state

---

## 📋 Implementation To-Do List

### **PHASE 1: Data-First Core Refactor** 🔥 HIGH PRIORITY

#### 1.1 Dynamic Column System
- [ ] Create `DynamicTableHeader` component
  - [ ] Parse `columnSchema` from batch
  - [ ] Generate table headers for each extracted field
  - [ ] Add column visibility toggles
  - [ ] Support column reordering (drag-and-drop)

- [ ] Create `DataCell` component
  - [ ] Display extracted field value
  - [ ] Show validation indicator (✓, ✗, ⚠, -)
  - [ ] Compare with ground truth inline
  - [ ] Handle different data types (string, number, boolean, array)
  - [ ] Truncate long values with tooltip

- [ ] Update `EnhancedJobsTable` layout
  - [ ] Reorder columns: `[☐] [Site] [Dynamic Data Cols...] [Match] [Status] [Actions]`
  - [ ] Remove URL column (show domain only)
  - [ ] Move status to right side
  - [ ] Add match/accuracy column

#### 1.2 Accuracy Indicators
- [ ] Create `AccuracyCell` component
  - [ ] Calculate per-job accuracy (if GT available)
  - [ ] Show percentage with color coding
  - [ ] Add tooltips with field-level breakdown
  - [ ] Handle "N/A" for jobs without GT

- [ ] Add per-field validation icons
  - [ ] Green ✓ for matches
  - [ ] Red ✗ for mismatches
  - [ ] Amber ⚠ for uncertain
  - [ ] Gray - for not extracted

#### 1.3 Visual Hierarchy Improvements
- [ ] Reduce status badge prominence
  - [ ] Use text with icon instead of filled badges
  - [ ] Smaller font size
  - [ ] Muted colors for non-errors

- [ ] Emphasize data columns
  - [ ] Larger font for extracted values
  - [ ] Bold successful extractions
  - [ ] Highlight ground truth matches

- [ ] Add success indicators
  - [ ] Green subtle glow for 100% accurate jobs
  - [ ] Celebrate completions visually

---

### **PHASE 2: Live Monitoring & Real-Time Updates** ⚡ HIGH PRIORITY

#### 2.1 Live Execution Indicators
- [ ] Create `LiveJobRow` component
  - [ ] Animated pulse effect for running jobs
  - [ ] Blue-tinted background
  - [ ] ⚡ Lightning bolt icon
  - [ ] Real-time progress bar (if available)

- [ ] Add current step display
  - [ ] "→ Navigating to page"
  - [ ] "→ Extracting product price"
  - [ ] "→ Validating data"
  - [ ] Fade animation when step changes

- [ ] Add elapsed time counter
  - [ ] Show HH:MM:SS format
  - [ ] Update every second
  - [ ] Highlight if taking too long (>2min = amber)

#### 2.2 WebSocket Integration
- [ ] Connect to execution events WebSocket
  - [ ] Subscribe to job status updates
  - [ ] Subscribe to progress updates
  - [ ] Subscribe to step changes

- [ ] Update jobs table in real-time
  - [ ] Smooth animations for status changes
  - [ ] Toast notifications for completions
  - [ ] Auto-scroll to completed jobs (optional)

- [ ] Add connection status indicator
  - [ ] "🟢 Live" when connected
  - [ ] "🟡 Reconnecting..." when disconnected
  - [ ] "🔴 Offline - Showing cached data" when offline

#### 2.3 Progress Visualization
- [ ] Add mini progress bar for running jobs
  - [ ] Show 0-100% completion
  - [ ] Animate smoothly
  - [ ] Color changes based on stage

- [ ] Add ETA estimation
  - [ ] Based on average job duration
  - [ ] Show "~30s remaining"
  - [ ] Update as job progresses

---

### **PHASE 3: Quick Actions & Inline Interactions** 👆 MEDIUM PRIORITY

#### 3.1 Quick View Modal
- [ ] Create `JobQuickViewModal` component
  - [ ] Full extracted data display
  - [ ] Ground truth comparison (side-by-side)
  - [ ] Execution logs
  - [ ] Screenshots (if available)
  - [ ] Error details (if failed)
  - [ ] Keyboard shortcut (ESC to close)

- [ ] Add "👁 Quick View" button to each row
  - [ ] Opens modal without navigation
  - [ ] Preserves table scroll position
  - [ ] Can navigate next/prev job in modal

#### 3.2 Inline Retry
- [ ] Add "↻ Retry" button for failed jobs
  - [ ] Immediate retry with same parameters
  - [ ] Show loading state
  - [ ] Update row in place
  - [ ] Option to "Retry with modified instructions"

- [ ] Bulk retry for selected jobs
  - [ ] "Retry Selected (5)" button in header
  - [ ] Progress indicator for bulk operations
  - [ ] Success/failure summary

#### 3.3 Expandable Rows
- [ ] Click row to expand (accordion style)
  - [ ] Show full extracted data
  - [ ] Show execution timeline
  - [ ] Show raw HTML preview (if useful)
  - [ ] Smooth expand/collapse animation

- [ ] Add expand/collapse all toggle
  - [ ] Header button: "Expand All / Collapse All"
  - [ ] Remember state per session

#### 3.4 Copy & Export Actions
- [ ] Add copy buttons
  - [ ] Copy URL
  - [ ] Copy extracted data (JSON)
  - [ ] Copy as CSV row
  - [ ] Toast confirmation: "Copied!"

- [ ] Improve export selected
  - [ ] Choose format (CSV, JSON, Excel)
  - [ ] Choose which columns to include
  - [ ] Include ground truth comparison

---

### **PHASE 4: Advanced Filtering & Customization** 🔍 MEDIUM PRIORITY

#### 4.1 Smart Filtering
- [ ] Add accuracy range filter
  - [ ] Slider: 0-100%
  - [ ] Presets: "Perfect (100%)", "Good (>90%)", "Needs Review (<90%)"

- [ ] Add domain filter
  - [ ] Auto-detect domains from URLs
  - [ ] Multi-select dropdown
  - [ ] Group similar domains

- [ ] Add execution time filter
  - [ ] Fast (<1s), Normal (1-5s), Slow (>5s)

- [ ] Add error type filter (for failed jobs)
  - [ ] Network errors
  - [ ] Extraction errors
  - [ ] Validation errors

#### 4.2 Advanced Sorting
- [ ] Add sort by accuracy
- [ ] Add sort by execution time
- [ ] Add sort by domain
- [ ] Add sort by last modified
- [ ] Multi-column sorting

#### 4.3 Column Customization
- [ ] Add "Customize Columns" button
  - [ ] Show/hide specific data columns
  - [ ] Reorder columns (drag-and-drop)
  - [ ] Save preferences per batch
  - [ ] Reset to defaults

- [ ] Add column width adjustment
  - [ ] Drag column borders to resize
  - [ ] Auto-fit to content
  - [ ] Save preferences

#### 4.4 Grouping & Aggregation
- [ ] Add "Group By" option
  - [ ] Group by domain
  - [ ] Group by status
  - [ ] Group by accuracy tier (Perfect/Good/Poor)

- [ ] Show group summaries
  - [ ] Count per group
  - [ ] Average accuracy per group
  - [ ] Expand/collapse groups

---

### **PHASE 5: Inline Editing & Quality Tools** ✏️ LOWER PRIORITY

#### 5.1 Inline Ground Truth Editing
- [ ] Make GT cells editable (if user has permission)
  - [ ] Click to edit
  - [ ] Auto-save on blur
  - [ ] Validation feedback
  - [ ] Undo/redo support

- [ ] Bulk GT editing
  - [ ] Select multiple rows
  - [ ] "Edit Ground Truth" button
  - [ ] Modal with all selected jobs
  - [ ] Save all changes at once

#### 5.2 Mark as Reviewed
- [ ] Add "Mark as Reviewed" action
  - [ ] Checkbox or button
  - [ ] Filter: "Show only unreviewed"
  - [ ] Track who reviewed and when

#### 5.3 Add to Review Queue
- [ ] Add "⭐ Flag for Review" button
  - [ ] Mark suspicious results
  - [ ] Add review notes
  - [ ] Assign to team member

---

### **PHASE 6: Performance & Polish** ⚡ CONTINUOUS

#### 6.1 Virtualization
- [ ] Implement virtual scrolling
  - [ ] Only render visible rows
  - [ ] Handle thousands of jobs smoothly
  - [ ] Use `react-virtual` or similar

#### 6.2 Optimistic Updates
- [ ] Immediate UI feedback
  - [ ] Update row before API confirms
  - [ ] Rollback if API fails
  - [ ] Show loading states

#### 6.3 Keyboard Navigation
- [ ] Arrow keys to navigate rows
- [ ] Space to select row
- [ ] Enter to expand/quick view
- [ ] Escape to close modals
- [ ] Tab for accessibility

#### 6.4 Responsive Design
- [ ] Mobile: Stack columns vertically
- [ ] Mobile: Swipe actions
- [ ] Tablet: Show fewer columns
- [ ] Desktop: Full table

#### 6.5 Empty & Loading States
- [ ] Better empty state
  - [ ] Illustration
  - [ ] "No jobs yet - upload a CSV to get started"
  - [ ] Quick action buttons

- [ ] Loading skeleton
  - [ ] Show skeleton rows while loading
  - [ ] Smooth transition to real data

---

## 🎯 Success Metrics

### User Experience
- ✅ **Data visibility**: Users see extracted data within 0 scrolls (currently hidden)
- ✅ **Live awareness**: Users can see active jobs at a glance (currently unclear)
- ✅ **Quick validation**: Users can validate accuracy in <2 seconds per job
- ✅ **Error context**: Users understand WHY a job failed (not just that it failed)
- ✅ **Action speed**: Users can retry/export without navigation

### Technical
- ⚡ **Table render**: <100ms for 100 jobs
- ⚡ **Real-time updates**: <50ms latency from WebSocket
- ⚡ **Search/filter**: <50ms response time
- 📊 **Virtualization**: Handle 10,000+ jobs without performance issues

### Business
- 📈 **Task completion rate**: Users complete reviews faster
- 📈 **Error resolution rate**: More failed jobs are retried and fixed
- 📈 **Export usage**: More users export results (finding value)
- 😊 **User satisfaction**: "This table is so much better!" feedback

---

## 🚀 Implementation Strategy

### Sprint 1 (Week 1): **Data-First Core** 🔥
- Dynamic column system
- Accuracy indicators
- Visual hierarchy improvements
- **Goal**: See extracted data as primary focus

### Sprint 2 (Week 1-2): **Live Monitoring** ⚡
- Live execution indicators
- WebSocket integration
- Real-time progress updates
- **Goal**: See what agents are doing in real-time

### Sprint 3 (Week 2): **Quick Actions** 👆
- Quick view modal
- Inline retry
- Expandable rows
- **Goal**: Act on jobs without losing context

### Sprint 4 (Week 3): **Advanced Features** 🔍
- Smart filtering
- Column customization
- Advanced sorting
- **Goal**: Power users can customize their workflow

### Sprint 5 (Week 4): **Polish & Optimize** ✨
- Performance optimization
- Keyboard navigation
- Responsive design
- **Goal**: Production-ready, scalable, delightful

---

## 🎨 Design Mockups Needed

1. **Default table state** (with extracted data visible)
2. **Running job state** (with live indicators)
3. **Quick view modal** (full job details)
4. **Bulk actions state** (multiple selected)
5. **Expandable row** (accordion view)
6. **Column customization panel**
7. **Mobile responsive layout**

---

## 📚 Technical Considerations

### Component Architecture
```
EnhancedJobsTable (main)
├─ DynamicTableHeader
│  ├─ ColumnHeader (for each extracted field)
│  └─ ColumnCustomization
├─ TableBody
│  ├─ JobRow (standard)
│  ├─ LiveJobRow (for running jobs)
│  ├─ ExpandedJobRow (accordion)
│  └─ VirtualRow (for virtualization)
├─ DataCell (for each extracted field)
│  ├─ ValidationIcon
│  └─ ValueDisplay
├─ AccuracyCell
├─ StatusCell
├─ ActionsCell
└─ JobQuickViewModal
```

### State Management
- Local state for UI (expanded rows, selected jobs)
- WebSocket state for real-time updates
- React Query for data fetching/caching
- Optimistic updates for mutations

### API Endpoints Needed
- `GET /api/batches/:id/jobs/stream` - WebSocket endpoint
- `PATCH /api/jobs/:id/ground-truth` - Update GT
- `POST /api/jobs/:id/retry` - Retry job
- `POST /api/jobs/bulk-retry` - Bulk retry

---

## 💡 Key Insights

### Why This Matters
> "Users don't care about the INPUT (URL), they care about the OUTPUT (extracted data). The current table hides the most valuable information and emphasizes the least important (status)."

### Design Philosophy
- **Data > Status**: Show what was extracted, not just if it worked
- **Live > Static**: Show what's happening now, not just history
- **Inline > Navigation**: Enable actions without context switching
- **Adaptive > Fixed**: Customize to each batch's unique schema

### User-Centered Approach
- Start with JTBD (not features)
- Design for success, not just error handling
- Progressive disclosure (simple by default, powerful when needed)
- Real-time feedback loop (don't make users guess)

---

**Status**: 📋 PLAN COMPLETE - READY FOR REVIEW & IMPLEMENTATION

**Next Steps**:
1. Review with team
2. Get design approval on mockups
3. Start Sprint 1: Data-First Core
4. Iterate based on user feedback
