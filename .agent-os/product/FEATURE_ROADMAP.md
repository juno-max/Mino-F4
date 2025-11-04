# MINO V2 - COMPREHENSIVE FEATURE ROADMAP

## Overview
This roadmap organizes all MINO features into stage-gated implementation phases. Each stage builds upon existing frontend structure without overwriting page workflows. GT-related features are marked with 🎯.

---

## Current State Assessment

### ✅ Already Implemented (MINO F2)
- Projects CRUD (create, read, update, delete)
- CSV upload with batch creation
- Job creation from CSV rows
- EVA agent integration for web automation
- Session tracking with screenshots
- Job status monitoring (queued, running, completed, error)
- Ground truth data storage in database
- Basic evaluation (pass/fail)
- Results table with filters
- Project/batch navigation
- API routes for all job operations

### 🚧 Partially Implemented
- Ground truth workflow (data stored, UI incomplete)
- Accuracy metrics (calculated, dashboard incomplete)
- Session detail view (exists, GT features missing)
- Instruction versioning (schema exists, UI incomplete)

### ❌ Not Yet Implemented
- Navigation side panel (hierarchical structure)
- Natural language task refinement UI
- Schema generation from instructions
- Real-time execution viewer (4-6 concurrent agents)
- GT setting from session output
- GT editing capabilities
- Accuracy dashboard with charts
- Error pattern analysis UI
- Version comparison UI
- Quick review mode with keyboard shortcuts

---

## NAVIGATION STRUCTURE (Always Visible)

### Feature Set: Hierarchical Side Panel Navigation
**Stage**: Foundation
**Priority**: High
**Complexity**: Medium

#### Components:

**1. Project Selector**
- Collapsible project list with metadata
- Create new project button
- Search/filter projects
- Recent projects prioritized
- **Current**: Basic dropdown selector exists on home page
- **Enhancement**: Full side panel with rich project cards
- **Status**: 🔄 Partial

**2. Project Instructions Panel**
- Inline editing of task instructions
- Natural language input
- Version indicator
- **Current**: Instructions stored, no inline editing
- **Enhancement**: Rich text editor with version history
- **Status**: 🔄 Partial

**3. Batch List Navigation**
- Each CSV upload = new batch
- Batch metadata (rows, upload date, status)
- 🎯 GT-enabled batch indicator: "🎯 GT Available"
- Completion progress per batch
- **Current**: Batches shown in project detail page
- **Enhancement**: Side panel batch list with status icons
- **Status**: 🔄 Partial

**4. Breadcrumb Trail**
- Project → Batch → Session hierarchy
- Click any level to navigate
- Current location highlighted
- **Current**: Basic navigation structure
- **Enhancement**: Visual breadcrumb component
- **Status**: 🔄 Partial

#### Implementation Plan:
```
Phase 1A: Side Panel Component (Week 1)
- Create CollapsibleSidePanel component
- Project list with expand/collapse
- Batch list per project
- Breadcrumb component

Phase 1B: Navigation Intelligence (Week 2)
- Context preservation on navigation
- Smart project suggestions
- Auto-save current state
- Recent projects tracking

Phase 1C: GT Integration (Week 3) 🎯
- GT batch indicator (🎯 icon)
- GT coverage metrics
- Filter batches by GT availability
```

**Database Updates**: None (all data exists)
**API Updates**: None (all endpoints exist)
**UI Updates**: New CollapsibleSidePanel, BreadcrumbNav components

---

## PHASE 1: PROJECT SETUP & CONFIG

### Stage 1.1: Enhanced CSV Upload
**Priority**: High
**Complexity**: Low
**Build Upon**: `/projects/[id]/batches/new` page

#### Features:

**1. Upload Experience Improvements**
- ✅ Drag-and-drop upload (exists)
- ✅ File size and row count display (exists)
- ✅ Instant CSV preview (exists)
- ⚠️ Add: Clear error messages
- ⚠️ Add: Progress indicator for large files

**2. 🎯 GT Column Detection**
- ✅ Auto-detect GT columns (schema tracks this)
- ⚠️ Add: Highlight GT columns in preview with 🎯 icon
- ⚠️ Add: GT coverage summary (e.g., "85% rows have GT")
- ⚠️ Add: Pre-validation: check GT format matches schema

**3. Intelligent Validation**
- ⚠️ Add: Auto-detect column types (URL, email, price, date)
- ⚠️ Add: Validate URLs (404 checks on sample)
- ⚠️ Add: Suggest batch name from filename
- ⚠️ Add: Data quality warnings

**Implementation**:
```typescript
// Enhance existing /app/projects/[id]/batches/new/page.tsx
// Add components:
- GTColumnHighlighter
- DataQualityWarnings
- URLValidator
- BatchNameSuggester

// API enhancement: POST /api/projects/[id]/batches
- Add validation before batch creation
- Return validation warnings
```

**Status**: 🔄 Enhance existing page (don't rebuild)

---

### Stage 1.2: Natural Language Task Description
**Priority**: High
**Complexity**: Medium
**Build Upon**: Project instructions field

#### Features:

**1. Conversational Task Input**
- ⚠️ Add: Rich text editor with formatting
- ⚠️ Add: Template library with examples
- ⚠️ Add: AI interpretation preview: "I understand you want to..."
- ⚠️ Add: Refinement conversation UI

**2. AI-Powered Understanding**
- ⚠️ Add: Parse natural language to structured task
- ⚠️ Add: Extract: goal, required fields, constraints
- ⚠️ Add: Show interpretation preview
- ⚠️ Add: Suggest clarifications for ambiguity

**3. Learning from History**
- ⚠️ Add: Learn from past instructions
- ⚠️ Add: Suggest improvements based on success patterns
- ⚠️ Add: Auto-complete common tasks

**Implementation**:
```typescript
// Enhance project creation/edit forms
// Add components:
- RichTextInstructionEditor
- TemplateLibraryModal
- AIInterpretationPreview
- InstructionHistorySidebar

// New API endpoint:
POST /api/projects/[id]/interpret-instructions
  Request: { instructions: string }
  Response: { interpretation, extractedFields, suggestions }
```

**Status**: ❌ New feature

---

### Stage 1.3: Schema Generation
**Priority**: High
**Complexity**: Medium
**New Feature**: Schema builder UI

#### Features:

**1. 🎯 Auto-generate Schema from GT**
- If GT columns detected: auto-generate matching output schema
- Map GT column names to output field names
- Infer field types from GT data
- **Status**: 🔄 Partial (GT columns tracked, mapping needed)

**2. Visual Schema Builder**
- Field cards (name, type, required/optional)
- Drag to reorder fields
- Schema preview with example values
- Template schemas (Pricing, Contact, Product, etc.)

**3. Schema Intelligence**
- Auto-generate from task description (AI)
- Suggest field types based on task intent
- Learn conventional field names from platform
- Validate schema completeness vs task

**Implementation**:
```typescript
// New page: /projects/[id]/schema
// Components:
- SchemaBuilder (drag-drop field cards)
- FieldEditor (name, type, validation rules)
- SchemaPreview (JSON preview)
- TemplateSelector (pre-built schemas)

// New API endpoints:
POST /api/projects/[id]/schema/generate
  Request: { instructions, gtColumns? }
  Response: { schema, confidence, suggestions }

PATCH /api/projects/[id]/schema
  Request: { schema }
  Response: { schema, validation }
```

**Database Updates**:
```typescript
// Add to projects table:
projects.outputSchema: jsonb // Array of {name, type, required, description}
```

**Status**: ❌ New feature (schema stored in batches currently)

---

### Stage 1.4: Data Preview & Validation
**Priority**: Medium
**Complexity**: Low
**Build Upon**: Batch preview in batch creation

#### Features:

**1. Enhanced Data Preview Table**
- ✅ Show CSV data (exists)
- ⚠️ Add: Input columns highlighted
- ⚠️ Add: Output columns shown (to be filled by agent)
- ⚠️ Add: Validation warnings displayed inline

**2. Column Mapping**
- ⚠️ Auto-map CSV columns to schema fields
- ⚠️ Show mapping confidence scores
- ⚠️ Inline column mapping editor
- ⚠️ Validate required fields present

**3. Data Quality Checks**
- ⚠️ Detect duplicates
- ⚠️ Detect empty values
- ⚠️ Sample data quality score
- ⚠️ Anomaly detection (outliers)

**Implementation**: Enhance existing batch preview component
**Status**: 🔄 Enhance existing

---

### Stage 1.5: Smart Test Run Configuration
**Priority**: High
**Complexity**: Medium
**Build Upon**: Batch execution trigger

#### Features:

**1. Test Run Modal**
- ⚠️ Recommend 20-job test (with rationale)
- ⚠️ Adjustable test size slider
- ⚠️ Cost and time estimates
- ⚠️ "Test X jobs" vs "Run all" options

**2. Intelligent Sampling**
- ⚠️ Select diverse sample (not just first 20)
- ⚠️ Stratified sampling if categories detected
- ⚠️ Include edge cases in sample

**3. Pre-flight Checks**
- ⚠️ Validate URLs accessible
- ⚠️ Check project instructions complete
- ⚠️ Verify schema configured
- ⚠️ Estimate cost and time

**4. Auto-start Countdown**
- ⚠️ 5-second countdown after configuration
- ⚠️ Cancel button during countdown
- ⚠️ Progress indication

**Implementation**:
```typescript
// Add modal component to batch detail page
// Components:
- TestRunConfigModal
- SampleSizeSlider
- CostTimeEstimator
- PreflightCheckList
- CountdownTimer

// API endpoint (existing, enhance):
POST /api/projects/[id]/batches/[batchId]/execute
  Request: { executionType: 'test', sampleSize: 20, samplingStrategy: 'diverse' }
  Response: { executionId, estimatedTime, estimatedCost, jobIds }
```

**Status**: 🔄 Enhance existing execution trigger

---

## PHASE 2: INITIAL AHA MOMENT

### Stage 2.1: Real-Time Execution Viewer
**Priority**: High
**Complexity**: High
**New Feature**: Live execution dashboard

#### Features:

**1. Split-Screen Concurrent View**
- Show 4-6 agents working simultaneously
- Live status streaming (WebSocket)
- Each agent card shows:
  - Current URL
  - Last action performed
  - Next step preview
  - Progress indicator

**2. Live Control Panel**
- "Stop All" button
- "Pause" button
- Individual job pause/stop
- Concurrency adjustment

**3. Smart Monitoring**
- Early failure detection (pause if 3+ same errors)
- Suggest interventions during execution
- Adaptive rate limiting based on site response

**Implementation**:
```typescript
// New page: /projects/[id]/batches/[batchId]/executions/[executionId]/live
// Components:
- LiveExecutionGrid (4-6 agent cards)
- AgentCard (status, URL, actions, progress)
- ExecutionControls (stop, pause, concurrency)
- FailureAlertModal (suggests interventions)

// WebSocket connection:
ws://api/executions/[id]/stream
  Events: job_started, job_progress, job_completed, job_failed

// API endpoints:
POST /api/executions/[id]/pause
POST /api/executions/[id]/resume
POST /api/executions/[id]/stop
POST /api/executions/[id]/adjust-concurrency
```

**Database Updates**:
```typescript
// Add to executions table:
executions.concurrency: integer
executions.pausedAt: timestamp
```

**Status**: ❌ New feature (current: basic status polling)

---

### Stage 2.2: Live Results Streaming
**Priority**: High
**Complexity**: Medium
**Build Upon**: Home page results table

#### Features:

**1. Real-Time Result Streaming**
- Results appear row-by-row as jobs complete
- WebSocket updates (not polling)
- Status indicators: ✅ Complete, ⚠ Partial, ❌ Failed
- 🎯 Quality indicators (confidence scores)

**2. Anomaly Detection**
- Automatic outlier detection
- Result completeness scoring
- Flag low-confidence results
- Detect result patterns

**3. Smart Column Ordering**
- Most important columns first
- Group related fields
- Hide low-value columns

**4. Quick Actions Per Row**
- [View] - Session detail
- [✓] - Mark as correct
- [✗] - Mark as incorrect
- [★ GT] - Set as ground truth 🎯
- [Retry] - Re-run job

**Implementation**:
```typescript
// Enhance home page (app/page.tsx)
// Add WebSocket connection for live updates
// Add quick action buttons per row
// Add confidence score indicators

// WebSocket:
ws://api/projects/[id]/results-stream
  Events: job_completed, result_added
```

**Status**: 🔄 Enhance existing results table

---

### Stage 2.3: Enhanced Session Detail View
**Priority**: High
**Complexity**: High
**Build Upon**: `/projects/[id]/jobs/[jobId]` page

#### Features:

**1. Session Selection**
- ✅ Default: Latest session (exists)
- ✅ Session dropdown: "View previous attempts" (exists)
- ✅ Screenshot timeline (exists)
- ⚠️ Add: Session comparison mode (side-by-side)

**2. Session Playback**
- ✅ Timeline with timestamped tool calls (exists)
- ✅ Screenshots for each major step (exists)
- ⚠️ Add: Tool call explanations (AI-generated)
- ⚠️ Add: Agent decision reasoning

**3. 🎯 Ground Truth Setting (NEW)**
- Select subset or full JSON output as GT
- "Set as GT ★" button
- Manual GT editing: Edit selected GT values field-by-field
- GT appears with ⭐ icon in results table
- Track GT source (selected_from_session, manually_edited)

**4. Comparison Views**
- ✅ Side-by-side: Expected vs Actual (partially exists)
- ⚠️ Add: Highlight differences
- ⚠️ Add: Confidence scores per extraction
- ⚠️ Add: Match tool calls to screenshots by timestamp

**5. Business Logic Transparency**
- ⚠️ Add: Show agent reasoning for every action
- ⚠️ Add: Evidence-based confidence scoring
- ⚠️ Add: Explain why specific data was extracted

**Implementation**:
```typescript
// Enhance /app/projects/[id]/jobs/[jobId]/page.tsx
// Add components:
- GTSelector (select fields for GT)
- GTEditor (inline field editing)
- SessionComparison (side-by-side sessions)
- ToolCallExplanation (AI reasoning)
- ConfidenceScoreDisplay

// New API endpoints:
POST /api/jobs/[id]/set-ground-truth
  Request: { sessionId, selectedFields, source: 'selected_from_session' }
  Response: { job, gtData }

PATCH /api/jobs/[id]/edit-ground-truth
  Request: { updates, reason }
  Response: { job, gtEditHistory }

GET /api/sessions/[id]/explanations
  Request: {}
  Response: { toolCallExplanations, reasoningChain }
```

**Database Updates**:
```typescript
// Add to jobs table:
jobs.gtSource: text // 'csv_upload' | 'selected_from_session' | 'manually_edited' | 'quick_review'
jobs.gtEditHistory: jsonb // Array of {editedAt, changes, reason}
jobs.gtCreatedAt: timestamp

// Add to sessions table:
sessions.toolCallExplanations: jsonb // AI-generated reasoning per tool call
```

**Status**: 🔄 Major enhancement to existing page

---

### Stage 2.4: Quick Analytics Dashboard
**Priority**: Medium
**Complexity**: Medium
**Build Upon**: Home page stats section

#### Features:

**1. Test Results Summary**
- ✅ Success breakdown: Complete/Partial/Failed (exists)
- ✅ Time and cost summary (partially exists)
- ⚠️ Add: 🎯 Per-field accuracy (if GT exists)
- ⚠️ Add: Common failure patterns

**2. Suggested Next Steps**
- ⚠️ Auto-assess test quality
- ⚠️ Compare to similar projects
- ⚠️ Recommend: scale vs refine vs retry
- ⚠️ Predict full dataset performance

**3. Pattern Analysis**
- ⚠️ Identify failure patterns
- ⚠️ Group similar errors
- ⚠️ Suggest refinements

**Implementation**: Enhance stats cards on home page
**Status**: 🔄 Enhancement

---

## PHASE 3: DATA EVALUATION & REFINEMENT

### Stage 3.1: Quick Review Mode
**Priority**: High
**Complexity**: Medium
**Build Upon**: Home page results table

#### Features:

**1. Keyboard-Driven Review**
- [→] Next result
- [←] Previous result
- [✓] Mark correct
- [✗] Mark incorrect
- [★] Set as GT 🎯
- [R] Retry job
- [ESC] Exit review mode

**2. Review Queue**
- Prioritize low-confidence results
- Skip high-confidence successes
- Progress tracking
- Resume where left off

**3. Side-by-Side Review**
- Result on left
- Source screenshot on right
- Quick marking actions

**4. Learning from Corrections**
- Detect patterns in user corrections
- Auto-suggest GT from correct marks 🎯
- Learn marking behavior

**Implementation**:
```typescript
// Enhance home page with review mode
// Components:
- ReviewModeOverlay (keyboard shortcuts UI)
- ReviewQueueManager (prioritized list)
- SideBySideReviewer (result + screenshot)
- KeyboardShortcutHandler

// API endpoints:
POST /api/jobs/[id]/mark
  Request: { mark: 'correct' | 'incorrect', reason? }
  Response: { job }

POST /api/jobs/[id]/set-gt-from-review
  Request: { source: 'quick_review' }
  Response: { job, gtData }
```

**Status**: ❌ New feature

---

### Stage 3.2: Conversational Refinement
**Priority**: High
**Complexity**: High
**New Feature**: Instruction refinement UI

#### Features:

**1. Natural Language Iteration**
- "What to improve?" input field
- User describes problems (not edit prompts)
- AI translates to instruction updates
- Instruction diff preview (before/after)

**2. Dry Run Testing**
- Test changes on sample jobs (3-5 jobs)
- See predicted outcomes
- Impact preview before applying

**3. Version Management**
- Create named versions
- Track accuracy impact per version
- Rollback capability
- Version comparison

**4. Refinement Suggestions**
- AI-powered suggestions based on failures
- Common refinement shortcuts
- Learn from user corrections

**Implementation**:
```typescript
// New page: /projects/[id]/refine
// Components:
- RefinementInput (natural language)
- InstructionDiffViewer (before/after)
- DryRunPreview (test on samples)
- VersionManager (history + rollback)
- SuggestionCards (AI recommendations)

// API endpoints:
POST /api/projects/[id]/refine
  Request: { refinementRequest: string, createVersion: boolean }
  Response: { updatedInstructions, diff, versionId }

POST /api/projects/[id]/dry-run
  Request: { instructionChanges, sampleJobIds }
  Response: { predictedResults, estimatedAccuracy }

POST /api/projects/[id]/rollback
  Request: { versionId }
  Response: { project, restoredInstructions }
```

**Database Updates**:
```typescript
// Enhance instruction_versions table:
instructionVersions.versionName: text
instructionVersions.createdVia: text // 'manual' | 'ai_suggested' | 'conversational_refine'
instructionVersions.refinementRequest: text // Original user request
```

**Status**: ❌ New feature

---

### Stage 3.3: Version Control & Comparison
**Priority**: Medium
**Complexity**: Medium
**Build Upon**: Instruction versions schema

#### Features:

**1. Version History Panel**
- All instruction versions with metadata
- Created date, author, accuracy impact
- Version naming and descriptions
- Annotations per version

**2. Side-by-Side Comparison**
- Instruction diff view
- Performance comparison (accuracy, time, cost)
- Highlight changes
- See which specific changes helped

**3. Performance Trending**
- Line chart: Accuracy over versions
- Identify best version
- Track improvement trajectory
- Recommend best version

**4. One-Click Rollback**
- Restore previous version
- Confirm impact before rollback
- Track rollback reasons

**Implementation**:
```typescript
// New page: /projects/[id]/versions
// Components:
- VersionHistoryList
- VersionComparisonView
- AccuracyTrendChart
- RollbackConfirmModal

// API endpoints (enhance existing):
GET /api/projects/[id]/versions
  Response: Array of versions with metrics

GET /api/projects/[id]/versions/compare
  Request: { versionA, versionB }
  Response: { diff, metricsComparison }
```

**Status**: 🔄 Schema exists, UI missing

---

### Stage 3.4: Preview Changes Before Rerun
**Priority**: Medium
**Complexity**: Medium
**New Feature**: Change impact preview

#### Features:

**1. Before/After Preview Modal**
- Predicted outcomes vs current
- Show sample results
- Impact estimate

**2. Dry Run Mode**
- Test on 3-5 sample jobs
- Run new instructions without saving
- Compare to previous results

**3. Selective Rerun Options**
- Rerun all jobs
- Rerun only failed jobs
- Rerun specific subset
- Cost/time estimates per option

**4. Change Impact Analysis**
- AI predicts impact of instruction changes
- Confidence in predictions
- Risk assessment
- Recommend approach

**Implementation**: Modal component in refinement workflow
**Status**: ❌ New feature

---

### Stage 3.5: Scale Decision Point
**Priority**: Low
**Complexity**: Low
**New Feature**: Scale decision modal

#### Features:

**1. Scale Decision Modal**
- Understand current test quality
- Get recommendation (refine more vs scale)
- Risk assessment
- Phased rollout option

**2. Confidence-Based Recommendations**
- Warn if test quality insufficient (<85% accuracy)
- Suggest phased approach for large datasets
- Estimate full dataset accuracy
- Safety checks before full run

**3. Phased Rollout**
- Start with 50 jobs → 100 → full
- Continuous monitoring
- Auto-pause if accuracy drops

**Implementation**: Modal after test execution
**Status**: ❌ New feature

---

## PHASE 4: GROUND TRUTH EVALUATION 🎯

> **Note**: All Stage 4 features are GT-related. See GT_FEATURES_ROADMAP.md for detailed implementation plan.

### Stage 4.1: Set Ground Truth (Multiple Pathways)
**Priority**: Critical
**Complexity**: High
**Pathways**: 5 different ways to set GT

See GT_FEATURES_ROADMAP.md → Stage 2 for full details

**Summary**:
1. Bulk Upload (CSV) - ✅ Implemented
2. Select from Session JSON - ❌ Not implemented
3. Manual Edit - ❌ Not implemented
4. Quick Review ([★] key) - ❌ Not implemented
5. Click-to-Set - ❌ Not implemented

---

### Stage 4.2: Run Evaluation Against Ground Truth
**Priority**: Critical
**Complexity**: High

See GT_FEATURES_ROADMAP.md → Stage 1 & 4 for full details

**Key Features**:
- Automatic evaluation on GT creation
- Result-level indicators (✓ Match, ≈ Close, ✗ Mismatch)
- Field-level accuracy breakdown
- Fuzzy matching
- Context-aware comparison

---

### Stage 4.3: Accuracy Dashboard (GT-based)
**Priority**: High
**Complexity**: Medium

See GT_FEATURES_ROADMAP.md → Stage 3 for full details

**Key Features**:
- Accuracy overview cards
- Per-field accuracy breakdown
- Version comparison chart
- Error pattern analysis
- Improvement recommendations

---

## PERSISTENT FEATURES (All Stages)

### Search & Filter (All Views)
**Priority**: Medium
**Complexity**: Low

**Features**:
- Universal search across projects/batches/sessions
- Filter by status, date, accuracy
- Save filter presets
- Fuzzy search with typo tolerance

**Implementation**: Enhance existing filter UI
**Status**: 🔄 Basic filters exist

---

### Export & Integration (All Stages)
**Priority**: Medium
**Complexity**: Low

**Features**:
- Export to CSV, JSON, Excel
- 🎯 Export with GT columns
- Select columns to export
- API access for integrations

**Implementation**: Add export buttons with format options
**Status**: ❌ Not implemented

---

## INTELLIGENT BEHAVIORS (Cross-Cutting)

### Context Awareness
- Remember current project, batch, view preferences
- Preserve scroll position and filters on navigation
- Smart defaults based on user history
- Adapt UI based on GT availability

### Progressive Disclosure
- Show complexity only when needed
- Start simple, expand to advanced
- Hide GT features until GT exists
- Adaptive interface based on user expertise

### Anticipatory Intelligence
- Suggest next steps based on current state
- Warn before expensive operations
- Auto-detect issues before execution
- Proactive recommendations

### Learning & Adaptation
- Learn from user corrections and preferences
- Improve suggestions over time
- Adapt to user's domain
- Platform-wide learning from common patterns

---

## IMPLEMENTATION STAGING PLAN

### Foundation Stage (Weeks 1-3)
**Goal**: Navigation & core UX improvements

**Features**:
1. Hierarchical side panel navigation
2. Breadcrumb trail
3. Enhanced CSV upload with GT detection 🎯
4. Data preview improvements
5. Basic GT setting from session JSON 🎯

**Deliverables**:
- Side panel navigation working
- GT indicators visible throughout app
- Users can set GT from session output

---

### Enhancement Stage (Weeks 4-6)
**Goal**: Execution experience & GT workflows

**Features**:
1. Real-time execution viewer
2. Live results streaming
3. Enhanced session detail view
4. GT editing capabilities 🎯
5. Quick review mode with keyboard shortcuts
6. GT evaluation engine 🎯

**Deliverables**:
- Live execution monitoring
- 5 pathways for GT creation working
- Automatic evaluation on GT set

---

### Intelligence Stage (Weeks 7-9)
**Goal**: AI-powered refinement & analytics

**Features**:
1. Conversational refinement UI
2. Natural language instruction updates
3. Accuracy dashboard 🎯
4. Version comparison with metrics
5. Error pattern analysis 🎯
6. Improvement recommendations 🎯

**Deliverables**:
- Users refine instructions conversationally
- Accuracy dashboard with detailed metrics
- AI-powered suggestions working

---

### Polish Stage (Weeks 10-12)
**Goal**: Advanced features & optimization

**Features**:
1. Fuzzy matching for GT evaluation 🎯
2. Context-aware comparison 🎯
3. Advanced filtering & search
4. Export functionality
5. Performance optimizations
6. Mobile responsiveness

**Deliverables**:
- Sophisticated evaluation logic
- Complete export features
- Production-ready performance

---

## STAGE GATES & ROLLBACK

### Gate Criteria Per Stage:
- ✅ All features in stage working
- ✅ Tests passing (>80% coverage)
- ✅ Performance acceptable (<2s page loads)
- ✅ User acceptance testing passed
- ✅ No critical bugs

### Rollback Strategy:
Each stage is independently deployable. If a stage fails:
1. Disable feature flags for new features
2. Keep existing data in database
3. Revert UI changes via git
4. Database migrations are additive (no data loss)

### Feature Flags:
```typescript
// config/features.ts
export const features = {
  sidePanel: true,
  liveExecution: false, // Toggle new features
  gtEditing: false,
  conversationalRefine: false,
  fuzzyMatching: false,
}
```

---

## SUCCESS METRICS

### Foundation Stage:
- ✅ 90%+ users successfully navigate via side panel
- ✅ GT detection accuracy >95%
- ✅ GT setting from session works in <5 seconds

### Enhancement Stage:
- ✅ Live execution viewer load time <2 seconds
- ✅ Users set GT via 3+ pathways
- ✅ Evaluation runs in <1 second for 100 jobs

### Intelligence Stage:
- ✅ Users improve accuracy by 15%+ using AI suggestions
- ✅ Conversational refinement success rate >80%
- ✅ Accuracy dashboard loads in <2 seconds

### Polish Stage:
- ✅ Fuzzy matching reduces false negatives by 30%+
- ✅ Export success rate >95%
- ✅ Mobile usability score >80

---

## SUMMARY

**Total Features**: 50+ features across 4 phases
**Timeline**: 12 weeks (3 weeks per stage)
**GT Features**: 15 features marked with 🎯
**Build Approach**: Enhance existing pages, don't rebuild
**Stage Gates**: User acceptance + tests + performance
**Rollback**: Feature flags + additive migrations

**Key Principles**:
1. **Build upon existing structure** - Don't remove/overwrite pages
2. **Stage-gated deployment** - Can roll back each stage independently
3. **GT features clearly marked** - Easy to identify GT-specific work
4. **User workflows preserved** - Navigation and page structure maintained
5. **Additive database changes** - No destructive migrations

See **GT_FEATURES_ROADMAP.md** for detailed GT-specific implementation.
