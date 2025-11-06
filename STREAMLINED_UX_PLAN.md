# MINO - Streamlined User Experience Plan
## Radical Simplification for Effortless JTBD Achievement

---

## 🎯 Core Philosophy

**Jobs To Be Done (JTBD):**
1. Extract data from websites automatically
2. Validate extraction accuracy
3. Export clean data

**Guiding Principles:**
- **Zero Cognitive Load**: Users shouldn't have to think
- **Instant Clarity**: Every screen tells you exactly what to do next
- **Minimal Steps**: Remove every unnecessary click
- **Forgiving**: Easy to fix mistakes, hard to break things
- **Progressive Simplicity**: Start simple, reveal complexity only when needed

---

## 🔥 Critical Problems to Solve

### Current State Analysis

| Problem | Impact | User Feeling |
|---------|--------|--------------|
| **4 ways to create project** | Confusion | "Which button do I click?" |
| **Icon-only buttons** | Hidden actions | "Where's the export button?" |
| **Forced test execution** | Loss of control | "Wait, I didn't want to run yet!" |
| **5 separate pages for results** | Context switching fatigue | "Where did I see that job again?" |
| **Terminology chaos** | Mental overhead | "What's the difference between these?" |
| **No undo for delete** | Fear of mistakes | "What if I delete the wrong thing?" |
| **Completion card disappears** | Lost information | "What was my success rate again?" |

---

## ✨ The Streamlined Flows

---

## FLOW 1: INSTANT START - "From CSV to Running in 3 Clicks"

### Current Flow (12 steps, 3 minutes)
```
Home → Projects → Create Project → Enter name → Enter instructions →
Save → Project Detail → New Batch → Upload CSV → Name batch →
Create → Auto-starts test → Wait...
```

### New Flow (3 steps, 30 seconds)
```
1. Drop CSV anywhere
2. Confirm detection
3. Click "Start Test"
```

### Detailed Design

#### **Step 1: Universal Drop Zone**

**ANY page accepts CSV drop** - No navigation needed

```
┌─────────────────────────────────────────────────────┐
│  Drop CSV file here to start extracting data        │
│                                                      │
│         [📄 Drag & Drop CSV]                        │
│              or click to browse                      │
│                                                      │
│  Example: customers.csv with website URLs           │
└─────────────────────────────────────────────────────┘
```

**Instant Analysis (< 2 seconds):**
- ✅ 247 websites detected in "url" column
- ✅ 3 ground truth columns detected (name, email, phone)
- ⚡ Ready to extract in 5 seconds

#### **Step 2: Smart Defaults with Escape Hatch**

```
┌──────────────────────────────────────────────────┐
│  ✅ Ready to Extract                              │
│                                                   │
│  🎯 Extract from 247 websites                    │
│  📊 Compare against 3 fields (name, email, phone)│
│  ⚡ Test on 10 sites first (recommended)         │
│                                                   │
│  [Start Test Run (10 sites)]  [Advanced Setup ↓] │
│                                                   │
│  ⏱️ Estimated: 2-3 minutes                       │
│  💰 Cost: ~$0.50                                 │
└──────────────────────────────────────────────────┘

Advanced Setup (collapsed):
┌──────────────────────────────────────────────────┐
│  📝 Batch Name: customers_2025_01_15            │
│  📁 Project: [Create New ↓] Default Project      │
│  🎯 Instructions: (optional)                     │
│     Extract contact information...               │
│                                                   │
│  🔧 Column Mapping:                              │
│     url → Target Website ✓                       │
│     name → Expected Name (Ground Truth) ✓        │
│     email → Expected Email (Ground Truth) ✓      │
│     phone → Expected Phone (Ground Truth) ✓      │
│                                                   │
│  [Remap Columns]                                 │
└──────────────────────────────────────────────────┘
```

**Key Improvements:**
- Default project created automatically (no manual naming)
- Batch name auto-generated from filename + date
- Instructions optional (AI can infer from column names)
- Advanced options collapsed, but easily accessible
- Cost and time estimates upfront
- "Test first" is the default, but not forced

#### **Step 3: Live Progress (Zero Config)**

Automatically navigates to unified monitoring view:

```
┌──────────────────────────────────────────────────┐
│  Test Run: customers_2025_01_15                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  40% complete (4/10 sites) • 1m 15s remaining   │
│                                                   │
│  ✅ 3 perfect  ⚠️ 1 partial  ⏳ 5 running  ❌ 0 failed│
│                                                   │
│  Live Feed:                                       │
│  ┌────────────────────────────────────────────┐ │
│  │ 🔄 amazon.com                               │ │
│  │    Extracting contact information... 45%    │ │
│  │    [Screenshot preview]                     │ │
│  └────────────────────────────────────────────┘ │
│                                                   │
│  ✅ walmart.com - 100% match ✓                  │
│  ✅ target.com - 100% match ✓                   │
│  ⚠️  bestbuy.com - 67% match (missing phone)    │
│                                                   │
│  [⏸️ Pause]  [Results ↓]  [Live View →]         │
└──────────────────────────────────────────────────┘
```

**Key Improvements:**
- Single unified view (no separate pages)
- Prominent progress indicator
- At-a-glance status (not buried in table)
- Live feed shows recent activity (not all jobs)
- Inline results preview
- Results table collapsed by default

---

## FLOW 2: RESULTS CLARITY - "Instant Understanding, Zero Hunting"

### Current Flow (Fragmented)
```
Jobs Table (10 columns) + Expanded Rows + Job Detail Page +
Execution Results Page + Analytics Page = Information Chaos
```

### New Flow (Single Unified View)

```
┌────────────────────────────────────────────────────────┐
│  Test Complete! 🎉                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                         │
│  💯 80% Perfect (8/10)  ⚠️ 20% Needs Review (2/10)     │
│                                                         │
│  What's Next?                                           │
│  [Run All 247 Sites] [Fix Issues First] [Export Data]  │
│                                                         │
│  ▼ Review Results (2 need attention)                   │
│                                                         │
│  🔴 bestbuy.com - Missing phone number                 │
│     Expected: (555) 123-4567                           │
│     Found: —                                            │
│     [View Page] [Retry] [Mark as OK]                   │
│                                                         │
│  🟡 homedepot.com - Name mismatch                      │
│     Expected: Home Depot Inc.                          │
│     Found: The Home Depot                              │
│     [View Page] [Retry] [Accept This]                  │
│                                                         │
│  ✅ 8 perfect matches (hide)                           │
└────────────────────────────────────────────────────────┘
```

### Unified Results View Design

**Instead of 5 pages, ONE view with 3 tabs:**

#### Tab 1: "Quick Review" (Default)
- Shows ONLY items needing attention
- Each item has inline actions
- Perfect matches hidden by default
- Click to expand for details

#### Tab 2: "All Results"
- Smart filtered table (virtualized for 1000+)
- Filters: All • Perfect • Partial • Failed • Running
- Quick actions: Select → Retry/Delete/Export
- Inline editing of ground truth
- Expandable rows for full comparison

#### Tab 3: "Insights" (Only if GT exists)
- Overall accuracy score
- Field-by-field breakdown
- Common error patterns
- Trend over time (if multiple runs)

**Key Improvements:**
- Default view shows ONLY what needs attention
- Actions are inline, no navigation needed
- Progressive disclosure: hide what's working
- Single page, no context switching
- Completion card NEVER disappears

---

## FLOW 3: POWERFUL ACTIONS - "Do Things Without Thinking"

### Current Issues
- Export hidden behind icon
- Bulk actions only appear after selection
- Individual actions in hover menus
- No undo for destructive actions

### New Design: Action Bar (Always Visible)

```
┌────────────────────────────────────────────────────────┐
│  Actions:                                               │
│  [Export All ↓] [Retry Failed] [Run Full (237 left)]   │
│                                                         │
│  With selected (0): [Retry] [Delete] [Export] [Tag]    │
│                                                         │
│  Quick Export Templates:                                │
│  • CSV - All data (default)                            │
│  • CSV - Perfect matches only                          │
│  • Excel - With comparison columns                     │
│  • JSON - API format                                   │
│  • Custom export... (for power users)                  │
└────────────────────────────────────────────────────────┘
```

**Key Improvements:**
- Actions always visible (no hunting)
- Text labels, not icons
- Smart defaults (most common = 1 click)
- Bulk action bar appears IN PLACE (not as separate toolbar)
- Export templates instead of configuration form

### Smart Confirmations

**Instead of generic "Are you sure?" dialogs:**

```
Delete 15 jobs?

This will:
❌ Remove 15 jobs from results
💾 Keep original CSV data unchanged
⚠️  Can't be undone

[Cancel] [Delete Jobs]
```

**For safe actions, NO confirmation:**
- Export: Just download
- Retry: Undo available
- Mark reviewed: Toggleable

---

## FLOW 4: ZERO-SETUP START - "No Forms, Just Smart Defaults"

### Current: Project + Batch Creation (2 forms, 8 fields)

### New: Instant Creation

**When user drops CSV:**

```javascript
// Auto-create with zero input
project = {
  name: "Project " + currentDate,  // "Project Jan 15, 2025"
  instructions: inferFromColumns(csv),  // AI-generated
}

batch = {
  name: filename + "_" + timestamp,  // "customers_20250115_143022"
  project: project.id,
  autoDetected: true
}

// User can rename later with inline edit
```

**Visual Indicator:**

```
┌──────────────────────────────────────────────────────┐
│  📁 Project Jan 15, 2025 / customers_20250115        │
│     [✏️ Rename]                                       │
│                                                       │
│  📝 Auto-generated instructions:                      │
│  "Extract name, email, and phone from websites"      │
│     [✏️ Edit instructions]                            │
└──────────────────────────────────────────────────────┘
```

**Key Improvements:**
- ZERO required fields
- Everything has smart defaults
- Rename anytime with inline edit
- AI generates instructions from CSV structure
- Can run immediately without naming anything

---

## FLOW 5: MISTAKE-PROOF DESIGN - "Easy to Fix, Hard to Break"

### Undo System

**Every destructive action has undo for 30 seconds:**

```
┌────────────────────────────────────────────────────┐
│  ✅ Deleted 5 jobs                                  │
│  [Undo]  • Disappears in 28s                       │
└────────────────────────────────────────────────────┘
```

**Undo Buffer:**
- Stores last 10 actions
- Available for 30 seconds each
- Shows countdown timer
- One-click restore

### Safe Defaults

**Instead of confirmation dialogs, make actions safe:**

| Action | Old Behavior | New Behavior |
|--------|-------------|--------------|
| Delete job | Permanent | Soft delete, 30s undo |
| Stop execution | Loses progress | Pause instead, resume later |
| Edit GT | Loses original | Keep version history |
| Retry job | Overwrites | Creates new attempt, keeps old |
| Export | Confusing options | Smart template, preview first |

### Clear Affordances

**Visual language that shows what's safe:**

```
[Export CSV]          ← Safe, reversible
[Start Test Run]      ← Safe, can stop
[Run All (247 sites)] ← Shows count, pauseable
[Delete Forever]      ← Red, shows consequences
```

---

## FLOW 6: GUIDED DISCOVERY - "Learn as You Go"

### Empty States That Teach

**Instead of:** "No data to display"

**Show:**

```
┌────────────────────────────────────────────────────┐
│  Your First Data Extraction                         │
│                                                     │
│  1. Drop a CSV file with website URLs              │
│  2. We'll extract data automatically               │
│  3. Compare against your expected values (optional)│
│                                                     │
│  [Drop CSV to Start] or try [Example Dataset]      │
│                                                     │
│  💡 Tip: Include columns for expected values       │
│     (e.g., expected_email, expected_phone)         │
│     to validate extraction accuracy                │
└────────────────────────────────────────────────────┘
```

### Contextual Tooltips

**Appear on hover, disappear on action:**

```
[Start Test Run (10 sites)]
    ↑
    💡 Tests on 10 random sites first
       Recommended before full run
       Takes ~2-3 minutes
```

### Progressive Onboarding

**First-time user path:**

1. **Drop CSV** → See instant analysis
   - Tooltip: "We detected 247 URLs automatically"

2. **Click Start Test** → See live progress
   - Tooltip: "Watch extraction in real-time"

3. **Review results** → See comparison
   - Tooltip: "Green = perfect match, Yellow = check this"

4. **Export or run full** → Complete flow
   - Tooltip: "Export anytime, even during runs"

**After 3 uses:** All tooltips auto-hide (user is proficient)

---

## 🎨 VISUAL DESIGN SYSTEM

### Color-Coded Status Language

**Instant recognition without reading:**

```
🟢 Green = Perfect (95-100% match)
🟡 Yellow = Review needed (60-94% match)
🔴 Red = Failed (< 60% or error)
🔵 Blue = Running (in progress)
⚪ Gray = Pending (queued)
```

### Size = Importance Hierarchy

```
Large buttons = Primary actions (Start, Export)
Medium buttons = Secondary actions (Retry, View)
Small buttons = Tertiary actions (Edit, Delete)
Text links = Navigation (View details, See more)
```

### Spacing for Breathing Room

**Not dense for density's sake:**

- Important info = Generous space
- Related items = Grouped tight
- Unrelated items = Clear separation

---

## 📊 INFORMATION ARCHITECTURE

### Before: 4-Level Hierarchy (Confusing)

```
Dashboard
  ↓
Projects
  ↓
Batches (within project)
  ↓
Jobs (within batch)
  ↓
Executions (of batch)
  ↓
Analytics (for batch)
```

**Problems:**
- User gets lost navigating 6 levels
- Unclear when to use which level
- Information fragmented across pages

### After: 2-Level Hierarchy (Clear)

```
Home (Dashboard)
  ↓
Extraction Run (unified view)
```

**How it works:**

#### Level 1: Home
- Shows all recent extractions
- Quick actions: Start new, view recent
- Unified search across everything

#### Level 2: Extraction Run
- Everything about ONE extraction
- Tabs: Progress → Results → Insights
- All actions available here
- No need to navigate deeper

**Projects/Batches become tags, not navigation:**

```
┌────────────────────────────────────────────────┐
│  customers_20250115                             │
│  📁 Project: Marketing Data  🏷️ Tags: urgent   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  [Progress] [Results] [Insights]                │
└────────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Critical Path (Week 1-2) 🔥
**Goal: New user can extract data in 3 clicks**

1. **Universal CSV Drop Zone**
   - Modify layout to accept drops anywhere
   - Build instant analysis engine
   - Show smart defaults with preview

2. **Unified Progress View**
   - Merge running mode + results into one page
   - Build "items needing attention" filter
   - Add inline actions

3. **Quick Export**
   - Remove export configurator
   - Add export templates
   - One-click CSV download

**Validation:**
- Time to first extraction: < 3 minutes
- User confusion rate: < 10%
- Completion rate: > 80%

### Phase 2: Safety & Confidence (Week 3)
**Goal: Users trust the system and don't fear mistakes**

4. **Undo System**
   - Implement soft deletes
   - Add 30-second undo buffer
   - Show countdown timers

5. **Smart Confirmations**
   - Replace generic confirmations
   - Show consequences clearly
   - Make safe actions instant

6. **Inline Editing**
   - Rename projects/batches inline
   - Edit ground truth inline
   - Edit instructions inline

**Validation:**
- Delete anxiety: Measured via heatmaps/recordings
- Retry rate: Should increase (users feel safe experimenting)
- Error recovery success: > 95%

### Phase 3: Clarity & Understanding (Week 4)
**Goal: Users always know what's happening and why**

7. **Simplified IA**
   - Flatten to 2 levels
   - Make projects/batches tags
   - Unified search/navigation

8. **Empty States & Onboarding**
   - Teach through empty states
   - Add contextual tooltips
   - Progressive disclosure

9. **Visual Design Polish**
   - Color-coded status system
   - Size = importance hierarchy
   - Generous spacing

**Validation:**
- Task completion time: 30% faster
- Support tickets: 50% reduction
- User satisfaction: > 4.5/5

### Phase 4: Power User Features (Week 5+)
**Goal: Advanced users can work faster**

10. **Keyboard Shortcuts**
    - j/k navigation
    - Bulk selection shortcuts
    - Quick actions (r=retry, d=delete)

11. **Saved Views & Templates**
    - Save filter combinations
    - Export templates
    - Instruction templates

12. **Advanced Features**
    - Column mapping UI
    - Bulk editing
    - Custom validation rules

---

## 📏 SUCCESS METRICS

### Primary Metrics (Must Improve)

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Time to First Extraction** | ~8 min | < 3 min | User flow tracking |
| **Completion Rate** | ~60% | > 85% | Funnel analysis |
| **User Confusion** | ~35% | < 10% | Session recordings |
| **Actions per Task** | ~18 clicks | < 8 clicks | Event tracking |
| **Support Tickets** | Baseline | -50% | Support system |

### Secondary Metrics (Nice to Have)

| Metric | Target |
|--------|--------|
| User Satisfaction (NPS) | > 50 |
| Feature Discovery | > 70% use export/retry |
| Return Users | > 60% within 7 days |
| Referral Rate | > 20% |

---

## 🎯 SPECIFIC UI CHANGES

### Component-Level Changes

#### 1. TopNav Simplification
**Remove:**
- ❌ Multiple nav items (Projects, Batches)
- ❌ Search (move to home)
- ❌ Complex dropdown menus

**Keep:**
- ✅ Logo (home link)
- ✅ User menu (profile, settings, logout)
- ✅ Notifications (with badge count)
- ✅ [Start New] button (universal CSV drop trigger)

#### 2. Sidebar → Hidden by Default
**Replace sidebar navigation with:**
- Cmd+K search (finds anything)
- Recent extractions (home page)
- Tags/filters (instead of project tree)

**Access sidebar:**
- Hover on left edge (auto-expand)
- Click hamburger icon
- Use keyboard shortcut (Cmd+B)

#### 3. Unified Dashboard Page
**Replace:**
- Projects page
- Project detail page
- Batch dashboard page
- Jobs table page
- Execution results page

**With ONE page:**

```
┌─────────────────────────────────────────────────┐
│  MINO                            [Start New ↓]   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Recent Extractions                              │
│  [All] [Running] [Completed] [Needs Review]     │
│                                                  │
│  🔵 customers_20250115 - Running (40%)          │
│  ━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░                │
│  4/10 sites • 1m 15s left                        │
│  [View Live] [Pause]                            │
│                                                  │
│  ⚠️  suppliers_20250114 - Needs review (3)      │
│  80% match • 3 items need attention             │
│  [Review] [Export]                              │
│                                                  │
│  ✅ vendors_20250113 - Complete                 │
│  95% match • 247 sites                          │
│  [View Results] [Export] [Re-run]               │
│                                                  │
│  🔴 partners_20250112 - Failed                  │
│  Connection error • 0/50 completed              │
│  [Retry] [View Error]                           │
│                                                  │
│  [Load More]                                     │
└─────────────────────────────────────────────────┘
```

#### 4. Extraction Run Page (Single View)

**Tab 1: Progress (during run)**
```
┌─────────────────────────────────────────────────┐
│  customers_20250115                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  40% • 4/10 sites • 1m 15s left                 │
│                                                  │
│  ✅ 3 perfect  ⚠️ 1 review  ⏳ 5 running  ❌ 0    │
│                                                  │
│  Live Feed ▼                                     │
│  Recent Activity ▼                               │
│  All Jobs ▼                                      │
│                                                  │
│  [Pause] [Stop] [Adjust Speed]                  │
└─────────────────────────────────────────────────┘
```

**Tab 2: Results (after completion)**
```
┌─────────────────────────────────────────────────┐
│  Test Complete! 🎉  80% perfect (8/10)          │
│                                                  │
│  What's next?                                    │
│  [Run All 237 Sites] [Export] [Fix Issues]      │
│                                                  │
│  ⚠️  Review These (2) ▼                          │
│  ✅ Perfect Matches (8) ▼ [collapsed]           │
│                                                  │
│  [Filters: All • Perfect • Review • Failed]     │
└─────────────────────────────────────────────────┘
```

**Tab 3: Insights (with ground truth)**
```
┌─────────────────────────────────────────────────┐
│  Overall: 80% Match Quality                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                  │
│  Field Performance:                              │
│  name:  ████████████ 100% (10/10)              │
│  email: ██████████░░  90% (9/10)               │
│  phone: ████████░░░░  70% (7/10)               │
│                                                  │
│  Common Issues:                                  │
│  • Phone numbers missing from 3 sites           │
│  • Email format differences (2 cases)           │
│                                                  │
│  [Detailed Report] [Export Analysis]            │
└─────────────────────────────────────────────────┘
```

---

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### Database Changes Required

**Soft Deletes:**
```sql
ALTER TABLE jobs ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN deleted_by UUID;

CREATE TABLE action_history (
  id UUID PRIMARY KEY,
  action_type VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id UUID,
  user_id UUID,
  undo_data JSONB,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

### API Changes Required

**New Endpoints:**
- `POST /api/actions/undo` - Undo last action
- `GET /api/recent-extractions` - Unified dashboard data
- `POST /api/csv/quick-analyze` - Instant CSV analysis
- `GET /api/export-templates` - List export templates

**Modified Endpoints:**
- `POST /api/batches` - Accept autoCreate param
- `DELETE /api/jobs/:id` - Return undo token
- `POST /api/executions` - Add skipConfirmation option

### Component Changes

**New Components:**
```
components/
  quick-start/
    UniversalDropZone.tsx
    InstantAnalysis.tsx
    SmartDefaults.tsx
  unified-dashboard/
    RecentExtractions.tsx
    ExtractionRunView.tsx
    QuickReviewPanel.tsx
  actions/
    UndoToast.tsx
    ActionBar.tsx
    ExportTemplates.tsx
  onboarding/
    EmptyStates.tsx
    ContextualTooltips.tsx
    FirstRunGuide.tsx
```

**Modified Components:**
```
components/
  navigation/
    TopNav.tsx → Simplified
    LeftSidebar.tsx → Hidden by default
  batch-dashboard/
    UnifiedBatchDashboard.tsx → Merge with ExtractionRunView
  JobsTableV3.tsx → Add inline actions
```

---

## 🎓 USER EDUCATION STRATEGY

### In-App Learning (No External Docs Needed)

1. **Empty States Teach Usage**
   - First time: Full explanation
   - Subsequent: Brief reminder
   - After 3 uses: Minimal

2. **Tooltips on Hover**
   - Appear after 1s hover
   - Dismissible
   - Auto-hide after 3 uses

3. **Success Messages Educate**
   ```
   ✅ Extraction complete!

   💡 Quick tip: Use "Review" filter to see
      only items needing attention

   [Got it]  [Show me →]
   ```

4. **Error Messages Solve Problems**
   ```
   ❌ Failed to detect URLs

   💡 Make sure your CSV has a column named
      "url", "website", or "link"

   [Upload Different CSV]  [Manual Setup]
   ```

### Progressive Skill Building

**Beginner (First 3 uses):**
- Basic flow: CSV → Test → Results → Export
- Learn: Status colors, basic actions

**Intermediate (4-10 uses):**
- Bulk actions
- Ground truth comparison
- Export templates

**Advanced (10+ uses):**
- Keyboard shortcuts
- Custom configurations
- Advanced filtering

---

## 📋 TESTING CHECKLIST

### Usability Testing Script

**Task 1: First Extraction**
- [ ] User finds drop zone without help
- [ ] User understands auto-detected columns
- [ ] User starts test run confidently
- [ ] User monitors progress without confusion

**Task 2: Results Review**
- [ ] User finds items needing attention
- [ ] User understands match percentages
- [ ] User takes corrective action successfully

**Task 3: Export Data**
- [ ] User finds export button
- [ ] User selects appropriate format
- [ ] User gets expected file

**Task 4: Mistake Recovery**
- [ ] User accidentally deletes item
- [ ] User finds and uses undo
- [ ] User confirms recovery worked

### Acceptance Criteria

**Each flow must:**
- ✅ Take < 1 minute to complete
- ✅ Require < 5 clicks
- ✅ Have 0 dead ends (can always go back/undo)
- ✅ Show clear next steps at every point
- ✅ Provide instant feedback for all actions

---

## 🎯 ROLLOUT STRATEGY

### Phase 1: Beta (Internal Testing)
- Team uses new flow for 1 week
- Collect feedback via forms
- Fix critical issues
- Measure metrics baseline

### Phase 2: Alpha (Selected Users)
- Invite 10 power users
- A/B test: 50% old flow, 50% new flow
- Track completion rates
- Iterate based on feedback

### Phase 3: Public Beta (Opt-in)
- Add "Try New Experience" toggle
- Users can switch back anytime
- Collect broader feedback
- Monitor support tickets

### Phase 4: General Release
- Make new flow default
- Keep old flow accessible via flag
- Monitor metrics for 2 weeks
- Remove old flow if successful

---

## 🎨 DESIGN MOCKUPS NEEDED

### High Priority
1. **Universal Drop Zone** - Empty state + Active state + Analyzing state
2. **Unified Dashboard** - Recent extractions list
3. **Extraction Run View** - Progress + Results + Insights tabs
4. **Quick Review Panel** - Items needing attention
5. **Action Bar** - Export templates + Bulk actions
6. **Undo Toast** - Visual design + Countdown timer

### Medium Priority
7. **Smart Defaults Modal** - CSV analysis results
8. **Empty States** - First-time user guidance
9. **Error States** - Helpful error messages
10. **Keyboard Shortcuts** - Overlay/cheatsheet

### Low Priority
11. **Settings Page** - Simplified preferences
12. **Profile Page** - User management
13. **Analytics Dashboard** - Aggregate insights

---

## 💬 TERMINOLOGY STANDARDIZATION

**Say This** | **Not This** | **Why**
---|---|---
Extraction | Batch Execution | More user-friendly
Run | Execution | Simpler
Website | Site URL | Clearer intent
Match Quality | Accuracy | More intuitive
Review | Needs Attention | Action-oriented
Perfect | 95%+ Match | Celebratory
Test Run | Test Execution | Casual
Ground Truth | GT / Expected Values | Professional

---

## 🔮 FUTURE ENHANCEMENTS (Post-Launch)

### Advanced Features (Don't build now)
- Scheduling extractions
- API integration
- Webhook notifications
- Custom validation rules
- Team collaboration
- Role-based access
- Audit logs
- Cost management

### Why Wait?
- Validate core flow first
- Learn actual user needs
- Avoid premature optimization
- Keep initial experience simple

---

## ✅ DEFINITION OF DONE

### Each flow must pass:

**Cognitive Load Test:**
- [ ] New user completes without asking questions
- [ ] No visible confusion in session recordings
- [ ] Task success rate > 85%

**Efficiency Test:**
- [ ] 50% fewer clicks than current flow
- [ ] 30% faster completion time
- [ ] Zero dead ends or back button usage

**Confidence Test:**
- [ ] Users trust the system (use undo < 5% of time)
- [ ] Users explore features (not afraid to click)
- [ ] Users return within 7 days (> 60%)

**Delight Test:**
- [ ] Users express positive emotion (recorded)
- [ ] NPS score > 50
- [ ] Users recommend to others (referral rate > 20%)

---

## 📞 FEEDBACK COLLECTION

### In-App Feedback
- Smile/Frown emoji after each extraction
- "Was this helpful?" after tooltips
- Bug report button (Cmd+Shift+/)

### Analytics Events
```javascript
track('extraction_started', {
  time_from_drop: '15s',
  used_smart_defaults: true,
  clicked_advanced: false
})

track('extraction_completed', {
  completion_time: '2m 30s',
  success_rate: 0.8,
  used_review_panel: true
})

track('user_confused', {
  trigger: 'clicked_back_3_times',
  context: 'results_view'
})
```

### Session Recording Rules
- Record first 5 sessions for each new user
- Record all sessions where user clicks back > 3 times
- Record all sessions where completion takes > 10 min

---

## 🏆 SUCCESS LOOKS LIKE...

**Week 1:**
- 90% of users complete first extraction
- Average time drops from 8min to 4min
- Support tickets: -30%

**Week 4:**
- Average time stabilizes at < 3min
- NPS score reaches 40+
- 50% of users return within 7 days

**Week 12:**
- New flow is default for 100% users
- Old flow removed from codebase
- Team focuses on advanced features

---

## 📚 RESOURCES & REFERENCES

### Design Inspiration
- **Stripe Dashboard**: Unified views, clear actions
- **Vercel**: Zero-config deployments, smart defaults
- **Linear**: Keyboard shortcuts, fast UX
- **Notion**: Progressive disclosure, flexible structure
- **Superhuman**: Speed, efficiency, keyboard-first

### UX Principles Applied
- **Don't Make Me Think** (Steve Krug)
- **The Design of Everyday Things** (Don Norman)
- **Jobs To Be Done** (Clayton Christensen)
- **Progressive Disclosure** (Nielsen Norman Group)
- **Information Foraging** (Jakob Nielsen)

### Implementation Guide
- **Phase 7 Complete**: Performance optimizations ready
- **This Document**: Comprehensive UX plan
- **Next Step**: Build Phase 1 prototypes
- **Timeline**: 5 weeks to full launch

---

**END OF STREAMLINED UX PLAN**

**Status**: Ready for implementation
**Estimated Impact**: 3x faster task completion, 50% fewer support tickets
**Risk Level**: Low (can rollback to old flow anytime)
**Confidence**: High (based on comprehensive analysis)
