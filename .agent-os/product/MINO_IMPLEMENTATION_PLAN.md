# MINO V2 - STAGED IMPLEMENTATION PLAN

> **Current Status**: MINO F2 (MVP) completed and deployed. This plan outlines V2 feature development.
>
> **Reference Documents**:
> - **FEATURE_ROADMAP.md** - All features organized by phase with priorities
> - **GT_FEATURES_ROADMAP.md** - Ground truth features only (15 features, 4 stages)
> - **MINO_MVP_SPEC.md** - Product specification and design system

## Project Overview

**Mission**: Enhance MINO V2 with advanced GT workflows, real-time execution monitoring, AI-powered refinement, and comprehensive accuracy analytics.

**Duration**: 12 weeks (4 stages × 3 weeks each)
**Team**: 1-2 developers using Claude Code + Cursor
**Approach**: Stage-gated deployment with rollback capability at each stage
**Build Strategy**: Enhance existing pages and components, don't rebuild from scratch

---

## Current State (MINO F2 Baseline)

### ✅ Infrastructure Complete
- Next.js 14 with App Router
- TypeScript with strict mode
- Tailwind CSS with fintech design system
- Drizzle ORM + PostgreSQL (Supabase)
- EVA Agent integration for web automation
- All core API routes operational

### ✅ Database Schema Complete
```typescript
// Existing tables:
- projects (with instructions)
- batches (with columnSchema, csvData, hasGroundTruth, groundTruthColumns)
- jobs (with groundTruthData, csvRowData, evaluationResult, isEvaluated)
- sessions (with extractedData, screenshots, streamingUrl)
- executions (with status tracking)
- instructionVersions (ready for UI)
```

### ✅ Pages & Navigation Complete
```
app/
├── page.tsx                    # Home/Jobs dashboard ✅
├── projects/
│   ├── page.tsx                # Project list ✅
│   ├── new/page.tsx            # Create project ✅
│   └── [id]/
│       ├── page.tsx            # Project detail ✅
│       ├── jobs/[jobId]/page.tsx  # Job/session detail ✅
│       └── batches/
│           ├── new/page.tsx    # CSV upload ✅
│           ├── [batchId]/page.tsx  # Batch detail ✅
│           └── [batchId]/executions/[executionId]/page.tsx  # Execution detail ✅
```

### 🚧 Enhancement Needed
- Navigation: Side panel for project/batch hierarchy
- GT Setting: UI for 5 pathways (CSV works, session/manual/review/click missing)
- Evaluation: Advanced comparison logic (exact match works, fuzzy/context-aware missing)
- Analytics: Dashboard visualization (metrics calculated, UI missing)
- Refinement: Conversational instruction updates (versioning works, AI suggestions missing)

---

## Technology Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library
- **ESLint 9** for code quality

### Backend
- **PostgreSQL** (via Supabase)
- **Drizzle ORM** for type-safe database operations
- **Node.js 20+** runtime

### Infrastructure
- **GitHub** for version control
- **Vercel** for deployment
- **Sentry** for error tracking

### Authentication
- **Supabase Auth** with Google OAuth
- No username/password - DB schema handles OAuth sessions
- Row Level Security (RLS) for data isolation

### Development Tools
- **pnpm** for package management
- **git** with descriptive commits
- **Claude Code** for agentic development
- **Cursor** for interactive coding

---

## Design Principles

### Visual Design
- **Minimal, functional, practical** - Enterprise-grade interface
- **Intentional use of color** - Trust blue, validation green, attention orange
- **Warmer tones** - Professional but approachable
- **Inspired by enterprise SaaS** - Notion, Linear, Asana patterns

### User Experience
- **Professional tone** - Business language, not consumer app
- **Respect user expertise** - Users teach, Mino learns
- **Systematic validation** - Ground truth before production
- **Transparent learning** - Show accuracy, confidence, reasoning
- **Progressive disclosure** - Complexity reveals with proficiency

---

## V2 Implementation Stages (Stage-Gated Approach)

> **Key Principle**: Build upon existing structure. Enhance, don't rebuild. Each stage can be rolled back independently.

---

### STAGE 1: FOUNDATION (Weeks 1-3)
**Goal**: Navigation improvements & basic GT workflow

#### Database Migrations
```sql
-- Add GT source tracking
ALTER TABLE jobs ADD COLUMN gt_source TEXT;
ALTER TABLE jobs ADD COLUMN gt_edit_history JSONB;
ALTER TABLE jobs ADD COLUMN gt_created_at TIMESTAMP;

-- Add evaluation results table
CREATE TABLE evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  overall_accuracy DECIMAL(5,2),
  field_accuracies JSONB,
  mismatch_explanations JSONB,
  evaluated_at TIMESTAMP DEFAULT NOW()
);

-- Add accuracy metrics table
CREATE TABLE accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  batch_id UUID REFERENCES batches(id),
  execution_id UUID REFERENCES executions(id),
  instruction_version_id UUID REFERENCES instruction_versions(id),
  overall_accuracy DECIMAL(5,2),
  column_accuracies JSONB,
  total_jobs_evaluated INTEGER,
  pass_count INTEGER,
  fail_count INTEGER,
  partial_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Features to Build
1. **Navigation Side Panel**
   - Create `CollapsibleSidePanel` component
   - Project selector with metadata
   - Batch list with GT indicators (🎯)
   - Breadcrumb trail component
   - **Files to Modify**:
     - `app/layout.tsx` - Add side panel wrapper
     - New: `components/CollapsibleSidePanel.tsx`
     - New: `components/BreadcrumbNav.tsx`

2. **Enhanced CSV Upload**
   - Highlight GT columns with 🎯 icon in preview
   - GT coverage summary
   - Data quality warnings
   - **Files to Modify**:
     - `app/projects/[id]/batches/new/page.tsx`
     - New: `components/GTColumnHighlighter.tsx`

3. **GT Setting from Session JSON (Pathway 2)**
   - "Set as GT ★" button in session detail
   - Field selector for partial GT
   - Track GT source
   - **Files to Modify**:
     - `app/projects/[id]/jobs/[jobId]/page.tsx`
     - New: `components/GTSelector.tsx`
     - New API: `POST /api/jobs/[id]/set-ground-truth`

4. **Basic Evaluation Engine**
   - Compare extracted data vs GT (exact match)
   - Calculate per-field accuracy
   - Store in evaluation_results table
   - **Files to Create**:
     - `lib/evaluation/compare.ts`
     - New API: `POST /api/jobs/[id]/evaluate`

5. **Display Evaluation Results**
   - ⭐ icon for jobs with GT
   - Pass/fail badge
   - Inline expected vs actual
   - **Files to Modify**:
     - `app/page.tsx` (home dashboard)

#### API Routes to Create/Modify
```typescript
POST   /api/jobs/[id]/set-ground-truth          // NEW
POST   /api/jobs/[id]/evaluate                  // NEW
GET    /api/projects/[id]/navigation-data       // NEW - for side panel
```

#### Testing
- Unit: GT setting, evaluation logic
- Integration: Set GT → evaluate → show result
- E2E: User sets GT from session, sees pass/fail in table

#### Success Criteria
- ✅ Side panel navigation working
- ✅ Users can set GT from session output in <10 seconds
- ✅ Evaluation runs in <1 second for 100 jobs
- ✅ GT indicators visible throughout app
- ✅ All tests passing

#### Rollback Plan
- Feature flag: `features.gtFromSession = false`
- Database migrations are additive (no data loss)
- UI reverts to previous navigation

---

### STAGE 2: ENHANCEMENT (Weeks 4-6)
**Goal**: Multiple GT pathways & live execution viewer

#### Features to Build
1. **GT Pathway 3: Manual Editing**
   - Edit mode in session detail
   - Field-by-field editing with validation
   - GT edit history tracking
   - **Files to Modify**:
     - `app/projects/[id]/jobs/[jobId]/page.tsx`
     - New: `components/GTEditor.tsx`
     - New API: `PATCH /api/jobs/[id]/edit-ground-truth`

2. **GT Pathway 4: Quick Review Mode**
   - Keyboard shortcuts system ([★] for GT)
   - Review queue with prioritization
   - Side-by-side reviewer
   - **Files to Modify**:
     - `app/page.tsx`
     - New: `components/ReviewModeOverlay.tsx`
     - New: `components/KeyboardShortcutHandler.tsx`
     - New API: `POST /api/jobs/[id]/set-gt-from-review`

3. **GT Pathway 5: Click-to-Set**
   - Context menu on table rows
   - "Set as GT" action
   - Confirmation modal
   - **Files to Modify**:
     - `app/page.tsx`
     - New: `components/ContextMenu.tsx`

4. **Live Execution Viewer**
   - 4-6 agent cards in grid
   - WebSocket connection for real-time updates
   - Stop/pause controls
   - **Files to Create**:
     - `app/projects/[id]/batches/[batchId]/executions/[executionId]/live/page.tsx`
     - New: `components/LiveExecutionGrid.tsx`
     - New: `components/AgentCard.tsx`
     - WebSocket: `ws://api/executions/[id]/stream`

5. **Live Results Streaming**
   - WebSocket for result updates
   - Real-time row insertion
   - Quick action buttons per row
   - **Files to Modify**:
     - `app/page.tsx`
     - WebSocket: `ws://api/projects/[id]/results-stream`

6. **GT Management Dashboard**
   - GT source indicator badges
   - GT coverage metrics per batch
   - GT edit history view
   - **Files to Create**:
     - `app/projects/[id]/ground-truth/page.tsx`
     - New: `components/GTManagementDashboard.tsx`

#### API Routes to Create/Modify
```typescript
PATCH  /api/jobs/[id]/edit-ground-truth         // NEW
POST   /api/jobs/[id]/set-gt-from-review        // NEW
POST   /api/jobs/[id]/mark                      // NEW - mark correct/incorrect
GET    /api/jobs/[id]/ground-truth-history      // NEW
POST   /api/executions/[id]/pause               // NEW
POST   /api/executions/[id]/resume              // NEW
WS     /api/executions/[id]/stream              // NEW - WebSocket
WS     /api/projects/[id]/results-stream        // NEW - WebSocket
```

#### Testing
- Unit: Each GT pathway, keyboard shortcuts
- Integration: All 5 pathways → GT set → evaluation
- E2E: User reviews jobs with [★] key, sees GT set
- Load: Live execution with 100 concurrent jobs

#### Success Criteria
- ✅ All 5 GT pathways working
- ✅ Users utilize 3+ pathways
- ✅ Live execution viewer loads in <2 seconds
- ✅ WebSocket updates <500ms latency
- ✅ Quick review keyboard shortcuts working

#### Rollback Plan
- Feature flags: `features.gtEditing = false`, `features.liveExecution = false`
- Keep Pathway 1 & 2 from Stage 1
- Fall back to polling if WebSocket fails

---

### STAGE 3: INTELLIGENCE (Weeks 7-9)
**Goal**: AI-powered refinement & analytics

#### Features to Build
1. **Accuracy Dashboard**
   - Large accuracy cards with trends
   - Per-field horizontal bar charts
   - Version comparison
   - **Files to Create**:
     - `app/projects/[id]/accuracy/page.tsx`
     - New: `components/AccuracyDashboard.tsx`
     - New: `components/FieldAccuracyChart.tsx`

2. **Error Pattern Analysis**
   - Group similar mismatches
   - AI-powered pattern detection
   - Suggested fixes
   - **Files to Create**:
     - `lib/ai/pattern-analysis.ts`
     - New: `components/ErrorPatternCard.tsx`
     - New API: `GET /api/batches/[id]/error-patterns`

3. **Conversational Refinement**
   - Natural language refinement input
   - AI translates to instruction updates
   - Instruction diff preview
   - Dry run on samples
   - **Files to Create**:
     - `app/projects/[id]/refine/page.tsx`
     - New: `components/RefinementInput.tsx`
     - New: `components/InstructionDiffViewer.tsx`
     - New: `lib/ai/instruction-refiner.ts`
     - New API: `POST /api/projects/[id]/refine`
     - New API: `POST /api/projects/[id]/dry-run`

4. **Version Comparison**
   - Side-by-side version diff
   - Accuracy delta per version
   - Performance trending chart
   - **Files to Create**:
     - `app/projects/[id]/versions/page.tsx`
     - New: `components/VersionComparisonView.tsx`
     - New: `components/AccuracyTrendChart.tsx`

5. **Improvement Recommendations**
   - AI-generated suggestions based on GT mismatches
   - Priority ranking
   - Expected impact estimates
   - **Files to Create**:
     - `lib/ai/recommendations.ts`
     - New: `components/RecommendationCard.tsx`
     - New API: `GET /api/projects/[id]/recommendations`

#### AI Integration
```typescript
// lib/ai/openai-client.ts
- Pattern analysis: Analyze failures, suggest fixes
- Instruction refinement: Translate natural language to instruction updates
- Mismatch explanations: Explain why extracted data doesn't match GT
- Recommendations: Suggest improvements based on patterns
```

#### API Routes to Create/Modify
```typescript
POST   /api/projects/[id]/refine               // NEW - conversational refinement
POST   /api/projects/[id]/dry-run              // NEW - test changes on samples
GET    /api/batches/[id]/error-patterns        // NEW - grouped errors
GET    /api/projects/[id]/recommendations      // NEW - AI suggestions
GET    /api/projects/[id]/accuracy-trend       // NEW - accuracy over time
GET    /api/executions/[id]/accuracy-dashboard // NEW - full metrics
```

#### Testing
- Unit: AI prompt templates, recommendation logic
- Integration: Refinement → dry run → apply → retest
- E2E: User refines instructions, sees accuracy improve
- AI: Test pattern detection accuracy

#### Success Criteria
- ✅ Accuracy dashboard loads in <2 seconds
- ✅ Error patterns detected with 85%+ accuracy
- ✅ Users improve accuracy by 15%+ using AI suggestions
- ✅ Conversational refinement success rate >80%
- ✅ Version comparison shows clear deltas

#### Rollback Plan
- Feature flag: `features.aiRefinement = false`
- Fall back to manual instruction editing
- Keep accuracy metrics, hide AI recommendations

---

### STAGE 4: POLISH (Weeks 10-12)
**Goal**: Advanced evaluation & production readiness

#### Features to Build
1. **Fuzzy Matching**
   - Currency normalization ($99 vs $99.00)
   - Text normalization (whitespace, case)
   - Date format variations
   - Unit conversions
   - **Files to Create**:
     - `lib/evaluation/fuzzy-match.ts`
     - `lib/evaluation/normalizers.ts`

2. **Context-Aware Comparison**
   - Data type detection
   - Appropriate comparison logic per type
   - Configurable tolerance levels
   - **Files to Modify**:
     - `lib/evaluation/compare.ts`

3. **Detailed Mismatch Explanations**
   - AI-generated explanations
   - Visual diff highlighting
   - Suggested instruction updates
   - **Files to Create**:
     - `lib/ai/mismatch-explainer.ts`
     - New: `components/MismatchExplanation.tsx`

4. **Advanced Filtering & Search**
   - Universal search across all entities
   - Save filter presets
   - Fuzzy search with typo tolerance
   - **Files to Modify**:
     - All list pages (projects, batches, jobs)
     - New: `components/UniversalSearch.tsx`

5. **Export Functionality**
   - Export to CSV/JSON/Excel
   - Include GT columns
   - Select columns to export
   - **Files to Create**:
     - New API: `GET /api/batches/[id]/export`
     - New: `components/ExportModal.tsx`

6. **Performance Optimization**
   - Code splitting
   - Image optimization
   - Database query optimization
   - Caching strategies
   - **Files to Modify**: Various

#### API Routes to Create/Modify
```typescript
GET    /api/batches/[id]/export                // NEW - export results
GET    /api/search                             // NEW - universal search
POST   /api/filters/save                       // NEW - save filter presets
GET    /api/filters                            // NEW - get saved filters
```

#### Testing
- Unit: Fuzzy matching accuracy, normalization logic
- Integration: Fuzzy match reduces false negatives
- E2E: Complete workflow from upload to export
- Performance: Page load times <2s, API <200ms
- Load: 1000+ concurrent users

#### Success Criteria
- ✅ Fuzzy matching reduces false negatives by 30%+
- ✅ Export success rate >95%
- ✅ Universal search returns results in <500ms
- ✅ All pages load in <2 seconds
- ✅ API P95 response time <200ms
- ✅ Test coverage >80%
- ✅ No critical bugs
- ✅ Mobile usability score >80

#### Rollback Plan
- Feature flag: `features.fuzzyMatching = false`
- Fall back to exact matching
- Keep export functionality

---

## Development Workflow (Updated for V2)

### Daily Workflow
1. Pull latest from GitHub
2. Check current stage in FEATURE_ROADMAP.md
3. Implement features for current stage
4. Write tests alongside code
5. Run tests: `npm test`
6. Commit with descriptive messages
7. Push to staging branch
8. Manual QA on staging environment
9. Deploy to production (end of each stage)

### Stage Gate Checklist
Before moving to next stage:
- [ ] All features in current stage implemented
- [ ] All tests passing (>80% coverage)
- [ ] Performance metrics met (<2s page loads, <200ms API)
- [ ] User acceptance testing passed
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Team review completed

### Git Branch Strategy
```
main                  # Production (MINO F2)
├── v2-stage-1        # Foundation stage
├── v2-stage-2        # Enhancement stage
├── v2-stage-3        # Intelligence stage
└── v2-stage-4        # Polish stage
```

### Commit Conventions
```
feat(stage-1): Add side panel navigation
feat(gt): Implement GT setting from session JSON
fix(evaluation): Correct accuracy calculation for partial matches
refactor(nav): Simplify breadcrumb trail component
test(gt): Add E2E tests for GT pathways
docs(api): Update API docs for evaluation endpoints
```

---

## Legacy Implementation Phases (Pre-V2)

> **Note**: The sections below document the original MVP implementation phases and are preserved for historical reference.

### Phase 0: Project Setup & Infrastructure (Week 1) - ✅ COMPLETED

**Goal**: Establish development environment with all core dependencies

#### Tasks:
1. **Initialize Next.js project**
   ```bash
   pnpm create next-app@latest mino-platform --typescript --tailwind --app --src-dir
   ```

2. **Setup Supabase project**
   - Create new project in Supabase dashboard
   - Configure authentication providers (Google OAuth)
   - Set up environment variables

3. **Configure Drizzle ORM**
   - Install dependencies: `drizzle-orm`, `drizzle-kit`, `postgres`
   - Create `drizzle.config.ts`
   - Set up database connection

4. **Install core dependencies**
   ```bash
   pnpm add @supabase/ssr @supabase/supabase-js
   pnpm add drizzle-orm postgres
   pnpm add zod react-hook-form @hookform/resolvers
   pnpm add zustand
   pnpm add date-fns lucide-react
   pnpm add -D drizzle-kit @types/node
   ```

5. **Setup shadcn/ui**
   ```bash
   pnpm dlx shadcn-ui@latest init
   pnpm dlx shadcn-ui@latest add button card input label textarea
   pnpm dlx shadcn-ui@latest add dropdown-menu dialog sheet tabs
   pnpm dlx shadcn-ui@latest add table badge progress separator
   ```

6. **Configure development tools**
   - Setup ESLint 9 configuration
   - Configure Prettier
   - Create `.env.local` template
   - Setup GitHub repository with descriptive commit conventions

7. **Deploy initial project to Vercel**
   - Connect GitHub repository
   - Configure environment variables
   - Test deployment pipeline

**Deliverables**:
- ✅ Next.js project with TypeScript
- ✅ Supabase authentication configured
- ✅ Drizzle ORM connected to database
- ✅ shadcn/ui components installed
- ✅ Development environment ready
- ✅ Deployed to Vercel staging

**Success Criteria**:
- Project builds without errors
- Can authenticate with Google OAuth
- Database connection working
- Deployment pipeline functional

---

### Phase 1: Authentication & Project Management (Week 2)

**Goal**: Users can sign in and create/manage projects with natural language instructions

#### Database Schema:
```typescript
// drizzle/schema/projects.ts
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  instructions: text('instructions').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  archivedAt: timestamp('archived_at'),
});

export const instructionVersions = pgTable('instruction_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  instructions: text('instructions').notNull(),
  versionNumber: integer('version_number').notNull(),
  changeDescription: text('change_description'),
  accuracyImpact: decimal('accuracy_impact', { precision: 5, scale: 2 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### Features:
1. **Authentication Flow**
   - Landing page with "Sign in with Google"
   - Supabase Auth integration
   - Protected routes with middleware
   - User session management

2. **Project Dashboard**
   - List all user projects
   - Project cards with stats (batches, sites, last run)
   - Create new project modal
   - Archive/delete projects

3. **Project Creation**
   - Name and description fields
   - Natural language instructions editor
   - Rich text support for formatting
   - Instruction templates library

4. **Project Settings**
   - Edit project details
   - View instruction history
   - Version control for instructions
   - Export project configuration

#### API Routes:
```
POST   /api/auth/callback        # OAuth callback
GET    /api/projects              # List user projects
POST   /api/projects              # Create project
GET    /api/projects/[id]         # Get project details
PATCH  /api/projects/[id]         # Update project
DELETE /api/projects/[id]         # Delete/archive project
GET    /api/projects/[id]/versions # Get instruction history
```

#### Testing:
- **Unit tests**: Project CRUD operations
- **E2E tests**: Authentication flow, project creation
- **Business logic**: Instruction validation, version tracking

**Deliverables**:
- ✅ Google OAuth authentication
- ✅ Project dashboard with CRUD
- ✅ Instruction version control
- ✅ Protected routes and RLS policies

**Success Criteria**:
- User can sign in with Google
- User can create projects with instructions
- Projects are private to each user (RLS working)
- Instruction changes are tracked

---

### Phase 2: Batch Management & CSV Upload (Week 3)

**Goal**: Users can upload CSV files with URLs and optional ground truth data

#### Database Schema:
```typescript
// drizzle/schema/batches.ts
export const batches = pgTable('batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  csvData: jsonb('csv_data').notNull(), // Array of row objects
  hasGroundTruth: boolean('has_ground_truth').default(false),
  groundTruthColumns: varchar('ground_truth_columns').array(),
  totalSites: integer('total_sites').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

#### Features:
1. **CSV Upload Interface**
   - Drag-and-drop CSV upload
   - Direct URL paste for quick testing
   - CSV parsing and validation
   - Column mapping preview

2. **Ground Truth Detection**
   - Auto-detect GT columns (naming patterns)
   - Manual GT column selection
   - GT data preview and validation
   - Schema inference from CSV structure

3. **Batch Preview**
   - Table view of uploaded data
   - Column statistics (count, unique values)
   - URL validation status
   - Ground truth coverage metrics

4. **Batch Management**
   - List batches within project
   - Batch cards with metadata
   - Edit batch details
   - Delete batches

#### CSV Parsing Logic:
```typescript
// lib/csv/parser.ts
export function parseCSV(file: File): Promise<ParsedCSV> {
  // Parse CSV with Papa Parse
  // Validate required columns (URL)
  // Detect ground truth columns
  // Return structured data
}

export function detectGroundTruthColumns(headers: string[]): string[] {
  // Look for patterns: "GT_", "_ground_truth", "_expected"
  // Return array of detected GT column names
}

export function validateURLs(urls: string[]): ValidationResult {
  // Check URL format
  // Test reachability (optional, rate-limited)
  // Return validation status per URL
}
```

#### API Routes:
```
POST   /api/projects/[id]/batches        # Create batch
GET    /api/batches/[id]                 # Get batch details
PATCH  /api/batches/[id]                 # Update batch
DELETE /api/batches/[id]                 # Delete batch
POST   /api/batches/validate-csv         # Validate CSV before upload
```

#### Testing:
- **Unit tests**: CSV parsing, GT detection, URL validation
- **Integration tests**: Batch creation with various CSV formats
- **Edge cases**: Large CSVs (10K+ rows), malformed data

**Deliverables**:
- ✅ CSV upload with drag-and-drop
- ✅ Ground truth column detection
- ✅ Batch preview and validation
- ✅ Batch management interface

**Success Criteria**:
- Upload CSV with 250+ rows successfully
- Ground truth columns detected automatically
- Invalid URLs flagged before batch creation
- Batch data stored efficiently in JSONB

---

### Phase 3: Workflow Capture Interface (Moment 1) (Week 4)

**Goal**: Users can teach Mino their workflow through screen observation

#### Database Schema:
```typescript
// drizzle/schema/workflows.ts
export const workflowSessions = pgTable('workflow_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  capturedSteps: jsonb('captured_steps').notNull(),
  workflowXml: text('workflow_xml'),
  validationStatus: varchar('validation_status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});
```

#### Features:
1. **Screen Share Setup**
   - Browser screen capture API integration
   - Privacy controls (tab vs. full screen)
   - Recording session initialization
   - Clear consent and privacy messaging

2. **Observation Panel (Split View)**
   - User's browser on left (passthrough)
   - Mino observation panel on right
   - Action counter (not gamified)
   - Optional context annotation tools

3. **Workflow Capture**
   - Detect navigation events
   - Track click interactions
   - Monitor form submissions
   - Extract data collection points
   - Record conditional logic

4. **Context Annotation**
   - Voice note recording (optional)
   - Text annotations on steps
   - Highlight key decision points
   - Explain business logic

5. **Workflow Review**
   - Step-by-step playback
   - Screenshot review for each step
   - Edit/correct captured steps
   - Confirm workflow before saving

#### Screen Capture Integration:
```typescript
// lib/capture/screen-share.ts
export async function initializeScreenCapture(): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { mediaSource: 'screen' },
    audio: false,
  });
  return stream;
}

export class WorkflowRecorder {
  private steps: CapturedStep[] = [];
  
  recordNavigation(url: string): void {
    this.steps.push({
      type: 'navigation',
      url,
      timestamp: Date.now(),
    });
  }
  
  recordClick(element: ElementInfo): void {
    this.steps.push({
      type: 'click',
      element,
      timestamp: Date.now(),
    });
  }
  
  // ... other recording methods
}
```

#### API Routes:
```
POST   /api/workflows/capture/start      # Start capture session
POST   /api/workflows/capture/step       # Record step
POST   /api/workflows/capture/complete   # Complete capture
POST   /api/workflows/validate           # Validate workflow
POST   /api/workflows/save               # Save workflow
```

#### Testing:
- **Unit tests**: Step recording logic, workflow validation
- **Integration tests**: Complete capture flow
- **E2E tests**: User performs workflow, review, save

**Deliverables**:
- ✅ Screen share capture interface
- ✅ Split-screen observation panel
- ✅ Workflow step recording
- ✅ Context annotation tools
- ✅ Workflow review and validation

**Success Criteria**:
- Capture 8-step workflow successfully
- Optional annotations working
- Workflow review shows all steps clearly
- Privacy controls respected

---

### Phase 4: Ground Truth Testing System (Week 5)

**Goal**: Users can test workflows on sample sites and measure accuracy

#### Database Schema:
```typescript
// drizzle/schema/executions.ts
export const executions = pgTable('executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('pending'),
  executionType: varchar('execution_type', { length: 50 }).default('production'),
  totalSites: integer('total_sites').notNull(),
  completedSites: integer('completed_sites').default(0),
  successfulSites: integer('successful_sites').default(0),
  failedSites: integer('failed_sites').default(0),
  accuracyPercentage: decimal('accuracy_percentage', { precision: 5, scale: 2 }),
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const executionResults = pgTable('execution_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').references(() => executions.id, { onDelete: 'cascade' }),
  siteUrl: varchar('site_url', { length: 500 }).notNull(),
  siteName: varchar('site_name', { length: 255 }),
  extractedData: jsonb('extracted_data'),
  groundTruthData: jsonb('ground_truth_data'),
  isAccurate: boolean('is_accurate'),
  matchPercentage: decimal('match_percentage', { precision: 5, scale: 2 }),
  failureReason: text('failure_reason'),
  failureCategory: varchar('failure_category', { length: 100 }),
  executionTimeMs: integer('execution_time_ms'),
  screenshotUrl: text('screenshot_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accuracyMetrics = pgTable('accuracy_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').references(() => executions.id, { onDelete: 'cascade' }),
  columnName: varchar('column_name', { length: 255 }).notNull(),
  totalSites: integer('total_sites').notNull(),
  accurateSites: integer('accurate_sites').notNull(),
  accuracyPercentage: decimal('accuracy_percentage', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### Features:
1. **Test Configuration**
   - Sample size selection (10, 20, 50 sites)
   - Sampling strategy (random, diverse, manual)
   - Cost and time estimates
   - Skip option to go straight to production

2. **Test Execution**
   - Real-time progress tracking
   - Live accuracy metrics
   - Result streaming as sites complete
   - Pause/resume capability

3. **Results Dashboard**
   - Overall accuracy percentage
   - Per-column accuracy breakdown
   - Success/partial/failed counts
   - Execution time statistics

4. **Result Detail View**
   - Side-by-side: Extracted vs. Ground Truth
   - Visual diff highlighting
   - Failure reason explanation
   - Screenshot evidence

5. **Failure Pattern Analysis**
   - Group failures by category
   - Identify common issues
   - Suggest specific fixes
   - Affected sites list

#### Mock Execution (Phase 4 - before real integration):
```typescript
// lib/execution/mock-executor.ts
export async function executeMockWorkflow(
  siteUrl: string,
  groundTruth: Record<string, any>
): Promise<ExecutionResult> {
  // Simulate 1-3 second execution time
  await sleep(randomBetween(1000, 3000));
  
  // Simulate 60-75% baseline accuracy
  const accuracy = Math.random();
  
  if (accuracy < 0.7) {
    // Success - return extracted data matching GT
    return {
      success: true,
      siteUrl,
      extractedData: groundTruth, // Mock perfect extraction
      executionTime: randomBetween(1000, 3000),
    };
  } else if (accuracy < 0.85) {
    // Partial success - some fields wrong
    return {
      success: true,
      siteUrl,
      extractedData: partiallyMatchingData(groundTruth),
      executionTime: randomBetween(1000, 3000),
    };
  } else {
    // Failure
    return {
      success: false,
      siteUrl,
      error: randomFailureReason(),
      executionTime: randomBetween(1000, 3000),
    };
  }
}
```

#### API Routes:
```
POST   /api/batches/[id]/test            # Start test execution
GET    /api/executions/[id]/status       # Get execution status (polling)
GET    /api/executions/[id]/results      # Get all results
GET    /api/executions/[id]/accuracy     # Get accuracy metrics
GET    /api/executions/[id]/patterns     # Get failure patterns
```

#### Testing:
- **Unit tests**: Accuracy calculation, pattern detection
- **Integration tests**: Mock execution pipeline
- **E2E tests**: Complete test → review → decision flow

**Deliverables**:
- ✅ Test configuration interface
- ✅ Mock execution engine (60-75% accuracy)
- ✅ Real-time progress monitoring
- ✅ Results dashboard with metrics
- ✅ Failure pattern analysis

**Success Criteria**:
- Test 10 sites in <2 minutes (mock)
- Accuracy metrics calculated correctly
- Failure patterns grouped logically
- User can identify what needs refinement

---

### Phase 5: Refinement & Iteration Loop (Week 6)

**Goal**: Users can systematically improve accuracy through instruction refinement

#### Database Schema:
```typescript
// drizzle/schema/patterns.ts
export const failurePatterns = pgTable('failure_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').references(() => executions.id, { onDelete: 'cascade' }),
  patternDescription: text('pattern_description').notNull(),
  patternCategory: varchar('pattern_category', { length: 100 }),
  affectedSitesCount: integer('affected_sites_count').notNull(),
  suggestedFix: text('suggested_fix'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### Features:
1. **Refinement Suggestions**
   - AI-powered pattern analysis
   - Specific instruction improvements
   - Priority ranking (high/medium/low)
   - Expected accuracy improvement estimate

2. **Instruction Editor**
   - Side-by-side: Current vs. Updated
   - Highlighted changes with diff view
   - Version comparison
   - Rollback capability

3. **Re-test Workflow**
   - Test on same sample sites
   - Compare accuracy: before vs. after
   - Show improvement delta
   - Iteration counter

4. **Accuracy Trend Visualization**
   - Line chart: Accuracy over iterations
   - Per-column trend lines
   - Target accuracy line (90-95%)
   - Iteration annotations

5. **A/B Testing (Advanced)**
   - Test multiple instruction variants
   - Compare results side-by-side
   - Statistical significance calculation
   - Choose best performer

#### Pattern Analysis:
```typescript
// lib/analysis/patterns.ts
export function analyzeFailurePatterns(
  results: ExecutionResult[]
): FailurePattern[] {
  const patterns: FailurePattern[] = [];
  
  // Group failures by column
  const columnFailures = groupBy(results, 'failedColumn');
  
  // Detect common issues
  for (const [column, failures] of Object.entries(columnFailures)) {
    if (failures.length >= 3) {
      patterns.push({
        description: `${column} extraction failing on ${failures.length} sites`,
        category: 'extraction_location',
        affectedSites: failures.length,
        suggestedFix: generateSuggestion(column, failures),
      });
    }
  }
  
  return patterns;
}

export function generateSuggestion(
  column: string,
  failures: ExecutionResult[]
): string {
  // Use AI to analyze failures and suggest fix
  // Example: "Check both pricing page and cart for Monthly price"
  return aiGeneratedSuggestion(column, failures);
}
```

#### API Routes:
```
GET    /api/executions/[id]/patterns     # Get failure patterns
POST   /api/projects/[id]/refine         # Update instructions
POST   /api/batches/[id]/retest          # Re-run test with new instructions
GET    /api/projects/[id]/accuracy-trend # Get accuracy over time
```

#### Testing:
- **Unit tests**: Pattern detection, suggestion generation
- **Integration tests**: Refinement → retest cycle
- **E2E tests**: Complete improvement workflow

**Deliverables**:
- ✅ Failure pattern analysis
- ✅ AI-powered refinement suggestions
- ✅ Instruction version control
- ✅ Accuracy trend visualization
- ✅ Iterative testing workflow

**Success Criteria**:
- Patterns detected from 3+ similar failures
- Suggestions are actionable and specific
- Accuracy improves by 10-15% per iteration
- User can iterate 3-5 times to reach 90%+

---

### Phase 6: Production Deployment (Week 7)

**Goal**: Users can deploy validated workflows at scale with confidence

#### Features:
1. **Deployment Strategy**
   - Batch graduation: 50 → 100 → full
   - Manual deployment (all at once)
   - Cost and time estimates
   - Confirmation with risk warnings

2. **Execution Queue**
   - Background job processing
   - Concurrency management
   - Rate limiting protection
   - Automatic retries with backoff

3. **Monitoring Dashboard**
   - Real-time execution progress
   - Success/failure counts
   - Cost tracking
   - ETA calculation

4. **Result Management**
   - Paginated result table
   - Filtering and sorting
   - Export to CSV/JSON
   - Bulk actions (retry failures)

5. **Alert System**
   - Email notifications (completion/failures)
   - Webhook integration
   - Slack notifications (optional)
   - In-app notifications

#### Queue Implementation:
```typescript
// lib/queue/execution-queue.ts
import { Queue, Worker } from 'bullmq';

export const executionQueue = new Queue('mino-execution', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
});

export const executionWorker = new Worker(
  'mino-execution',
  async (job) => {
    const { executionId, siteUrl, batchId } = job.data;
    
    // Execute workflow (mock for now)
    const result = await executeMockWorkflow(siteUrl, batchId);
    
    // Store result in database
    await storeExecutionResult(executionId, result);
    
    // Update execution progress
    await updateExecutionProgress(executionId);
    
    return result;
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    },
    concurrency: 10, // Process 10 sites concurrently
  }
);
```

#### API Routes:
```
POST   /api/batches/[id]/deploy          # Start production deployment
GET    /api/executions/[id]/status       # Get real-time status
POST   /api/executions/[id]/pause        # Pause execution
POST   /api/executions/[id]/resume       # Resume execution
POST   /api/executions/[id]/cancel       # Cancel execution
GET    /api/executions/[id]/export       # Export results
```

#### Testing:
- **Unit tests**: Queue management, retry logic
- **Integration tests**: Full deployment cycle
- **Load tests**: 1000+ site execution
- **E2E tests**: Deploy → monitor → export

**Deliverables**:
- ✅ Background execution queue
- ✅ Real-time monitoring dashboard
- ✅ Batch graduation strategy
- ✅ Result export functionality
- ✅ Alert and notification system

**Success Criteria**:
- Deploy 250 sites in <1 hour (mock)
- Real-time progress updates working
- Failures isolated (don't stop batch)
- Results exportable as CSV

---

### Phase 7: Analytics & Continuous Improvement (Week 8)

**Goal**: Users can analyze production results and identify optimization opportunities

#### Features:
1. **Performance Dashboard**
   - Execution time trends
   - Success rate over time
   - Cost per site metrics
   - Accuracy degradation detection

2. **Proactive Recommendations**
   - "Site structure changed" detection
   - Suggested workflow updates
   - Scheduled re-training reminders
   - Performance optimization tips

3. **Historical Comparison**
   - Compare batch results over time
   - Identify accuracy regressions
   - Track instruction effectiveness
   - ROI calculation

4. **Knowledge Base**
   - Successful patterns library
   - Common issues and solutions
   - Best practices documentation
   - User-contributed tips

#### Analytics:
```typescript
// lib/analytics/metrics.ts
export async function calculateBatchMetrics(batchId: string) {
  const executions = await db
    .select()
    .from(executionsTable)
    .where(eq(executionsTable.batchId, batchId))
    .orderBy(desc(executionsTable.createdAt));
  
  return {
    totalExecutions: executions.length,
    averageAccuracy: calculateAverage(executions, 'accuracyPercentage'),
    averageExecutionTime: calculateAverage(executions, 'executionTimeMs'),
    totalCost: sum(executions, 'actualCost'),
    successRate: (successfulCount / totalCount) * 100,
    trend: calculateTrend(executions),
  };
}
```

#### API Routes:
```
GET    /api/projects/[id]/analytics      # Project-level analytics
GET    /api/batches/[id]/analytics       # Batch-level analytics
GET    /api/analytics/recommendations    # Proactive recommendations
GET    /api/analytics/trends             # Platform-wide trends
```

#### Testing:
- **Unit tests**: Metric calculations, trend analysis
- **Integration tests**: Analytics data aggregation
- **E2E tests**: View analytics, export reports

**Deliverables**:
- ✅ Performance analytics dashboard
- ✅ Proactive recommendation system
- ✅ Historical trend visualization
- ✅ Knowledge base foundation

**Success Criteria**:
- Metrics calculated correctly
- Trends visualized clearly
- Recommendations are actionable
- User understands ROI

---

### Phase 8: Polish & Production Readiness (Week 9-10)

**Goal**: Production-ready platform with testing, documentation, and deployment

#### Tasks:
1. **Comprehensive Testing**
   - Unit test coverage >80%
   - Integration tests for all workflows
   - E2E tests for critical paths
   - Performance testing (load, stress)
   - Security testing (OWASP checks)

2. **Documentation**
   - User guide with screenshots
   - API documentation
   - Developer setup guide
   - Troubleshooting guide
   - Video tutorials (optional)

3. **Error Handling**
   - Graceful error boundaries
   - Helpful error messages
   - Sentry integration
   - Error recovery flows

4. **Performance Optimization**
   - Code splitting
   - Image optimization
   - Database query optimization
   - Caching strategies
   - CDN setup

5. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader testing
   - Color contrast checks

6. **Production Deployment**
   - Environment configuration
   - Database migrations
   - Monitoring setup
   - Backup strategy
   - Rollback plan

**Deliverables**:
- ✅ Comprehensive test suite
- ✅ Complete documentation
- ✅ Production deployment
- ✅ Monitoring and alerting
- ✅ User onboarding flow

**Success Criteria**:
- All tests passing
- Documentation complete
- Production environment stable
- Performance targets met
- Security audit passed

---

## Development Workflow

### Daily Workflow
1. Pull latest changes from GitHub
2. Review Claude Code suggestions
3. Implement features with Cursor
4. Write tests alongside code
5. Commit with descriptive messages
6. Push and deploy to staging
7. Manual testing on staging
8. Deploy to production (weekly)

### Git Commit Conventions
```
feat: Add ground truth testing interface
fix: Correct accuracy calculation for partial matches
refactor: Simplify batch creation workflow
test: Add E2E tests for workflow capture
docs: Update API documentation for executions
chore: Upgrade dependencies to latest versions
```

### Code Review Checklist
- [ ] TypeScript types defined
- [ ] Zod schemas for validation
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] Accessible (keyboard, screen reader)
- [ ] Responsive design tested
- [ ] Performance acceptable
- [ ] Documentation updated

---

## Quality Standards

### Code Quality
- **TypeScript strict mode** enabled
- **ESLint** with no warnings
- **Prettier** formatting enforced
- **Zod** validation for all user input
- **Error boundaries** around components
- **Loading states** for async operations

### Performance Targets
- **Time to Interactive**: <2s
- **First Contentful Paint**: <1s
- **API Response Time**: <200ms (P95)
- **Database Query Time**: <100ms (P95)

### Testing Coverage
- **Unit tests**: >80% coverage
- **Integration tests**: All API routes
- **E2E tests**: Critical user journeys
- **Visual regression**: Key pages

### Security Checklist
- [ ] Row Level Security (RLS) enabled
- [ ] Input validation with Zod
- [ ] SQL injection protection (Drizzle ORM)
- [ ] XSS prevention (React escaping)
- [ ] CSRF protection (Supabase)
- [ ] Rate limiting on API routes
- [ ] Environment secrets secured
- [ ] HTTPS enforced

---

## Risk Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Screen capture API limitations | High | Mock interface for testing, fallback options |
| Database performance at scale | Medium | Proper indexing, JSONB optimization, caching |
| Real-time updates latency | Medium | Supabase Realtime, polling fallback |
| CSV parsing large files | Low | Streaming parser, file size limits |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| User adoption | High | Clear onboarding, comprehensive docs, video tutorials |
| Workflow capture complexity | Medium | Simplified UI, step-by-step guidance, examples |
| Accuracy expectations | Medium | Set realistic expectations (60% → 95% over time) |
| Competition | Low | Focus on unique teaching paradigm and validation |

---

## Success Metrics

### User Success
- **Time to First Workflow**: <15 minutes
- **Test Completion Rate**: >80% of users run GT test
- **Accuracy Achievement**: 90%+ after 3 iterations
- **User Retention**: >60% 30-day retention

### Technical Success
- **Platform Uptime**: >99.5%
- **Error Rate**: <1% of requests
- **Test Suite Pass Rate**: 100%
- **Deployment Frequency**: Weekly releases

### Business Success
- **User Signups**: 50+ in first month
- **Active Projects**: 100+ created
- **Successful Deployments**: 500+ batches
- **Customer Satisfaction**: >4.5/5 rating

---

## Next Steps After Implementation

### Phase 9: Real Integration (Post-MVP)
1. **OpenAI Integration**
   - Replace mock workflow generation
   - Implement instruction-to-query conversion
   - Add refinement suggestion AI

2. **Tetra/Browser Integration**
   - Replace mock execution
   - Real browser automation
   - Screenshot capture

3. **AgentQL Integration**
   - Natural language web querying
   - Data extraction
   - DOM navigation

### Phase 10: Advanced Features
1. **Collaborative Features**
   - Team workspaces
   - Workflow sharing
   - Commenting and annotations

2. **Enterprise Features**
   - SSO (SAML, OIDC)
   - Audit logs
   - Advanced permissions
   - API access

3. **Platform Intelligence**
   - Cross-user learning
   - Pattern library
   - Automatic workflow suggestions
   - Predictive accuracy estimation

---

## Conclusion

This implementation plan provides a structured, iterative approach to building the Mino no-code platform. Each phase delivers working features that can be tested and validated before moving forward.

**Key Principles**:
- ✅ Iterative development with working software at each phase
- ✅ Mock-first approach for external integrations
- ✅ Comprehensive testing at every stage
- ✅ User feedback integration throughout
- ✅ Professional, enterprise-grade quality

**Timeline**: 8-10 weeks for MVP with all core features working (using mocks for external integrations)

**Team**: 1-2 developers using Claude Code + Cursor for accelerated development

**Outcome**: Production-ready platform where users can teach, test, refine, and deploy web automation workflows with systematic accuracy improvement from 60% → 95%.
