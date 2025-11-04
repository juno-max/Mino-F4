# MINO V2 - GROUND TRUTH FEATURES ROADMAP

## Overview
This document separates all Ground Truth (GT) related features from the complete MINO feature set. GT features enable systematic accuracy validation through known-correct reference data.

---

## GT Feature Categories

### Category 1: GT Data Detection & Setup
**Purpose**: Automatically detect and configure ground truth from various sources

#### Features:
1. **Auto-detect GT Columns in CSV Upload** (Stage 1.1)
   - System detects columns with `gt_`, `ground_truth_`, `expected_` prefixes
   - Highlights GT columns in upload preview
   - Validates GT data format matches expected schema
   - **Status**: ✅ Already implemented in current schema

2. **Auto-generate Output Schema from GT** (Stage 1.3)
   - When GT columns detected, automatically generate matching output schema
   - Map GT columns to expected output fields
   - Infer field types from GT data
   - **Status**: 🔄 Partially implemented (GT columns tracked, schema mapping needed)

3. **GT-Enabled Batch Indicator** (Navigation)
   - Show 🎯 icon on batches with GT data
   - Display GT coverage percentage (e.g., "85% have GT")
   - Filter batches by GT availability
   - **Status**: 🔄 Partially implemented (hasGroundTruth flag exists)

---

### Category 2: GT Setting & Management
**Purpose**: Multiple pathways for users to create and manage ground truth data

#### Pathway 1: Bulk CSV Upload
**Description**: Upload CSV with GT columns pre-populated
- Smart column mapping to schema
- GT preview before importing
- Validation against output schema
- **Status**: ✅ Already implemented

#### Pathway 2: Select from Session JSON Output ⭐ NEW
**Description**: Users can select any subset of extracted data as GT
```typescript
// From session detail view:
- View latest session's extractedData JSON
- Select specific fields or entire output
- Click "Set as GT ★" button
- GT appears in results table with ⭐ icon
- Track source: "selected_from_session"
```
**UI Location**: Session detail page (`/projects/[id]/jobs/[jobId]` → session modal)
**Database**: Update `jobs.groundTruthData` + `jobs.gtSource = 'selected_from_session'`
**Status**: ❌ Not implemented

#### Pathway 3: Manual GT Editing ⭐ NEW
**Description**: Edit GT values field-by-field in session detail view
```typescript
// In session detail view:
- Display GT data in editable form
- Inline field-by-field editing
- Schema validation on each field
- Save button updates GT
- Track source: "manually_edited"
```
**UI Location**: Session detail page with edit mode toggle
**Database**: Add `jobs.gtSource` and `jobs.gtEditHistory` JSONB field
**Status**: ❌ Not implemented

#### Pathway 4: Quick Review Mode
**Description**: Press [★] keyboard shortcut during review to mark as GT
```typescript
// During results review:
- User presses [★] key on any result
- Result's extracted data becomes GT
- Visual confirmation with ⭐ icon
- Track source: "quick_review"
```
**UI Location**: Home page results table
**Keyboard**: Add hotkey handler for [★]
**Status**: ❌ Not implemented

#### Pathway 5: Click-to-Set GT
**Description**: Click any result row and select "Set as GT"
```typescript
// On results table:
- Right-click or action menu on any row
- "Set as GT ★" option
- Confirmation modal
- Updates job with GT data
```
**UI Location**: Home page results table context menu
**Status**: ❌ Not implemented

#### GT Management Features:
- **GT Version History**: Track all GT changes over time
- **GT Source Tracking**: Know if GT came from CSV, session, manual edit, etc.
- **GT Validation**: Ensure GT matches output schema
- **GT Coverage Metrics**: Show % of jobs with GT per batch

**Database Schema Updates Needed**:
```typescript
// Add to jobs table:
jobs.gtSource: 'csv_upload' | 'selected_from_session' | 'manually_edited' | 'quick_review' | 'click_to_set'
jobs.gtCreatedAt: timestamp
jobs.gtEditHistory: jsonb // Array of {editedAt, editedBy, changes, source}
```

---

### Category 3: GT-Based Evaluation
**Purpose**: Automatically compare extracted data against ground truth

#### Features:

1. **Automatic Evaluation on GT Creation** (Stage 4.2)
   - When GT is set, immediately evaluate any existing sessions
   - Calculate match percentage per field
   - Overall job accuracy score
   - **Status**: 🔄 Partially implemented (evaluationResult exists, detailed comparison needed)

2. **Result-Level Match Indicators** (Stage 4.2)
   ```
   ✓ Match: Extracted data exactly matches GT
   ≈ Close: Fuzzy match (e.g., $99.99 vs $99.99 USD)
   ✗ Mismatch: Different values
   ```
   - Visual indicators in results table
   - Inline diff view (expected vs actual)
   - **Status**: 🔄 Partially implemented in home page

3. **Field-Level Accuracy Breakdown** (Stage 4.2)
   ```
   Overall: 85%
   ├─ price: 95% (19/20 match)
   ├─ shipping: 90% (18/20 match)
   └─ total: 70% (14/20 match)
   ```
   - Per-column accuracy metrics
   - Identify weakest fields
   - **Status**: ❌ Not implemented

4. **Detailed Mismatch Explanations** (Stage 4.2)
   - AI-generated explanations for each mismatch
   - Pattern detection across failures
   - Suggested fixes
   - **Status**: ❌ Not implemented

5. **Fuzzy Matching for Close Results** (Stage 4.2)
   - Currency normalization ($99 vs $99.00)
   - Text normalization (whitespace, case)
   - Date format variations
   - Unit conversions
   - **Status**: ❌ Not implemented

6. **Context-Aware Comparison** (Stage 4.2)
   - Understand data types (price, date, text)
   - Apply appropriate comparison logic
   - Configurable tolerance levels
   - **Status**: ❌ Not implemented

**Database Schema Updates Needed**:
```typescript
// Add new table for detailed evaluation results:
export const evaluationResults = pgTable('evaluation_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
  overallAccuracy: decimal('overall_accuracy', { precision: 5, scale: 2 }),
  fieldAccuracies: jsonb('field_accuracies').$type<Array<{
    fieldName: string
    isMatch: boolean
    matchType: 'exact' | 'fuzzy' | 'mismatch'
    expected: any
    actual: any
    confidence: number
    explanation: string
  }>>(),
  mismatchExplanations: jsonb('mismatch_explanations'),
  evaluatedAt: timestamp('evaluated_at').defaultNow(),
})
```

---

### Category 4: GT-Based Analytics & Insights
**Purpose**: Provide accuracy metrics and improvement tracking

#### Features:

1. **Quick Analytics Dashboard** (Stage 2.4)
   - Success breakdown: Complete/Partial/Failed
   - Per-field accuracy (if GT exists)
   - Common failure patterns
   - **Status**: 🔄 Partially implemented (stats shown on home page, no per-field breakdown)

2. **Accuracy Dashboard with GT Metrics** (Stage 4.3)
   ```
   ┌─────────────────────────────────────┐
   │ Overall Accuracy: 85%               │
   │ ↑ +15% from last iteration          │
   ├─────────────────────────────────────┤
   │ Per-Field Accuracy:                 │
   │ ████████████░░░░ price: 95%         │
   │ ██████████████░░ shipping: 90%      │
   │ ████████░░░░░░░░ total: 70%         │
   └─────────────────────────────────────┘
   ```
   - Large accuracy percentage display
   - Horizontal bar charts per field
   - Trend indicators
   - **Status**: ❌ Not implemented

3. **Version Comparison with Accuracy** (Stage 4.3)
   - Compare instruction versions side-by-side
   - Show accuracy delta per version
   - Which version performed best on GT
   - **Status**: ❌ Not implemented

4. **Error Pattern Analysis** (Stage 4.3)
   - Group similar errors across jobs
   - Identify systematic issues
   - Suggest instruction improvements
   - **Status**: ❌ Not implemented

5. **Improvement Recommendations** (Stage 4.3)
   - AI-powered suggestions based on GT mismatches
   - Priority ranking (high/medium/low)
   - Expected accuracy improvement estimate
   - **Status**: ❌ Not implemented

**Database Schema Updates Needed**:
```typescript
// Add accuracy metrics tracking table:
export const accuracyMetrics = pgTable('accuracy_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id),
  batchId: uuid('batch_id').references(() => batches.id),
  executionId: uuid('execution_id').references(() => executions.id),
  instructionVersionId: uuid('instruction_version_id').references(() => instructionVersions.id),
  overallAccuracy: decimal('overall_accuracy', { precision: 5, scale: 2 }),
  columnAccuracies: jsonb('column_accuracies').$type<Array<{
    columnName: string
    accuracy: number
    totalSamples: number
    correctCount: number
  }>>(),
  totalJobsEvaluated: integer('total_jobs_evaluated'),
  passCount: integer('pass_count'),
  failCount: integer('fail_count'),
  partialCount: integer('partial_count'),
  createdAt: timestamp('created_at').defaultNow(),
})
```

---

### Category 5: GT-Enhanced User Workflows
**Purpose**: Integrate GT into existing user workflows

#### Features in Existing Workflows:

1. **Home Page (Jobs Dashboard)**
   - Show GT indicator (⭐) for jobs with GT
   - Display evaluation status (pass/fail) in table
   - Inline expected vs actual comparison
   - Quick actions: "Set as GT" button per row
   - **Current Status**: 🔄 Partially implemented

2. **Session Detail View**
   - "Set as GT" button for entire output or selected fields
   - Edit GT button (opens inline editor)
   - Comparison view: Extracted vs GT side-by-side
   - Historic GT versions dropdown
   - **Current Status**: ❌ GT setting not implemented

3. **Quick Review Mode** (Stage 3.1)
   - Keyboard shortcut [★] to set GT
   - Visual confirmation when GT set
   - Skip already-evaluated jobs
   - **Current Status**: ❌ Not implemented

---

## Implementation Priority & Staging

### Stage 1: GT Foundation (Week 1-2)
**Goal**: Enable basic GT setting and evaluation

**Tasks**:
1. Add database schema updates:
   - `jobs.gtSource` column
   - `jobs.gtEditHistory` JSONB column
   - `evaluationResults` table
   - `accuracyMetrics` table

2. Implement Pathway 2: Select from Session JSON
   - UI in session detail modal
   - API endpoint: `POST /api/jobs/[id]/set-ground-truth`
   - Update jobs table with selected GT

3. Basic Evaluation Engine
   - Compare extracted data vs GT (exact match)
   - Calculate per-field accuracy
   - Store in `evaluationResults` table

4. Display Evaluation Results
   - Show ⭐ icon for jobs with GT
   - Display pass/fail badge
   - Inline expected vs actual comparison

**Deliverables**:
- ✅ Users can set GT from session output
- ✅ Basic evaluation runs automatically
- ✅ Results table shows GT indicators
- ✅ Session detail shows GT comparison

---

### Stage 2: Advanced GT Setting (Week 3-4)
**Goal**: Multiple pathways for GT creation

**Tasks**:
1. Implement Pathway 3: Manual GT Editing
   - Edit mode in session detail
   - Field-by-field editing with validation
   - GT edit history tracking

2. Implement Pathway 4: Quick Review Mode
   - Keyboard shortcuts ([★] for GT)
   - Hotkey handler system
   - Visual confirmation

3. Implement Pathway 5: Click-to-Set GT
   - Context menu on table rows
   - "Set as GT" action
   - Confirmation modal

4. GT Management Features
   - GT version history view
   - GT source indicator badges
   - GT coverage metrics per batch

**Deliverables**:
- ✅ 5 pathways for GT creation working
- ✅ GT source tracking complete
- ✅ GT edit history accessible
- ✅ Quick review keyboard shortcuts functional

---

### Stage 3: GT-Based Analytics (Week 5-6)
**Goal**: Comprehensive accuracy insights

**Tasks**:
1. Accuracy Dashboard
   - Overall accuracy cards
   - Per-field accuracy bar charts
   - Trend indicators

2. Version Comparison
   - Side-by-side instruction versions
   - Accuracy delta per version
   - Best performer highlighting

3. Error Pattern Analysis
   - Group similar mismatches
   - AI-powered pattern detection
   - Suggested fixes

4. Improvement Recommendations
   - AI-generated suggestions
   - Priority ranking
   - Expected impact estimates

**Deliverables**:
- ✅ Accuracy dashboard with detailed metrics
- ✅ Version comparison with GT accuracy
- ✅ Error pattern cards with suggestions
- ✅ Proactive recommendations system

---

### Stage 4: Advanced Evaluation (Week 7-8)
**Goal**: Sophisticated comparison logic

**Tasks**:
1. Fuzzy Matching
   - Currency normalization
   - Text normalization (case, whitespace)
   - Date format variations
   - Unit conversions

2. Context-Aware Comparison
   - Data type detection
   - Appropriate comparison logic per type
   - Configurable tolerance levels

3. Detailed Mismatch Explanations
   - AI-generated explanations
   - Visual diff highlighting
   - Suggested instruction updates

4. Continuous Evaluation
   - Re-evaluate on new sessions
   - Track accuracy over time
   - Alert on accuracy degradation

**Deliverables**:
- ✅ Fuzzy matching for close results
- ✅ Context-aware comparison logic
- ✅ Detailed mismatch explanations
- ✅ Continuous evaluation system

---

## API Endpoints for GT Features

### GT Setting
```typescript
POST   /api/jobs/[id]/set-ground-truth
  Body: { source: 'session', sessionId?: string, data: Record<string, any> }

POST   /api/jobs/[id]/edit-ground-truth
  Body: { updates: Record<string, any>, reason?: string }

GET    /api/jobs/[id]/ground-truth-history
  Response: Array of GT changes over time
```

### GT Evaluation
```typescript
POST   /api/jobs/[id]/evaluate
  Body: { sessionId?: string } // If not provided, evaluates latest session
  Response: { accuracy, fieldResults, mismatches }

GET    /api/batches/[id]/accuracy-metrics
  Response: Overall + per-field accuracy for entire batch

GET    /api/projects/[id]/accuracy-trend
  Response: Accuracy over time across all batches
```

### GT Analytics
```typescript
GET    /api/executions/[id]/accuracy-dashboard
  Response: Comprehensive accuracy metrics + charts data

GET    /api/batches/[id]/error-patterns
  Response: Grouped error patterns with suggestions

GET    /api/projects/[id]/recommendations
  Response: AI-powered improvement suggestions based on GT mismatches
```

---

## UI Components for GT Features

### New Components Needed:

1. **GTBadge** - Shows ⭐ icon with tooltip
2. **GTSourceIndicator** - Badge showing where GT came from (CSV, session, manual)
3. **AccuracyProgressBar** - Horizontal bar for per-field accuracy
4. **EvaluationResultCard** - Expected vs Actual side-by-side
5. **GTEditorModal** - Inline field editing for GT data
6. **ErrorPatternCard** - Grouped error with suggestion
7. **AccuracyDashboard** - Full metrics dashboard
8. **VersionComparisonChart** - Line chart showing accuracy over versions
9. **QuickReviewHotkeys** - Keyboard shortcut overlay
10. **GTHistoryTimeline** - Timeline of GT changes

---

## Success Metrics

### Stage 1 Success:
- ✅ 90%+ of users successfully set GT from session output
- ✅ Evaluation runs within 1 second for 100 jobs
- ✅ GT indicators visible and understandable

### Stage 2 Success:
- ✅ Users utilize 3+ pathways for GT creation
- ✅ GT edit history tracked for 100% of changes
- ✅ Quick review keyboard shortcuts used by 50%+ users

### Stage 3 Success:
- ✅ Accuracy dashboard loads in <2 seconds
- ✅ Error patterns detected with 85%+ accuracy
- ✅ Users improve accuracy by 15%+ using recommendations

### Stage 4 Success:
- ✅ Fuzzy matching reduces false negatives by 30%+
- ✅ Mismatch explanations rated as helpful by 80%+ users
- ✅ Continuous evaluation catches accuracy degradation within 24 hours

---

## Dependencies & Blockers

### Technical Dependencies:
- ✅ Database schema supports JSONB for flexible GT data
- ✅ Session execution captures extracted data
- ⚠️ Need AI service for error pattern analysis
- ⚠️ Need AI service for improvement recommendations

### UI Dependencies:
- ✅ Session detail modal exists
- ✅ Results table supports inline comparison
- ⚠️ Need keyboard shortcut system
- ⚠️ Need context menu component

### Business Logic Dependencies:
- ✅ Execution engine produces structured output
- ⚠️ Need comparison logic library (fuzzy matching, normalization)
- ⚠️ Need evaluation scoring algorithm

---

## Testing Strategy

### Unit Tests:
- Comparison logic (exact, fuzzy, context-aware)
- Accuracy calculation algorithms
- GT validation rules

### Integration Tests:
- GT setting via all 5 pathways
- Evaluation trigger on GT creation
- Accuracy metrics aggregation

### E2E Tests:
- User sets GT from session → sees evaluation result
- User edits GT → re-evaluation triggered
- User compares versions → accuracy deltas shown

### Performance Tests:
- Evaluate 1000 jobs in <10 seconds
- Accuracy dashboard loads in <2 seconds
- Real-time evaluation during execution

---

## Rollback Plan

Each stage is independent and can be rolled back without affecting previous stages:

1. **Stage 1 Rollback**: Disable GT setting UI, keep data in database
2. **Stage 2 Rollback**: Disable advanced pathways, keep basic "Set GT" button
3. **Stage 3 Rollback**: Hide analytics dashboard, keep raw data
4. **Stage 4 Rollback**: Fall back to exact matching, disable fuzzy logic

Database migrations are additive (no columns removed), so rollback is safe.

---

## Future Enhancements (Post-Stage 4)

### GT Collaboration:
- Team members can propose GT changes
- Approval workflow for GT updates
- GT change notifications

### GT Intelligence:
- Auto-suggest GT from high-confidence results (95%+ confidence)
- Learn from user corrections over time
- Predict which jobs need GT most urgently

### GT Export:
- Export GT data separately as CSV
- Import GT from external sources
- Sync GT with external databases

---

## Summary

**Ground Truth Features** enable systematic accuracy validation through:
- **5 pathways** for GT creation (CSV, session, manual, review, click)
- **Automatic evaluation** comparing extracted vs expected
- **Detailed analytics** showing per-field accuracy and trends
- **Smart recommendations** for improving instructions based on mismatches

**Implementation Timeline**: 8 weeks across 4 stages
**Database Impact**: 3 new tables, 3 column additions
**API Impact**: 9 new endpoints
**UI Impact**: 10 new components

**Current Status**: Foundation exists (GT data stored, basic evaluation), advanced features need implementation.
