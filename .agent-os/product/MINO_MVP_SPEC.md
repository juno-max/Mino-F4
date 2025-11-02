# MINO MVP - MINIMUM VIABLE PRODUCT SPECIFICATION

## Product Vision (One Sentence)
Enable power builders to teach web automation workflows through demonstration, validate accuracy with ground truth testing, and deploy at scale - all without writing code.

---

## Core Value Proposition
**Before Mino**: 5 hours of manual web work monthly  
**After Mino**: 10 minutes to teach once, automated forever  
**Proof**: Systematic accuracy improvement from 60% → 90%+ through ground truth validation

---

## Design System: Fintech-Inspired

**Visual Reference**: Ramp, Mercury, Brex - modern financial software aesthetics

### Color Palette (Warm Muted Tones)
```css
/* Primary - Warm Neutrals */
--color-bg-primary: #FAFAF9        /* Stone 50 - main background */
--color-bg-secondary: #F5F5F4      /* Stone 100 - secondary surfaces */
--color-bg-elevated: #FFFFFF       /* White - cards, modals */

/* Text - Warm Grays */
--color-text-primary: #292524      /* Stone 800 - primary text */
--color-text-secondary: #57534E    /* Stone 600 - secondary text */
--color-text-tertiary: #78716C     /* Stone 500 - muted text */

/* Accent - Warm Amber (Trust, Success) */
--color-accent-primary: #D97706     /* Amber 600 - primary actions */
--color-accent-hover: #B45309       /* Amber 700 - hover state */
--color-accent-light: #FEF3C7       /* Amber 50 - subtle backgrounds */

/* Status Colors - Warm Tones */
--color-success: #16A34A            /* Green 600 - accurate results */
--color-success-bg: #F0FDF4         /* Green 50 - success backgrounds */
--color-warning: #EA580C            /* Orange 600 - warnings */
--color-warning-bg: #FFF7ED         /* Orange 50 - warning backgrounds */
--color-error: #DC2626              /* Red 600 - errors */
--color-error-bg: #FEF2F2           /* Red 50 - error backgrounds */

/* Borders - Subtle Warm */
--color-border-default: #E7E5E4     /* Stone 200 - default borders */
--color-border-strong: #D6D3D1      /* Stone 300 - emphasized borders */
```

### Typography
```css
/* Font Family */
--font-sans: 'Inter', -apple-system, sans-serif
--font-mono: 'JetBrains Mono', monospace

/* Font Sizes */
--text-xs: 0.75rem     /* 12px - labels, metadata */
--text-sm: 0.875rem    /* 14px - body text */
--text-base: 1rem      /* 16px - default */
--text-lg: 1.125rem    /* 18px - section headers */
--text-xl: 1.25rem     /* 20px - page headers */
--text-2xl: 1.5rem     /* 24px - large headers */
```

### Component Patterns (Fintech Style)
- **Cards**: Subtle shadows (shadow-sm), crisp borders, ample padding
- **Buttons**: Minimal radius (rounded-md), clear states, no gradients
- **Tables**: Dense data display, subtle row hover, clear headers
- **Forms**: Clean inputs, inline validation, helpful microcopy
- **Metrics**: Large numbers, clear labels, trend indicators
- **Navigation**: Sidebar with icons, breadcrumbs, clear hierarchy

### UI Principles
- **Data Density**: Show more information, less chrome
- **Clear Hierarchy**: Typography and spacing create structure
- **Minimal Motion**: Subtle transitions, no excessive animation
- **Professional Polish**: Pixel-perfect alignment, consistent spacing
- **Warmth**: Muted warm tones (not cold blues/grays)

---

## MVP Scope: 4 Core Features (Use-Case Agnostic)

### Feature 1: Project & Instruction Management
**User can**: Create projects with natural language instructions for ANY web automation task

**Minimum Requirements**:
- Create project with name + instructions (rich text editor)
- View list of projects
- Edit project instructions
- Delete project
- Projects stored in database (no auth for MVP)

**Example Use Cases**:
```
Pricing Intelligence:
"Extract product prices including cart-level pricing and shipping costs"

Restaurant Data:
"Extract menu items, beverage offerings, and POS system information"

Compliance Monitoring:
"Extract regulatory documents and rate change notifications"

Contact Information:
"Extract business name, address, phone, email, and hours of operation"
```

**Database**:
```sql
projects (
  id, name, instructions, created_at
)
```

**UI**: Fintech-inspired dashboard with project cards showing:
- Project name (large, clear)
- Instructions preview (muted text)
- Batch count + Last run timestamp (metadata)
- Action buttons (subtle, right-aligned)

**Success Criteria**: User can create project in <1 minute for any use case

---

### Feature 2: Batch Creation with Ground Truth
**User can**: Upload CSV with URLs and expected results - flexible schema for any data structure

**Minimum Requirements**:
- Upload CSV file (drag-drop or file picker)
- Parse CSV: detect URL column + ANY ground truth columns
- Preview data in clean, dense table
- Save batch linked to project
- Show batch metadata (site count, detected GT columns)

**Flexible Ground Truth Detection**:
```
Pricing example:
url, name, gt_price, gt_shipping, gt_total

Restaurant example:
url, restaurant_name, gt_has_coca_cola, gt_pos_system

Compliance example:
url, utility_name, gt_rate_change_date, gt_new_rate

Contact example:
url, business_name, gt_phone, gt_email, gt_hours
```

**Database**:
```sql
batches (
  id, project_id, name, csv_data JSONB, 
  has_ground_truth BOOLEAN, ground_truth_columns TEXT[],
  column_schema JSONB,  /* Stores detected schema */
  total_sites INTEGER, created_at
)
```

**UI**: Clean upload interface with:
- Drag-drop zone (warm accent color on hover)
- Instant preview table (fintech-style dense grid)
- GT columns highlighted (warm amber badge)
- Column type inference shown
- Clear save button

**Success Criteria**: User can upload CSV for any use case, GT columns auto-detected

---

### Feature 3: Mock Workflow Execution with Ground Truth Testing
**User can**: Test workflow on sample sites, see accuracy for their specific data structure

**Minimum Requirements**:
- Select batch → configure test (10-20 sites)
- Mock execution (60-75% baseline accuracy)
- Show results: extracted vs. ground truth for ALL columns
- Calculate accuracy: overall + per-column (dynamic based on schema)
- Show pass/fail/partial for each site
- Display failure patterns (generic, not use-case specific)

**Dynamic Result Display**:
```
For pricing use case:
  Overall: 72% | Price: 90% | Shipping: 85% | Total: 55%

For restaurant use case:
  Overall: 78% | Has_Coca_Cola: 95% | POS_System: 60%

For any use case:
  Dynamically show accuracy for each GT column detected
```

**Database**:
```sql
executions (
  id, batch_id, status, total_sites, completed_sites,
  accuracy_percentage, column_accuracies JSONB,
  started_at, completed_at, created_at
)

execution_results (
  id, execution_id, site_url, 
  extracted_data JSONB,      /* Flexible schema */
  ground_truth_data JSONB,   /* Flexible schema */
  is_accurate BOOLEAN, match_percentage DECIMAL,
  failed_columns TEXT[],     /* Which columns failed */
  failure_reason TEXT, created_at
)
```

**UI**: Results dashboard (fintech-style metrics):
- Top: Large accuracy percentage (prominent number)
- Per-column breakdown (horizontal bar chart, muted colors)
- Results table (dense, clean, sortable)
- Failure pattern cards (warm warning backgrounds)
- Export button (subtle, top-right)

**Success Criteria**: Works for any use case, shows clear accuracy per column

---

### Feature 4: Instruction Refinement & Re-testing
**User can**: Update instructions based on failures, re-test, validate improvement

**Minimum Requirements**:
- View failure patterns (generic suggestions)
- Edit project instructions (rich text)
- Re-run test on same sample
- Compare accuracy: before vs. after
- Show accuracy trend (simple timeline view)

**Generic Failure Patterns**:
```
Instead of:
  "Monthly price location inconsistent"

Show:
  "Column 'monthly_price' failed on 3/10 sites"
  "Suggestion: Check multiple page locations for this field"

Works for any column name, any use case.
```

**Database**:
```sql
instruction_versions (
  id, project_id, instructions TEXT,
  version_number INTEGER, accuracy_impact DECIMAL,
  created_at
)
```

**UI**: Refinement interface:
- Failure cards (warm orange backgrounds, clear icons)
- Side-by-side instruction editor
- Large "Re-test" button (warm amber accent)
- Accuracy comparison (before/after, visual diff)
- Timeline view of improvements (fintech-style chart)

**Success Criteria**: User improves accuracy 10%+ for any use case

---

## Out of Scope (Post-MVP)

### Not in MVP:
- ❌ Real browser automation (use mocks)
- ❌ Screen share workflow capture (future Moment 1)
- ❌ Production deployment at scale (>20 sites)
- ❌ Real-time monitoring dashboard
- ❌ Advanced analytics and trends
- ❌ Workflow templates library
- ❌ Team collaboration features
- ❌ Authentication (no login required for MVP)
- ❌ Multi-user support
- ❌ API access
- ❌ Webhooks and integrations
- ❌ Advanced scheduling
- ❌ Multiple instruction variants (A/B testing)

### Why These Are Later:
Focus MVP on proving the core loop: **teach → test → refine → validate accuracy**

---

## Technical Stack (MVP)

### Frontend
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS v4 with custom fintech design tokens
- shadcn/ui components (customized with warm palette)
- Zustand (minimal state)
- Inter font (primary)

### Backend
- Supabase (PostgreSQL only - no auth)
- Drizzle ORM
- Next.js API routes (no separate backend)

### No Authentication
- Single-user local experience
- No login required
- Data stored in PostgreSQL (no user_id foreign keys)

### Mock Execution
- Simple JavaScript functions that simulate:
  - 1-3 second execution time
  - 60-75% baseline accuracy
  - Random failures with realistic patterns
  - Per-column success rates

---

## Database Schema (MVP)

```typescript
// drizzle/schema.ts

// No users table - single user experience for MVP

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  instructions: text('instructions').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const batches = pgTable('batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  csvData: jsonb('csv_data').notNull(), // Array of row objects
  hasGroundTruth: boolean('has_ground_truth').default(false),
  groundTruthColumns: varchar('ground_truth_columns').array(),
  columnSchema: jsonb('column_schema'), // Detected column types and structure
  totalSites: integer('total_sites').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const executions = pgTable('executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('pending'),
  totalSites: integer('total_sites').notNull(),
  completedSites: integer('completed_sites').default(0),
  accuracyPercentage: decimal('accuracy_percentage', { precision: 5, scale: 2 }),
  columnAccuracies: jsonb('column_accuracies'), // Per-column accuracy stats
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const executionResults = pgTable('execution_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').references(() => executions.id, { onDelete: 'cascade' }),
  siteUrl: varchar('site_url', { length: 500 }).notNull(),
  siteName: varchar('site_name', { length: 255 }),
  extractedData: jsonb('extracted_data'), // Flexible schema for any use case
  groundTruthData: jsonb('ground_truth_data'), // Flexible schema for any use case
  isAccurate: boolean('is_accurate'),
  matchPercentage: decimal('match_percentage', { precision: 5, scale: 2 }),
  failedColumns: varchar('failed_columns').array(), // Which specific columns failed
  failureReason: text('failure_reason'),
  executionTimeMs: integer('execution_time_ms'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const instructionVersions = pgTable('instruction_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  instructions: text('instructions').notNull(),
  versionNumber: integer('version_number').notNull(),
  accuracyImpact: decimal('accuracy_impact', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## User Flow (MVP)

### Complete Workflow (Any Use Case)
```
1. Open app (no login required)
   ↓
2. Create project
   Example - Pricing: "Extract product prices and shipping"
   Example - Restaurants: "Extract beverage menu and POS system"
   Example - Compliance: "Extract rate changes and documents"
   ↓
3. Upload CSV with ground truth
   Headers: url, [any custom columns], gt_[field1], gt_[field2]...
   ↓
4. Test 10-20 sites → See 60-75% baseline accuracy
   ↓
5. Review failures by column (dynamic for any schema)
   ↓
6. Refine instructions: Add specificity for failed columns
   ↓
7. Re-test → See 75-90% accuracy (+15% improvement) ✓
```

**Time**: ~5 minutes for complete loop  
**Flexibility**: Works for any use case with any CSV schema

---

## API Routes (MVP)

```
# Projects
GET    /api/projects                   # List all projects (no auth)
POST   /api/projects                   # Create project
GET    /api/projects/[id]              # Get project details
PATCH  /api/projects/[id]              # Update instructions
DELETE /api/projects/[id]              # Delete project

# Batches
POST   /api/batches                    # Create batch (upload CSV)
GET    /api/batches/[id]               # Get batch details
DELETE /api/batches/[id]               # Delete batch
POST   /api/batches/validate-csv       # Validate CSV schema

# Executions
POST   /api/batches/[id]/test          # Start test execution (mock)
GET    /api/executions/[id]/status     # Get execution status
GET    /api/executions/[id]/results    # Get all results
GET    /api/executions/[id]/accuracy   # Get accuracy by column
```

---

## Mock Execution Logic (MVP)

```typescript
// lib/execution/mock.ts

export async function executeMockWorkflow(
  siteUrl: string,
  groundTruth: Record<string, any>,
  projectInstructions: string
): Promise<ExecutionResult> {
  
  // Simulate 1-3 second execution
  await sleep(randomBetween(1000, 3000));
  
  // Base accuracy: 60-75%
  const baseAccuracy = 0.60 + Math.random() * 0.15;
  
  // Calculate per-column accuracy
  const extractedData: Record<string, any> = {};
  let accurateColumns = 0;
  
  for (const [key, value] of Object.entries(groundTruth)) {
    if (Math.random() < baseAccuracy) {
      // Accurate extraction
      extractedData[key] = value;
      accurateColumns++;
    } else {
      // Simulate common failure types
      const failureType = Math.random();
      if (failureType < 0.5) {
        // Wrong value
        extractedData[key] = generateWrongValue(value);
      } else {
        // Missing value
        extractedData[key] = null;
      }
    }
  }
  
  const accuracy = accurateColumns / Object.keys(groundTruth).length;
  
  return {
    siteUrl,
    extractedData,
    groundTruthData: groundTruth,
    isAccurate: accuracy === 1.0,
    matchPercentage: accuracy * 100,
    failureReason: accuracy < 1.0 
      ? generateFailureReason(extractedData, groundTruth)
      : null,
    executionTime: randomBetween(1000, 3000),
  };
}

function generateFailureReason(
  extracted: Record<string, any>,
  groundTruth: Record<string, any>
): string {
  const failedColumns = Object.keys(groundTruth).filter(
    key => extracted[key] !== groundTruth[key]
  );
  
  const reasons = [
    `Could not locate ${failedColumns[0]} on page`,
    `${failedColumns[0]} value differs from expected`,
    `${failedColumns[0]} selector not found`,
    `Page structure changed for ${failedColumns[0]}`,
  ];
  
  return reasons[Math.floor(Math.random() * reasons.length)];
}
```

---

## UI Components (MVP)

### Required shadcn/ui Components
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add separator
```

### Key Pages
1. **Landing Page** (`app/page.tsx`)
   - Hero section
   - "Sign in with Google" button
   
2. **Dashboard** (`app/(dashboard)/projects/page.tsx`)
   - Project list (cards)
   - "New Project" button
   
3. **Project Detail** (`app/(dashboard)/projects/[id]/page.tsx`)
   - Project info
   - Batch list
   - "New Batch" button
   
4. **Batch Upload** (`app/(dashboard)/batches/new/page.tsx`)
   - CSV upload
   - Preview table
   - GT detection
   
5. **Batch Results** (`app/(dashboard)/batches/[id]/page.tsx`)
   - Test configuration
   - Results table
   - Accuracy metrics
   - Refinement interface

---

## Development Timeline (MVP)

### Week 1: Setup + Design System
- Day 1-2: Next.js setup, Tailwind config with fintech color palette
- Day 3-4: shadcn/ui installation and customization (warm colors)
- Day 5: Landing page + project dashboard (fintech design)

### Week 2: Project & Batch Management
- Day 1-2: Project CRUD (create, list, edit, delete)
- Day 3-4: CSV upload, flexible schema parsing, GT detection
- Day 5: Batch preview with dynamic columns

### Week 3: Mock Execution + Results
- Day 1-2: Mock execution engine (use-case agnostic)
- Day 3-4: Results display with dynamic column accuracy
- Day 5: Failure pattern detection (generic)

### Week 4: Refinement + Polish
- Day 1-2: Instruction editing, re-testing, comparison
- Day 3: Accuracy trends, fintech-style charts
- Day 4-5: UI polish (spacing, alignment, interactions), deployment

**Total**: 4 weeks for functional MVP

---

## Success Criteria (MVP)

### User Success
- ✅ User creates first project in <2 minutes
- ✅ User uploads CSV for any use case in <1 minute
- ✅ User sees test results in <10 seconds
- ✅ User understands what failed and why (any schema)
- ✅ User improves accuracy by 10%+ in second test

### Technical Success
- ✅ All tests passing
- ✅ Deployed to Vercel
- ✅ No authentication required
- ✅ CSV parsing handles any schema with 100+ rows
- ✅ Mock execution completes in <5 seconds
- ✅ Fintech design system implemented

### Validation Success
- ✅ Works for 3+ different use cases (pricing, restaurants, compliance)
- ✅ Users understand the refinement loop
- ✅ Users believe they could achieve 90%+ accuracy
- ✅ Users see value in GT validation approach

---

## What We're Validating (MVP)

### Key Hypotheses to Test:
1. **Use Case Flexibility**: Does the system work for ANY web automation task?
2. **Natural Language Instructions**: Can users describe diverse workflows clearly?
3. **Ground Truth Value**: Do users understand and value systematic accuracy validation?
4. **Refinement Loop**: Can users iterate instructions to improve accuracy?
5. **Design Appeal**: Does the fintech-inspired design convey professionalism and trust?

### Not Testing Yet:
- Real browser automation (use mocks)
- Screen capture teaching (add later)
- Production scale (limit to 20 sites max)
- Authentication and multi-user
- Advanced features (collaboration, analytics, scheduling)

---

## Scope Control

### If Feature Isn't Listed Above, It's Out of Scope

**Questions to Ask**:
- Does this help validate the core teaching → test → refine loop? 
  - **Yes** → Consider for MVP
  - **No** → Defer to post-MVP
  
- Can we mock this instead of building it real?
  - **Yes** → Use mock
  - **No** → Build real

- Will this delay MVP by >1 week?
  - **Yes** → Defer
  - **No** → Consider

- Does this work for multiple use cases or just one?
  - **One** → Make it generic
  - **Multiple** → Include

---

## Post-MVP Roadmap (Not Now)

### Phase 2: Real Automation
- Integrate Tetra/AgentQL
- Real browser sessions
- Actual web scraping

### Phase 3: Workflow Capture
- Screen share interface
- Step-by-step recording
- Visual workflow validation

### Phase 4: Authentication & Multi-User
- Supabase Auth
- User isolation
- Team workspaces

### Phase 5: Production Scale
- Background job queue
- 1000+ site deployments
- Monitoring dashboard

### Phase 6: Enterprise Features
- Advanced analytics
- Workflow sharing
- API access

---

## Implementation Command for Claude Code

```bash
# Copy this entire specification to your project directory:
# Save as: mino-mvp-spec.md

# Then use /plan-product in Claude Code terminal:

Build Mino MVP - Web automation platform with ground truth validation

DESIGN: Fintech-inspired (Ramp, Mercury, Brex style)
- Warm muted color palette (stone, amber accents)
- Clean typography (Inter font)
- Dense data tables, subtle shadows
- Professional polish, minimal motion

FEATURES (4 core, use-case agnostic):
1. Project Management: Natural language instructions for ANY workflow
2. Batch Upload: CSV with flexible schema, auto-detect GT columns  
3. Mock Testing: 10-20 sites, dynamic column accuracy, 60-75% baseline
4. Refinement Loop: Edit instructions, re-test, show improvement

TECH: Next.js 14, TypeScript, Tailwind v4 (custom fintech tokens), shadcn/ui (customized warm), Supabase (PostgreSQL only), Drizzle ORM

DATABASE: projects, batches (flexible column_schema JSONB), executions (column_accuracies JSONB), execution_results (flexible extracted_data/ground_truth_data), instruction_versions

NO AUTH: Single-user experience, no login required

MOCK: 60-75% baseline accuracy, 1-3s delay, realistic failures, works for any data schema

VALIDATION: Teaching → Testing → Refinement loop works for pricing, restaurants, compliance, ANY use case

TIMELINE: 4 weeks, deploy to Vercel

OUT OF SCOPE: Real automation, screen capture, auth, production scale (>20 sites), analytics, collaboration

REFERENCE: mino-mvp-spec.md for complete requirements
```

---

## Adding .md Files to Claude Code

### Method 1: Direct File Reference (Recommended)

```bash
# 1. Save this spec in your project directory
cd mino-platform
cp /path/to/MINO_MVP_SPEC.md .

# 2. Use @ mention in Claude Code
claude-code "Read @mino-mvp-spec.md and create initial project structure"

# 3. Claude Code will automatically load and use the file
```

### Method 2: .claude/context.yml Configuration

```bash
# 1. Create .claude directory if it doesn't exist
mkdir -p .claude

# 2. Create context configuration
cat > .claude/context.yml << 'EOF'
context_files:
  - mino-mvp-spec.md
  - MINO_TECHNICAL_SPEC.md
  - MINO_FEATURE_BREAKDOWN.md

project:
  name: "Mino Platform MVP"
  description: "Web automation with ground truth validation"
EOF

# 3. Claude Code will automatically load these files
claude-code "Build the project according to specifications"
```

### Method 3: Inline Context Command

```bash
# Paste the entire spec into the command
claude-code "
[Paste entire MINO_MVP_SPEC.md content here]

Build the MVP based on the above specification.
"
```

### Method 4: Project Knowledge (Best for Large Specs)

```bash
# 1. Create a docs/ directory
mkdir -p docs

# 2. Add all specification files
mv MINO_*.md docs/

# 3. Tell Claude Code where to find docs
claude-code "Review all documentation in docs/ directory and build MVP according to mino-mvp-spec.md"
```

### Verification

```bash
# Check if Claude Code loaded your files
claude-code "What specifications do you have access to?"

# Expected response will list your .md files
```

---

## Quick Start with Claude Code

```bash
# 1. Create project
mkdir mino-platform && cd mino-platform
git init

# 2. Save this spec
curl -o mino-mvp-spec.md [URL_TO_THIS_FILE]

# 3. Initialize Claude Code
claude-code init

# 4. Start building with file reference
claude-code "@mino-mvp-spec.md - Initialize Next.js 14 project with fintech design system (warm color palette, Inter font, Tailwind custom config)"

# 5. Continue with features
claude-code "@mino-mvp-spec.md - Implement Feature 1: Project Management with fintech-inspired dashboard"

# 6. Keep referencing the spec
claude-code "@mino-mvp-spec.md - Implement Feature 2: CSV upload with flexible schema detection"
```

---

## Key Files to Create

```
mino-mvp/
├── drizzle/
│   └── schema.ts                    # All tables
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client
│   ├── execution/
│   │   └── mock.ts                 # Mock execution engine
│   ├── csv/
│   │   └── parser.ts               # CSV parsing + GT detection
│   └── validation/
│       └── accuracy.ts             # Accuracy calculation
├── components/
│   ├── project/
│   │   ├── ProjectCard.tsx
│   │   └── ProjectCreateDialog.tsx
│   ├── batch/
│   │   ├── CSVUpload.tsx
│   │   └── BatchPreview.tsx
│   └── results/
│       ├── ResultsTable.tsx
│       ├── AccuracyDashboard.tsx
│       └── FailurePatterns.tsx
└── app/
    ├── page.tsx                     # Landing
    ├── (auth)/
    │   └── login/page.tsx
    └── (dashboard)/
        ├── projects/
        │   ├── page.tsx             # Project list
        │   └── [id]/page.tsx        # Project detail
        └── batches/
            ├── new/page.tsx         # Batch upload
            └── [id]/page.tsx        # Results
```

---

## Minimum Viable Product Summary

**Build This**: A functional web app where users can:
1. Create projects with instructions
2. Upload CSVs with ground truth
3. Test with mock execution
4. See accuracy metrics
5. Refine instructions
6. Re-test and validate improvement

**Don't Build**: Real browser automation, screen capture, production scale, advanced analytics

**Goal**: Validate that users understand and value the teaching → testing → refinement workflow with systematic accuracy improvement

**Timeline**: 4 weeks

**Success**: 5 users complete the full loop and see accuracy improve from 70% → 85%+
