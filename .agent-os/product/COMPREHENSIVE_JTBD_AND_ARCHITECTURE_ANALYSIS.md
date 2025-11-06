# Comprehensive JTBD & Architecture Reimagining

**Date**: November 5, 2025
**Purpose**: Deep analysis of user goals, jobs-to-be-done, and architectural improvements for MINO platform

---

## Executive Summary

Based on analysis of the database schema and real usage patterns from 10 active projects, 31 batches, and 289 jobs, this document proposes a comprehensive reimagining of MINO's information architecture, taxonomy, and data model to create a more intuitive, powerful, and scalable platform.

**Key Findings**:
- Current 4-layer hierarchy (Project → Batch → Job → Session) creates cognitive overhead
- Low ground truth adoption (10% of batches) indicates UX friction
- High retry/failure rates (114 failed sessions, 78 error jobs) need better visibility
- Terminology doesn't match user mental models
- Missing concepts: Campaigns, Datasets, Runs, Attempts

---

## Part 1: Current State Analysis

### 1.1 Current Data Model

```
Organizations (Multi-tenancy)
  └─ Projects (Instructions/Goals)
      └─ Batches (CSV uploads + column schema)
          ├─ Jobs (Individual site tasks)
          │   └─ Sessions (Execution attempts)
          └─ Executions (Batch-level runs)
```

### 1.2 Real Usage Patterns Discovered

**Projects** (Real examples from database):
1. **Price Comparison**: "expedia test" - Compare Klook vs Trip.com pricing across 50 attractions
2. **Wellness Data**: "Classpass Test" - Extract pricing from 4,653 fitness venues
3. **Government Data**: "E2E Test" - Extract Sheriff/Coroner contact info from 13 counties
4. **Compliance Research**: "compliance" - Navigate complex regulatory documentation
5. **Restaurant Intelligence**: "Coke POS" - Identify POS systems used by 15 restaurants

**Batch Characteristics**:
- Range: 13 to 4,653 sites per batch
- Columns: 3 to 19 fields to extract
- Ground Truth: Only 10% use GT (major opportunity!)
- Test runs: Most executions are 10-job samples

**Execution Patterns**:
- Concurrency: Consistently 5 agents
- Duration: 1-3 minutes for 10 jobs
- Failure rate: ~27% (78 errors / 289 jobs)
- Retry behavior: 277 sessions for 289 jobs = 96% have 1+ retry

### 1.3 Problems with Current Model

#### **Terminology Misalignment**
| Current Term | User Mental Model | Problem |
|--------------|-------------------|---------|
| **Project** | "Campaign" or "Use Case" | Too generic, doesn't convey ongoing nature |
| **Batch** | "Dataset" or "Job List" | Implies one-time processing, not iterative |
| **Job** | "Task" or "Site" | Not task-focused enough |
| **Session** | "Attempt" or "Run" | Too tech-focused, not outcome-focused |
| **Execution** | "Test Run" or "Production Run" | Hidden relationship to batch |

#### **Hierarchy Confusion**
- **Batch vs. Execution**: Users see these as the same thing ("run my batch")
- **Job vs. Session**: The distinction between a job and its attempts is invisible
- **Project scope**: Unclear if a project is reusable instructions or a one-time campaign

#### **Missing Concepts**
1. **Datasets**: Reusable, versioned input data separate from runs
2. **Campaigns**: Ongoing monitoring/repetition (e.g., daily price checks)
3. **Templates**: Shareable project configurations
4. **Runs**: User-friendly term for "I want to execute this now"
5. **Results**: Permanent, exportable snapshots of run outcomes

---

## Part 2: Jobs-to-Be-Done Analysis

### 2.1 Primary JTBD Categories

#### **JTBD 1: Research & Data Collection**
**When** I need competitive intelligence or market research
**I want to** extract structured data from hundreds/thousands of websites
**So that** I can analyze trends, compare offerings, and make data-driven decisions

**Example Projects**:
- Classpass pricing across 4,653 venues
- Expedia/Klook attraction price comparison
- Restaurant POS system identification

**User Journey**:
1. ✅ Define what data I need (columns/fields)
2. ✅ Upload list of websites to scrape
3. ✅ Write instructions for the agent
4. ✅ Run a small test (10 sites)
5. ❌ **GAP**: Review test quality and adjust instructions
6. ✅ Run full batch
7. ❌ **GAP**: Download clean, analyzed results with confidence scores

**Pain Points**:
- No iterative instruction refinement workflow
- No confidence scores on extracted data
- No smart sampling (currently just first 10)
- No comparison view for test vs. production runs

---

#### **JTBD 2: Quality Assurance & Ground Truth Validation**
**When** I have known correct answers for some sites
**I want to** measure extraction accuracy and improve instructions
**So that** I can trust the results before using them in decisions

**Current State**: Only 10% of batches use ground truth!

**User Journey**:
1. ✅ Upload CSV with expected values
2. ❌ **GAP**: Easily mark which columns are ground truth (current UX is hidden)
3. ❌ **GAP**: See accuracy during test run
4. ❌ **GAP**: Identify patterns in failures
5. ❌ **GAP**: A/B test instruction variations
6. ❌ **GAP**: Track accuracy improvements over time

**Pain Points**:
- Ground truth setup is not discoverable
- No guided workflow for improving accuracy
- Column-level metrics are hidden in analytics page
- No instruction versioning with accuracy tracking

---

#### **JTBD 3: Live Monitoring & Debugging**
**When** I'm running a large batch
**I want to** see real-time progress and catch issues early
**So that** I can stop/adjust if something is wrong

**User Journey**:
1. ✅ Start execution
2. ✅ See live agents working (recently improved!)
3. ✅ Click into individual agents to see browser
4. ❌ **GAP**: Identify which sites are stuck/slow
5. ❌ **GAP**: See why agents are failing in real-time
6. ❌ **GAP**: Pause and adjust concurrency mid-run
7. ❌ **GAP**: Mark specific jobs for manual review

**Pain Points**:
- No proactive alerts for unusual patterns
- Can't intervene on specific jobs during run
- No "health score" for execution quality
- Failure reasons are generic

---

#### **JTBD 4: Results Analysis & Export**
**When** I've completed a run
**I want to** analyze the results and export clean data
**So that** I can use it in my downstream workflows (BI tools, databases, reports)

**User Journey**:
1. ✅ Execution completes
2. ❌ **GAP**: See results summary with quality indicators
3. ❌ **GAP**: Filter/sort by accuracy, completeness, confidence
4. ✅ Export to CSV
5. ❌ **GAP**: Export with comparison columns (GT vs. Extracted)
6. ❌ **GAP**: Export screenshots for failed jobs
7. ❌ **GAP**: Schedule exports to S3/Snowflake/webhook

**Pain Points**:
- Export is basic CSV only
- No confidence scores in export
- Can't export screenshots bulk
- No integrations with data platforms

---

#### **JTBD 5: Iteration & Improvement**
**When** my first run has low accuracy
**I want to** understand why and systematically improve
**So that** I achieve production-quality results

**User Journey**:
1. ✅ See accuracy metrics
2. ❌ **GAP**: Drill into specific failure patterns
3. ❌ **GAP**: See suggested instruction improvements
4. ❌ **GAP**: Create instruction version
5. ❌ **GAP**: Run A/B test (old vs. new instructions)
6. ❌ **GAP**: Compare accuracy across versions
7. ❌ **GAP**: Promote winning version

**Pain Points**:
- No instruction versioning
- No A/B testing capability
- No AI-suggested improvements
- Manual trial-and-error process

---

#### **JTBD 6: Ongoing Monitoring & Campaigns**
**When** I need to track changing data over time
**I want to** schedule recurring runs
**So that** I can monitor trends and get alerted to changes

**Current State**: Not supported - users would need to manually re-run

**User Journey**:
1. ❌ **GAP**: Set up recurring schedule (daily, weekly, etc.)
2. ❌ **GAP**: Define alert conditions (price changes, new errors, etc.)
3. ❌ **GAP**: Receive notifications via email/Slack
4. ❌ **GAP**: Compare results across time
5. ❌ **GAP**: Export trend reports

**Pain Points**:
- No scheduling capability
- No change detection
- No alerting system
- No historical comparison UI

---

### 2.2 Secondary JTBD

#### **JTBD 7: Team Collaboration**
- Share projects across team members
- Review and approve results before export
- Assign specific batches/jobs to team members
- Comment and annotate on results

#### **JTBD 8: Cost Management**
- Estimate costs before running
- Set budget limits per project/batch
- Track spending across organization
- Optimize concurrency for cost vs. speed

#### **JTBD 9: Compliance & Audit**
- Track who ran what and when
- Maintain audit logs of data extraction
- Ensure ethical scraping practices
- Document data sources and methodology

---

## Part 3: Proposed Architecture Reimagining

### 3.1 New Information Architecture

#### **Proposed 5-Layer Model**

```
Organizations (Multi-tenancy)
  └─ Campaigns (Ongoing monitoring projects)
      ├─ Instructions (Versioned, A/B testable)
      ├─ Datasets (Reusable input data, versioned)
      └─ Runs (Test or Production executions)
          ├─ Tasks (Individual site extractions)
          │   └─ Attempts (Retry history)
          └─ Results (Snapshot of outcomes)
```

#### **Terminology Mapping**

| Old Term | New Term | Rationale |
|----------|----------|-----------|
| Project | **Campaign** | Conveys ongoing, strategic nature |
| Batch | **Dataset** | Separates data from execution |
| Execution | **Run** | User-friendly, action-oriented |
| Job | **Task** | Clearer purpose (extract data from one site) |
| Session | **Attempt** | Outcome-focused (success/failure) |
| N/A | **Instructions** | Explicit versioning of agent prompts |
| N/A | **Results** | Immutable snapshot of run outcomes |

### 3.2 Entity Definitions

#### **Campaign** (was: Project)
A strategic initiative with:
- **Purpose**: Clear business goal (e.g., "Monitor competitor pricing")
- **Instructions**: Versioned agent prompts
- **Datasets**: Multiple datasets can be used
- **Runs**: History of all test and production runs
- **Schedule**: Optional recurring execution
- **Status**: Active, paused, completed, archived
- **Team**: Assigned members with roles

**Why**: Campaigns reflect how users think about work - ongoing initiatives, not one-off projects.

#### **Instructions** (new entity)
Versioned agent prompts with:
- **Version number**: Semantic versioning (1.0, 1.1, 2.0)
- **Prompt text**: The actual instructions to the agent
- **Change description**: What was changed and why
- **Accuracy metrics**: Historical performance per version
- **A/B tests**: Comparison runs between versions
- **Status**: Draft, testing, active, deprecated

**Why**: Instruction iteration is core workflow - needs first-class treatment.

#### **Dataset** (was: Batch)
Reusable, versioned input data:
- **Source**: CSV upload, API sync, manual entry
- **Schema**: Column definitions with types and ground truth flags
- **Rows**: The actual site data
- **Version**: Track changes over time
- **Validation**: Schema validation rules
- **Preview**: First 100 rows always visible
- **Stats**: Total rows, GT coverage, duplicates

**Why**: Separating data from execution enables reusability and versioning.

#### **Run** (was: Execution)
A single execution instance:
- **Type**: Test (sample) or Production (full)
- **Dataset version**: Specific snapshot of input data
- **Instruction version**: Specific prompt used
- **Sample strategy**: Random, first N, custom selection
- **Concurrency**: Agent parallelism level
- **Status**: Queued, running, paused, completed, stopped, failed
- **Live stats**: Real-time progress metrics
- **Results**: Immutable outcome snapshot

**Why**: "Run" is intuitive, action-oriented language users already use.

#### **Task** (was: Job)
One site's extraction work:
- **Input**: Single row from dataset
- **Goal**: Generated from instructions + row data
- **Status**: Queued, running, completed, failed, skipped
- **Attempts**: Retry history with reasons
- **Extracted data**: What the agent found
- **Ground truth**: Expected values (if available)
- **Accuracy**: Pass/fail/partial if GT exists
- **Confidence**: 0-100% model certainty
- **Metadata**: Duration, cost, agent reasoning

**Why**: "Task" is clearer than "job" and reflects the unit of work.

#### **Attempt** (was: Session)
One execution try of a task:
- **Attempt number**: 1st try, 2nd try, etc.
- **Status**: Success, failed, timeout, blocked
- **Failure reason**: Specific categorization
- **Extracted data**: What was found (partial or complete)
- **Browser recording**: Screenshots, streaming URL
- **Agent reasoning**: Step-by-step thought process
- **Duration**: Time taken
- **Retry trigger**: Auto or manual

**Why**: "Attempt" clearly conveys retry semantics and outcome focus.

#### **Result** (new entity)
Immutable snapshot of run outcomes:
- **Run reference**: Which run produced this
- **Task results**: All task outcomes with accuracy
- **Summary stats**: Pass rate, accuracy, coverage
- **Quality score**: Overall data quality (0-100)
- **Export formats**: Pre-generated CSV, JSON, Parquet
- **Snapshots**: Screenshot URLs, archived data
- **Permalink**: Shareable URL

**Why**: Results should be permanent, shareable artifacts.

---

### 3.3 Database Schema Refinements

#### **New Tables Needed**

```typescript
// Campaigns (replaces projects with more context)
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  purpose: text('purpose'), // Business goal
  status: text('status').default('active'), // active, paused, completed, archived

  // Instructions management
  currentInstructionVersionId: uuid('current_instruction_version_id'),

  // Scheduling
  scheduleEnabled: boolean('schedule_enabled').default(false),
  scheduleExpression: text('schedule_expression'), // cron format
  scheduleTimezone: text('schedule_timezone').default('UTC'),

  // Alerting
  alertsEnabled: boolean('alerts_enabled').default(false),
  alertChannels: jsonb('alert_channels').$type<{
    email?: boolean
    slack?: boolean
    webhook?: string
  }>(),

  // Team & ownership
  ownerId: uuid('owner_id').notNull(),
  teamMembers: uuid('team_members').array(),

  // Metadata
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  archivedAt: timestamp('archived_at'),
})

// Instructions (versioned prompts)
export const instructions = pgTable('instructions', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),

  // Versioning
  version: text('version').notNull(), // "1.0", "1.1", "2.0"
  versionNumber: integer('version_number').notNull(), // For sorting

  // Content
  promptText: text('prompt_text').notNull(),
  changeDescription: text('change_description'),
  changedBy: uuid('changed_by'),

  // Status
  status: text('status').default('draft'), // draft, testing, active, deprecated
  activatedAt: timestamp('activated_at'),
  deprecatedAt: timestamp('deprecated_at'),

  // Performance tracking
  totalRuns: integer('total_runs').default(0),
  avgAccuracy: real('avg_accuracy'),
  avgPassRate: real('avg_pass_rate'),
  avgDuration: integer('avg_duration'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Datasets (versioned input data)
export const datasets = pgTable('datasets', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  organizationId: uuid('organization_id').notNull(),

  // Identity
  name: text('name').notNull(),
  description: text('description'),
  version: integer('version').default(1).notNull(),

  // Schema
  schema: jsonb('schema').notNull().$type<Array<{
    name: string
    type: 'text' | 'number' | 'url' | 'email' | 'phone'
    isRequired: boolean
    isUrl: boolean // Which column contains the site URL
    isGroundTruth: boolean
    validation?: {
      pattern?: string
      min?: number
      max?: number
      enum?: string[]
    }
  }>>(),

  // Data
  data: jsonb('data').notNull().$type<Array<Record<string, any>>>(),
  totalRows: integer('total_rows').notNull(),

  // Ground truth
  hasGroundTruth: boolean('has_ground_truth').default(false),
  groundTruthColumns: text('ground_truth_columns').array(),
  gtCoveragePercent: real('gt_coverage_percent'), // % of rows with GT

  // Validation
  validationErrors: jsonb('validation_errors').$type<Array<{
    row: number
    column: string
    error: string
  }>>(),

  // Stats
  duplicateRows: integer('duplicate_rows').default(0),
  invalidRows: integer('invalid_rows').default(0),

  // Source
  sourceType: text('source_type'), // 'csv_upload', 'api_sync', 'manual'
  sourceMetadata: jsonb('source_metadata'),

  // Status
  status: text('status').default('draft'), // draft, validated, active, archived

  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
})

// Runs (replaces executions with better naming)
export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  datasetId: uuid('dataset_id').references(() => datasets.id).notNull(),
  instructionId: uuid('instruction_id').references(() => instructions.id).notNull(),
  organizationId: uuid('organization_id').notNull(),

  // Type
  runType: text('run_type').notNull(), // 'test_sample', 'test_custom', 'production'

  // Sampling (for test runs)
  sampleStrategy: text('sample_strategy'), // 'first_n', 'random', 'custom', 'all'
  sampleSize: integer('sample_size'),
  sampleRowIds: text('sample_row_ids').array(), // Specific rows selected

  // Configuration
  concurrency: integer('concurrency').default(5).notNull(),
  useAgentQL: boolean('use_agent_ql').default(true).notNull(),
  retryEnabled: boolean('retry_enabled').default(true).notNull(),
  maxRetries: integer('max_retries').default(3).notNull(),

  // Status
  status: text('status').default('queued'), // queued, running, paused, completed, stopped, failed

  // Live stats
  totalTasks: integer('total_tasks').notNull(),
  completedTasks: integer('completed_tasks').default(0),
  runningTasks: integer('running_tasks').default(0),
  queuedTasks: integer('queued_tasks').default(0),
  failedTasks: integer('failed_tasks').default(0),

  // Quality metrics
  passedTasks: integer('passed_tasks').default(0),
  failedValidation: integer('failed_validation').default(0),
  partialExtractions: integer('partial_extractions').default(0),

  // Accuracy (if GT exists)
  accuracyPercent: real('accuracy_percent'),
  passRate: real('pass_rate'),

  // Health score (0-100)
  healthScore: integer('health_score'),
  healthFactors: jsonb('health_factors').$type<{
    successRate: number
    avgConfidence: number
    avgDuration: number
    retryRate: number
  }>(),

  // Cost
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),

  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  pausedAt: timestamp('paused_at'),
  stoppedAt: timestamp('stopped_at'),
  stopReason: text('stop_reason'),

  // Results
  resultId: uuid('result_id'), // Link to permanent result snapshot

  // User
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Tasks (replaces jobs with better naming)
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => runs.id).notNull(),
  campaignId: uuid('campaign_id').notNull(),
  datasetId: uuid('dataset_id').notNull(),
  organizationId: uuid('organization_id').notNull(),

  // Input
  rowId: text('row_id').notNull(), // Reference to dataset row
  rowData: jsonb('row_data').notNull().$type<Record<string, any>>(),
  siteUrl: text('site_url').notNull(),
  siteName: text('site_name'),

  // Generated goal
  goal: text('goal').notNull(),

  // Status
  status: text('status').default('queued'), // queued, running, completed, failed, skipped
  statusCategory: text('status_category'), // success, partial, blocked, error

  // Extracted data
  extractedData: jsonb('extracted_data').$type<Record<string, any>>(),
  extractedFields: text('extracted_fields').array(),
  missingFields: text('missing_fields').array(),
  completenessPercent: integer('completeness_percent'), // % of expected fields extracted

  // Confidence scores
  overallConfidence: real('overall_confidence'), // 0-1
  fieldConfidences: jsonb('field_confidences').$type<Record<string, number>>(),

  // Ground truth comparison
  groundTruthData: jsonb('ground_truth_data').$type<Record<string, any>>(),
  hasGroundTruth: boolean('has_ground_truth').default(false),
  accuracyResult: text('accuracy_result'), // 'pass', 'fail', 'partial'
  fieldAccuracies: jsonb('field_accuracies').$type<Record<string, boolean>>(),

  // Failure tracking
  failureCategory: text('failure_category'), // extraction_failed, page_error, blocked, timeout
  failureReason: text('failure_reason'),
  blockedReason: text('blocked_reason'), // captcha, login_required, paywall, geo_blocked

  // Attempts
  attemptCount: integer('attempt_count').default(0),
  lastAttemptId: uuid('last_attempt_id'),

  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),

  // Live tracking
  currentStep: text('current_step'),
  currentUrl: text('current_url'),
  progressPercent: integer('progress_percent').default(0),

  // Cost
  cost: decimal('cost', { precision: 10, scale: 4 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Attempts (replaces sessions with better naming)
export const attempts = pgTable('attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  runId: uuid('run_id').notNull(),

  // Attempt tracking
  attemptNumber: integer('attempt_number').notNull(), // 1, 2, 3, etc.
  trigger: text('trigger').notNull(), // 'initial', 'auto_retry', 'manual_retry'

  // Status
  status: text('status').notNull(), // success, failed, timeout, blocked, cancelled

  // Extracted data
  extractedData: jsonb('extracted_data').$type<Record<string, any>>(),
  partialData: boolean('partial_data').default(false),

  // Agent reasoning
  reasoning: jsonb('reasoning').$type<Array<{
    step: string
    action: string
    result: string
    timestamp: string
  }>>(),

  // Browser recording
  screenshots: jsonb('screenshots').$type<Array<{
    timestamp: string
    url: string
    title: string
  }>>(),
  streamingUrl: text('streaming_url'),
  finalScreenshotUrl: text('final_screenshot_url'),

  // Failure
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  failureCategory: text('failure_category'),
  failureReason: text('failure_reason'),

  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),

  // Cost
  cost: decimal('cost', { precision: 10, scale: 4 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Results (immutable snapshots)
export const results = pgTable('results', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => runs.id).notNull(),
  campaignId: uuid('campaign_id').notNull(),
  datasetId: uuid('dataset_id').notNull(),
  instructionId: uuid('instruction_id').notNull(),
  organizationId: uuid('organization_id').notNull(),

  // Summary
  totalTasks: integer('total_tasks').notNull(),
  successfulTasks: integer('successful_tasks').notNull(),
  failedTasks: integer('failed_tasks').notNull(),
  partialTasks: integer('partial_tasks').notNull(),

  // Quality
  overallQualityScore: integer('overall_quality_score'), // 0-100
  avgConfidence: real('avg_confidence'),
  avgCompleteness: real('avg_completeness'),

  // Accuracy (if GT)
  accuracyPercent: real('accuracy_percent'),
  passRate: real('pass_rate'),
  fieldAccuracies: jsonb('field_accuracies').$type<Record<string, number>>(),

  // Data
  taskResults: jsonb('task_results').$type<Array<{
    taskId: string
    siteUrl: string
    status: string
    extractedData: Record<string, any>
    confidence: number
    accuracy?: string
  }>>(),

  // Exports (pre-generated)
  exports: jsonb('exports').$type<{
    csv: string // S3 URL
    json: string
    excel: string
    screenshots: string // Zip file URL
  }>(),

  // Sharing
  permalinkToken: text('permalink_token').unique(),
  isPublic: boolean('is_public').default(false),
  expiresAt: timestamp('expires_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
})

// A/B Test Comparisons
export const instructionComparisons = pgTable('instruction_comparisons', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),

  name: text('name').notNull(),
  description: text('description'),

  // Versions being tested
  instructionAId: uuid('instruction_a_id').references(() => instructions.id).notNull(),
  instructionBId: uuid('instruction_b_id').references(() => instructions.id).notNull(),

  // Test configuration
  datasetId: uuid('dataset_id').references(() => datasets.id).notNull(),
  sampleSize: integer('sample_size').notNull(),

  // Results
  runAId: uuid('run_a_id').references(() => runs.id),
  runBId: uuid('run_b_id').references(() => runs.id),

  // Winner
  status: text('status').default('pending'), // pending, running, completed
  winner: text('winner'), // 'a', 'b', 'tie', 'inconclusive'
  winnerReason: text('winner_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
})
```

---

### 3.4 Key Relationships

```typescript
// New Relations
export const campaignsRelations = relations(campaigns, ({ many, one }) => ({
  instructions: many(instructions),
  datasets: many(datasets),
  runs: many(runs),
  currentInstructionVersion: one(instructions, {
    fields: [campaigns.currentInstructionVersionId],
    references: [instructions.id],
  }),
}))

export const instructionsRelations = relations(instructions, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [instructions.campaignId],
    references: [campaigns.id],
  }),
  runs: many(runs),
  comparisons: many(instructionComparisons),
}))

export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [datasets.campaignId],
    references: [campaigns.id],
  }),
  runs: many(runs),
}))

export const runsRelations = relations(runs, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [runs.campaignId],
    references: [campaigns.id],
  }),
  dataset: one(datasets, {
    fields: [runs.datasetId],
    references: [datasets.id],
  }),
  instruction: one(instructions, {
    fields: [runs.instructionId],
    references: [instructions.id],
  }),
  tasks: many(tasks),
  result: one(results, {
    fields: [runs.resultId],
    references: [results.id],
  }),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  run: one(runs, {
    fields: [tasks.runId],
    references: [runs.id],
  }),
  attempts: many(attempts),
  lastAttempt: one(attempts, {
    fields: [tasks.lastAttemptId],
    references: [attempts.id],
  }),
}))

export const attemptsRelations = relations(attempts, ({ one }) => ({
  task: one(tasks, {
    fields: [attempts.taskId],
    references: [tasks.id],
  }),
}))

export const resultsRelations = relations(results, ({ one }) => ({
  run: one(runs, {
    fields: [results.runId],
    references: [runs.id],
  }),
  campaign: one(campaigns, {
    fields: [results.campaignId],
    references: [campaigns.id],
  }),
  dataset: one(datasets, {
    fields: [results.datasetId],
    references: [datasets.id],
  }),
  instruction: one(instructions, {
    fields: [results.instructionId],
    references: [instructions.id],
  }),
}))
```

---

## Part 4: UX Improvements Based on New Taxonomy

### 4.1 Navigation Hierarchy

```
Campaigns
  └─ Campaign Detail
      ├─ Overview (purpose, status, team)
      ├─ Instructions (versions, A/B tests)
      ├─ Datasets (input data management)
      ├─ Runs (test & production history)
      │   └─ Run Detail
      │       ├─ Live Monitor (during execution)
      │       ├─ Results (after completion)
      │       └─ Tasks (detailed task list)
      │           └─ Task Detail (attempts, reasoning)
      └─ Analytics (trends, patterns, insights)
```

### 4.2 Key UX Patterns

#### **Smart Wizard for New Campaigns**
```
Step 1: Define Purpose
  - What business goal? (auto-suggest from description)
  - Add team members

Step 2: Write Instructions
  - Template library (sheriff extraction, price comparison, etc.)
  - AI assistant for prompt writing
  - Preview mode with single test

Step 3: Upload Dataset
  - CSV drag-and-drop
  - Auto-detect schema
  - Mark URL column
  - Mark ground truth columns (with explanations!)
  - Validate data quality

Step 4: Run Test
  - Smart sampling (not just first 10!)
  - Choose sample size
  - Watch live execution
  - Review results

Step 5: Iterate or Launch
  - If accuracy < 80%: suggest improvements
  - If accuracy >= 80%: offer production run
```

#### **Ground Truth Onboarding**
- **Problem**: Only 10% use GT currently!
- **Solution**: During dataset upload, prominent callout:
  ```
  ┌─────────────────────────────────────────────────┐
  │ 💡 Want to measure accuracy?                    │
  │                                                  │
  │ Mark which columns contain expected values,     │
  │ and we'll show you exactly how accurate the     │
  │ extraction is!                                   │
  │                                                  │
  │ [Yes, set up ground truth] [Skip for now]      │
  └─────────────────────────────────────────────────┘
  ```

#### **Run Health Dashboard**
When execution is live, show health score:
```
┌─────────────────────────────────┐
│ Run Health: 87/100 🟢          │
├─────────────────────────────────┤
│ ✅ Success rate: 92%            │
│ ⚠️  Avg confidence: 73%         │
│ ✅ Duration: Normal             │
│ ⚠️  Retry rate: 18%             │
│                                  │
│ [View Issues] [Adjust Settings] │
└─────────────────────────────────┘
```

#### **Instruction Versioning UI**
```
Instructions: v2.3 (Active) ▼

┌──────────────────────────────────────────────┐
│ Version History                              │
├──────────────────────────────────────────────┤
│ • v2.3 - Current (Active)        93% acc ✅  │
│   "Added clarification for price extraction" │
│   12 runs, 93% avg accuracy                  │
│                                              │
│ • v2.2 - Previous                87% acc     │
│   "Improved selector specificity"            │
│   5 runs, 87% avg accuracy                   │
│                                              │
│ • v2.1 - Testing                 ?           │
│   "Experimental A/B test variant"            │
│   [Run A/B Test]                             │
│                                              │
│ [+ Create New Version]                       │
└──────────────────────────────────────────────┘
```

#### **Results Comparison View**
```
Compare Runs:
[Run #42 v] vs [Run #38 v]

┌─────────────────────────────────────────────┐
│           Run #42      Run #38      Δ      │
├─────────────────────────────────────────────┤
│ Accuracy:    93%        87%      +6% ✅     │
│ Pass Rate:   89%        82%      +7% ✅     │
│ Avg Conf:    91%        85%      +6% ✅     │
│ Duration:    2m 34s     3m 12s   -38s ✅    │
│ Cost:        $4.20      $4.80    -$0.60 ✅  │
│                                             │
│ Winner: Run #42 (v2.3 instructions)        │
│ [Activate This Version]                     │
└─────────────────────────────────────────────┘
```

---

## Part 5: Implementation Roadmap

### Phase 1: Database Migration (2 weeks)
**Goals**:
- Create new tables alongside existing ones
- Add migration scripts with backward compatibility
- No UX changes yet

**Tasks**:
1. Create `campaigns`, `instructions`, `datasets`, `runs`, `tasks`, `attempts`, `results` tables
2. Write migration to copy `projects` → `campaigns`
3. Write migration to copy `batches` → `datasets`
4. Write migration to copy `executions` → `runs`
5. Write migration to copy `jobs` → `tasks`
6. Write migration to copy `sessions` → `attempts`
7. Set up bidirectional sync (writes go to both old and new tables)
8. Create database views for backward compatibility

### Phase 2: API Layer (2 weeks)
**Goals**:
- Create new API endpoints using new terminology
- Keep old endpoints working
- Add new capabilities (versioning, A/B testing)

**Tasks**:
1. `/api/campaigns/*` endpoints
2. `/api/campaigns/:id/instructions` (versioning)
3. `/api/campaigns/:id/datasets` (versioned data)
4. `/api/runs/*` with health scoring
5. `/api/tasks/*` with confidence scores
6. `/api/results/*` for immutable snapshots
7. `/api/instructions/compare` for A/B testing
8. Deprecation warnings on old endpoints

### Phase 3: Core UX Migration (3 weeks)
**Goals**:
- Update all UI to use new terminology
- Maintain feature parity with current version
- Improve discoverability

**Tasks**:
1. Rename "Projects" → "Campaigns" throughout app
2. Separate "Datasets" from "Runs" in UI
3. Instruction versioning interface
4. Enhanced run detail page with health score
5. Task detail with attempt history
6. Results page with immutable permalink
7. Update all navigation
8. Add terminology tooltips for transition period

### Phase 4: New Capabilities (4 weeks)
**Goals**:
- Leverage new architecture for features impossible before
- Drive adoption through value

**Tasks**:
1. **Ground Truth Onboarding**: Wizard during dataset upload
2. **Instruction A/B Testing**: Compare two versions side-by-side
3. **Smart Sampling**: ML-based sample selection
4. **Run Health Dashboard**: Real-time quality monitoring
5. **Results Comparison**: Visual diff between runs
6. **Confidence Scores**: Field-level extraction confidence
7. **Dataset Versioning**: Track data changes over time
8. **Campaign Templates**: Shareable configurations

### Phase 5: Advanced Features (4 weeks)
**Goals**:
- Differentiation and competitive moats
- Enterprise capabilities

**Tasks**:
1. **Scheduling**: Recurring runs (cron-like)
2. **Alerting**: Email/Slack notifications
3. **Change Detection**: Alert when data changes
4. **Trend Analysis**: Historical comparison charts
5. **AI-Suggested Improvements**: Auto-improve instructions
6. **Data Integrations**: S3, Snowflake, webhooks
7. **Audit Logging**: Complete activity trail
8. **Advanced Exports**: Parquet, screenshots zip

### Phase 6: Cleanup & Optimization (1 week)
**Goals**:
- Remove old tables and code
- Performance optimization
- Documentation

**Tasks**:
1. Remove bidirectional sync
2. Drop old tables (`projects`, `batches`, `executions`, `jobs`, `sessions`)
3. Remove old API endpoints
4. Database optimization (indexes, partitioning)
5. Update documentation
6. Migration guide for API users

---

## Part 6: Success Metrics

### Adoption Metrics
- **Ground Truth Usage**: From 10% → 60% of datasets
- **Instruction Versioning**: 80% of campaigns use 2+ versions
- **A/B Testing**: 30% of campaigns run comparison tests
- **Run Health**: Users check health dashboard during 90% of runs

### Quality Metrics
- **Average Accuracy**: Increase from current baseline to 90%+
- **Retry Rate**: Decrease from 96% to 60%
- **Confidence Scores**: Show 85%+ average confidence
- **Partial Extractions**: Track and reduce from current level

### Engagement Metrics
- **Runs Per Campaign**: Increase from 1-2 to 5+ (iterative improvement)
- **Test Run Adoption**: 100% of users run test before production
- **Result Exports**: Track export format usage
- **Permalink Shares**: Measure collaboration through shares

### Business Metrics
- **Cost Efficiency**: Reduce wasted runs through better testing
- **Time to Accuracy**: Measure time from first run to 90% accuracy
- **Enterprise Adoption**: Track multi-user campaigns
- **API Usage**: Growth in programmatic access

---

## Conclusion

This comprehensive reimagining addresses the core JTBD gaps while creating a more intuitive, scalable architecture. The new taxonomy better matches user mental models, and the phased implementation plan allows for incremental migration without disruption.

**Key Improvements**:
1. ✅ **Clearer Mental Model**: Campaign > Dataset > Run > Task > Attempt
2. ✅ **Instruction Versioning**: First-class support for iteration
3. ✅ **Ground Truth UX**: Make accuracy measurement discoverable
4. ✅ **Run Health Monitoring**: Proactive quality management
5. ✅ **Immutable Results**: Permanent, shareable artifacts
6. ✅ **A/B Testing**: Data-driven instruction optimization
7. ✅ **Confidence Scores**: Trust indicators for extracted data

**Next Steps**: Review this analysis, prioritize features, and begin Phase 1 implementation.
