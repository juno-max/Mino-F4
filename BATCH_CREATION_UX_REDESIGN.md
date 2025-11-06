# Batch Creation UX Redesign - Comprehensive Plan

## Analysis of Current Issues (From Screenshots)

### Screenshot 1: Projects Page
**Problems Identified:**
1. **Static Data**: Projects show "0 jobs" and "0% ✗" - not dynamic/real-time
2. **Disconnected Flow**: No clear path to create batch from project view
3. **Unclear Actions**: "+" Create button doesn't specify what it creates (Project? Batch?)
4. **Redundant Views**: Sidebar and main content show same projects
5. **Missing Context**: Cards don't show workflow instructions
6. **No Batch Creation Entry**: Users can't easily upload CSV to existing project

### Screenshot 2: Workflow Instruction Panel
**Good Elements:**
- Clear sections (Overview, Input Parameters, Navigation Rules, etc.)
- Visual hierarchy with green tags
- Structured format for complex instructions
- JSON output example

**Missing Elements:**
- No way to apply this to batch creation
- Not integrated into project/batch flow
- No templates or quick-start options

---

## User Jobs to Be Done (JTBD)

### Primary JTBD
1. **Upload CSV to start extraction** (Most common - 80% of use cases)
   - Quick: Use existing project + workflow
   - Medium: Use existing project, modify workflow
   - Advanced: Create new project + new workflow

2. **View/manage extraction progress** (Real-time monitoring)
   - See jobs running
   - Monitor success/failure rates
   - Identify issues quickly

3. **Review and export results** (Final deliverable)
   - See what was extracted
   - Validate against ground truth
   - Export in desired format

### Secondary JTBD
4. Configure workflow for specific use case
5. Organize extractions by project/client
6. Reuse successful workflows
7. Troubleshoot failed extractions

---

## Proposed Solution: Unified Batch Creation Flow

### Design Principle
**Progressive Disclosure + Smart Defaults + Context Awareness**

---

## Component Architecture

### 1. Unified Batch Upload Component
**Location**: Accessible from Projects page, Project detail page, Batch list page

**States**:
```
┌─────────────────────────────────────────┐
│  Drop CSV or Click to Upload            │
│  [📁 Drop zone - prominent]             │
└─────────────────────────────────────────┘
              ↓ (CSV uploaded)
┌─────────────────────────────────────────┐
│  ✓ customers.csv (250 rows)             │
│  ├─ URL column: "website"               │
│  ├─ Ground truth: "email", "phone"      │
│  └─ Est. time: 15 min | Cost: ~$12     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Assign to Project                       │
│  [Dropdown with context]                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Workflow Instructions                   │
│  [Inherited or Custom]                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  [Start Test Run]  [Start Full Run]     │
└─────────────────────────────────────────┘
```

---

## Detailed UX Design

### Phase 1: CSV Upload (Universal Entry Point)

**Component**: `BatchUploadDrawer.tsx`

**Trigger Locations**:
1. Projects page: "+ Create" → "Upload CSV" option
2. Project detail page: "+ New Batch" button (context-aware)
3. Quick-start page: Already exists
4. Global: Cmd+U keyboard shortcut

**Visual Design**:
```tsx
┌─────────────────────────────────────────────────────┐
│  Create New Extraction                          [×] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📁 Drop CSV file here or click to browse          │
│  ┌───────────────────────────────────────────┐    │
│  │                                            │    │
│  │         [Upload Icon]                      │    │
│  │                                            │    │
│  │    Drag and drop your CSV file here       │    │
│  │         or click to browse                 │    │
│  │                                            │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  💡 Your CSV should include:                       │
│  • A column with website URLs                      │
│  • Optional: Expected values for validation        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Phase 2: Project Selection (Context-Aware)

**Smart Defaults**:
- If opened from project page → Pre-select that project
- If opened from projects list → Show project selector
- If opened from quick-start → Show project selector with "Create New" option

**Component**: `ProjectSelector.tsx`

```tsx
┌─────────────────────────────────────────────────────┐
│  ✓ customers.csv analyzed (250 websites)           │
│  └─ Detected: email, phone columns                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Assign to Project                                  │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │ 📁 Wellness Pricing Extraction         ▼  │    │
│  └───────────────────────────────────────────┘    │
│       ↳ Will use project's workflow by default     │
│                                                     │
│  Or create new project:                            │
│  ┌───────────────────────────────────────────┐    │
│  │ + Create New Project                       │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  [Previous]              [Next: Configure] ──────→ │
└─────────────────────────────────────────────────────┘
```

**Dropdown Options**:
```tsx
┌─────────────────────────────────────────┐
│  Recent Projects                         │
├─────────────────────────────────────────┤
│  📁 Wellness Pricing Extraction          │
│     └─ Last used: 2 hours ago           │
│                                          │
│  📁 Expedia Test                         │
│     └─ Last used: Yesterday             │
├─────────────────────────────────────────┤
│  All Projects                            │
├─────────────────────────────────────────┤
│  📁 Affirm Test                          │
│  📁 Contact Extraction                   │
│  📁 Lead Generation                      │
├─────────────────────────────────────────┤
│  + Create New Project                    │
└─────────────────────────────────────────┘
```

---

### Phase 3: Workflow Configuration (Inherited + Editable)

**Component**: `WorkflowConfigPanel.tsx`

**Default Behavior**:
- If project selected → Load project's workflow
- If new project → Show AI-generated workflow based on CSV columns
- Show diff if modifying existing workflow

```tsx
┌─────────────────────────────────────────────────────┐
│  Workflow Instructions                          [×] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Using workflow from: Wellness Pricing Extraction  │
│  [Edit] [View Full Details]                        │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │ Overview                                   │    │
│  │                                             │    │
│  │ Navigate wellness provider website to      │    │
│  │ extract original pricing for specified     │    │
│  │ service at given location.                 │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  📊 Input Parameters                               │
│  Business URL • Business Name • Location           │
│  City • Service Name                               │
│                                                     │
│  ⚙️ Extraction Settings                            │
│  Class id • Venue_id • Price • Currency            │
│                                                     │
│  🧭 Navigation Rules                               │
│  Max 5 pages • No revisits • Alt path on timeout   │
│                                                     │
│  ▼ Advanced Settings (collapsed)                   │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         │
│                                                     │
│  Options:                                          │
│  ○ Use this workflow (recommended)                 │
│  ○ Customize for this batch                        │
│  ○ Create new workflow                             │
│                                                     │
│  [Previous]         [Start Test Run (10)] ──────→  │
└─────────────────────────────────────────────────────┘
```

**Edit Mode** (when "Edit" clicked):
```tsx
┌─────────────────────────────────────────────────────┐
│  Edit Workflow                                  [×] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Overview                                           │
│  ┌───────────────────────────────────────────┐    │
│  │ [Edit text area with current instructions]│    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  Input Parameters                                   │
│  ┌───────────────────────────────────────────┐    │
│  │ Business URL ×  Business Name ×           │    │
│  │ Location ×  City ×  Service Name ×        │    │
│  │ [+ Add parameter]                          │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  Navigation Rules                                   │
│  ┌───────────────────────────────────────────┐    │
│  │ Max pages: [5]  Timeout: [30s]            │    │
│  │ ☑ No revisits  ☑ Alt path on timeout      │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  💾 Save Options:                                   │
│  ○ Apply to this batch only                        │
│  ● Update project workflow (recommended)            │
│                                                     │
│  [Cancel]  [Save & Continue] ────────────────────→ │
└─────────────────────────────────────────────────────┘
```

---

### Phase 4: Final Review & Start

**Component**: `BatchConfirmation.tsx`

```tsx
┌─────────────────────────────────────────────────────┐
│  Ready to Start                                 [×] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ✓ CSV: customers.csv (250 websites)               │
│  ✓ Project: Wellness Pricing Extraction            │
│  ✓ Workflow: Wellness pricing extraction v2        │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│                                                     │
│  Batch Details                                      │
│  Name: customers_20251106_082104 [edit]            │
│  Description: [Optional]                            │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│                                                     │
│  💰 Estimated Cost: $12.50                         │
│  ⏱️ Estimated Time: 15 minutes                     │
│  🎯 Success Rate: ~92% (based on project history)  │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│                                                     │
│  Start Options:                                     │
│                                                     │
│  ┌─────────────────────────────────────────┐      │
│  │ 🧪 Test Run (10 websites)               │      │
│  │ Recommended to verify quality first      │      │
│  │                                          │      │
│  │ [Start Test Run] ──────────────────────→ │      │
│  └─────────────────────────────────────────┘      │
│                                                     │
│  ┌─────────────────────────────────────────┐      │
│  │ 🚀 Full Run (all 250 websites)          │      │
│  │ Skip test and run all immediately        │      │
│  │                                          │      │
│  │ [Start Full Run] ──────────────────────→ │      │
│  └─────────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Integration with Projects Page

### Updated Projects Page Layout

```tsx
┌────────────────────────────────────────────────────────────┐
│  Projects (2)          [Search]          [+ Upload CSV]    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Wellness Pricing Extraction               ACTIVE ●  │ │
│  │                                                       │ │
│  │  📊 3 batches  •  2,450 jobs  •  91% success        │ │
│  │                                                       │ │
│  │  Last run: 2 hours ago                               │ │
│  │  ┌────────────┬────────────┬───────────┐            │ │
│  │  │ wellness_  │ pricing_   │ wellness_ │            │ │
│  │  │ Sheet1     │ batch_01   │ test      │            │ │
│  │  │ 10/10 ✓    │ 240/240 ✓  │ 10/10 ✓   │            │ │
│  │  └────────────┴────────────┴───────────┘            │ │
│  │                                                       │ │
│  │  [View Details]  [+ Upload CSV to this project]     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Expedia Test                              ACTIVE ●  │ │
│  │                                                       │ │
│  │  📊 2 batches  •  20 jobs  •  100% success          │ │
│  │                                                       │ │
│  │  Last run: Yesterday                                 │ │
│  │  ┌────────────┬────────────┐                        │ │
│  │  │ affirm_    │ expedia_   │                        │ │
│  │  │ example    │ example    │                        │ │
│  │  │ 10/10 ✓    │ 10/10 ✓    │                        │ │
│  │  └────────────┴────────────┘                        │ │
│  │                                                       │ │
│  │  [View Details]  [+ Upload CSV to this project]     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Key Improvements**:
1. **Dynamic Data**: Show real batch counts, job counts, success rates
2. **Quick Actions**: "+ Upload CSV to this project" button on each card
3. **Visual Batch List**: Show recent batches with progress inline
4. **Contextual Entry**: Direct path to create batch for specific project
5. **Clear Status**: Active indicator, last run time, success metrics

---

## Workflow Instruction Panel Design

### Sidebar/Drawer Format (Inspired by Screenshot 2)

**Component**: `WorkflowInstructionDrawer.tsx`

**When to Show**:
- When viewing project details
- When creating/editing batch
- When troubleshooting failed jobs

```tsx
┌────────────────────────────────────────┐
│  Workflow Instructions            [×]  │
├────────────────────────────────────────┤
│                                        │
│  Overview                              │
│  ┌────────────────────────────────┐   │
│  │ Wellness Pricing Extraction    │   │
│  │                                 │   │
│  │ Navigate wellness provider      │   │
│  │ website to extract original     │   │
│  │ pricing for specified service   │   │
│  │ at given location. Must         │   │
│  │ validate location match and     │   │
│  │ apply best-effort service name  │   │
│  │ matching rules.                 │   │
│  └────────────────────────────────┘   │
│                                        │
│  📊 Input Parameters                   │
│  Business URL ×  Business Name ×       │
│  Location ×  City ×  Service Name ×    │
│                                        │
│  ⚙️ Extraction Settings                │
│  Class id ×  Venue_id ×  Price ×       │
│  Currency ×                            │
│                                        │
│  🧭 Navigation Rules                   │
│  Max 5 pages ×  No revisits ×          │
│  Alt path on timeout ×                 │
│  Invalid site error                    │
│                                        │
│  📍 Location Matching                  │
│  Match City/Location ×                 │
│  Use dropdowns/search                  │
│  Fallback: Any available pricing ×     │
│                                        │
│  🏷️ Service Matching                   │
│  Exact ×  Semantic ×  Price-based ×    │
│  Closest ×                             │
│  Duration check  Sessions check        │
│                                        │
│  💰 Pricing Extraction                 │
│  Click details/add to cart/book ×      │
│  Sum component prices ×                │
│  Extract original price only ×         │
│                                        │
│  📤 Desired JSON Output                │
│  ┌────────────────────────────────┐   │
│  │ {                               │   │
│  │   "currency": "$",              │   │
│  │   "name": "input_name",         │   │
│  │   "original_name": "web_name",  │   │
│  │   "price": "number or empty"    │   │
│  │ }                               │   │
│  └────────────────────────────────┘   │
│                                        │
│  [Edit Workflow]  [Test on Sample]    │
│                                        │
└────────────────────────────────────────┘
```

**Design Features**:
1. **Hierarchical Sections**: Clear organization with icons
2. **Tag-Based Display**: Key settings as dismissible tags
3. **Collapsible Sections**: Hide complexity by default
4. **Code Output**: Show expected format
5. **Quick Actions**: Edit or test without leaving view

---

## Implementation Priority

### Phase 1: Core Flow (Week 1)
1. **`BatchUploadDrawer.tsx`** - Universal CSV upload component
2. **`ProjectSelector.tsx`** - Context-aware project selection
3. **`WorkflowConfigPanel.tsx`** - Workflow inheritance + editing
4. **`BatchConfirmation.tsx`** - Final review before start

### Phase 2: Integration (Week 1-2)
5. Update Projects page with dynamic data
6. Add "+ Upload CSV" buttons to all entry points
7. Connect workflow panel to project/batch pages
8. Add keyboard shortcuts (Cmd+U for upload)

### Phase 3: Polish (Week 2)
9. **`WorkflowInstructionDrawer.tsx`** - Detailed workflow viewer
10. Add batch progress tracking
11. Add real-time updates for job counts
12. Add workflow templates library

---

## Key UX Improvements

### 1. **Progressive Disclosure**
- Start simple (just upload CSV)
- Reveal complexity as needed (edit workflow)
- Smart defaults reduce decisions (use project workflow)

### 2. **Context Awareness**
- Opening from project page → Pre-selects project
- Shows project's workflow automatically
- Estimates based on project history

### 3. **Unified Entry Points**
- Same flow works from any page
- Consistent experience
- Muscle memory builds quickly

### 4. **Clear Feedback**
- Show what will happen before starting
- Estimates for cost, time, success rate
- Review step prevents mistakes

### 5. **Workflow Reusability**
- Projects have workflows
- Batches inherit from projects
- Easy to modify per batch
- Update project workflow option

---

## Success Metrics

### Quantitative
- Time to create batch: < 60 seconds (from 3+ minutes)
- Clicks to start: 4 clicks (from 12+ steps)
- Workflow reuse rate: > 80%
- Error rate: < 5%

### Qualitative
- Users understand project ↔ batch ↔ workflow relationship
- No confusion about where to upload CSV
- Confidence in what will be extracted
- Easy to reuse successful configurations

---

## API Requirements

### New Endpoints Needed

```typescript
// Get project with workflow and recent batches
GET /api/projects/:id/dashboard
Response: {
  project: Project,
  workflow: WorkflowInstructions,
  recentBatches: Batch[],
  stats: { totalJobs, successRate, lastRunTime }
}

// Create batch with project association
POST /api/projects/:id/batches
Body: {
  csvFile: File,
  name?: string,
  workflowOverrides?: Partial<WorkflowInstructions>
}

// Update project workflow
PUT /api/projects/:id/workflow
Body: WorkflowInstructions
```

---

## File Structure

```
components/
  batch-creation/
    BatchUploadDrawer.tsx          # Universal upload entry
    ProjectSelector.tsx            # Smart project picker
    WorkflowConfigPanel.tsx        # Workflow inheritance + edit
    BatchConfirmation.tsx          # Final review
    WorkflowInstructionDrawer.tsx  # Detailed workflow viewer

  projects/
    ProjectCard.tsx                # Enhanced with dynamic data
    ProjectDashboard.tsx           # Project detail view

  workflow/
    WorkflowOverview.tsx           # Readonly display
    WorkflowEditor.tsx             # Edit mode
    WorkflowTemplates.tsx          # Template library

app/
  (authenticated)/
    projects/
      page.tsx                     # Updated with new flow
      [id]/
        page.tsx                   # Project detail with batches
        batches/
          [batchId]/
            page.tsx               # Existing batch view
```

---

## Next Steps

1. Create `BatchUploadDrawer.tsx` component
2. Update Projects page API to return dynamic data
3. Implement project selection with workflow inheritance
4. Add "+ Upload CSV" buttons to all pages
5. Test complete flow end-to-end
6. Gather user feedback
7. Iterate and polish

---

**Status**: Ready to implement 🚀
