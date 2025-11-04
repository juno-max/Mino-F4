# STAGE 1 - FEATURE SET 1: GT SETTING FROM SESSION WITH EVALUATION

## Overview
**Feature**: Allow users to set ground truth directly from session extracted data, automatically evaluate it, and display results throughout the app.

**User Value**: Users can quickly establish ground truth from successful executions without manually typing data or uploading CSV. Immediate feedback shows accuracy.

**Complete User Flow**:
1. User navigates to job detail page
2. User views latest session's extracted data
3. User clicks "Set as GT ★" button
4. System saves GT, tracks source, evaluates against extracted data
5. User sees confirmation and updated GT indicator
6. User returns to home page and sees ⭐ icon and evaluation result

**Estimated Time**: 3-5 days
**Complexity**: Medium
**Dependencies**: None (builds on existing schema)

---

## PHASE 1: DATABASE SCHEMA UPDATES

### Task 1.1: Add GT Source Tracking Columns to Jobs Table
**Priority**: Critical
**Estimated Time**: 30 minutes

#### Subtasks:
- [ ] **1.1.1** Create migration file: `drizzle/migrations/0001_add_gt_source_tracking.sql`
  ```sql
  -- Add GT source tracking
  ALTER TABLE jobs ADD COLUMN gt_source TEXT;
  ALTER TABLE jobs ADD COLUMN gt_created_at TIMESTAMP;
  ALTER TABLE jobs ADD COLUMN gt_edit_history JSONB DEFAULT '[]'::jsonb;

  -- Add index for GT queries
  CREATE INDEX idx_jobs_gt_source ON jobs(gt_source);
  CREATE INDEX idx_jobs_has_ground_truth ON jobs(has_ground_truth);

  -- Add comment for documentation
  COMMENT ON COLUMN jobs.gt_source IS 'Source of GT: csv_upload | selected_from_session | manually_edited | quick_review | click_to_set';
  ```

- [ ] **1.1.2** Update `db/schema.ts` to reflect new columns
  ```typescript
  export const jobs = pgTable('jobs', {
    // ... existing columns ...
    gtSource: text('gt_source').$type<'csv_upload' | 'selected_from_session' | 'manually_edited' | 'quick_review' | 'click_to_set'>(),
    gtCreatedAt: timestamp('gt_created_at'),
    gtEditHistory: jsonb('gt_edit_history').$type<Array<{
      editedAt: string
      editedBy?: string
      changes: Record<string, { from: any, to: any }>
      reason?: string
      source: string
    }>>().default([]),
  })
  ```

- [ ] **1.1.3** Run migration on local database
  ```bash
  npx drizzle-kit push:pg
  ```

- [ ] **1.1.4** Verify migration success
  - Check table columns exist
  - Check indexes created
  - Check default values work

**Acceptance Criteria**:
- ✅ Migration runs without errors
- ✅ New columns exist in jobs table
- ✅ TypeScript types updated in schema.ts
- ✅ Indexes created for performance
- ✅ Can insert/update GT source values

**Edge Cases to Consider**:
- Existing jobs with GT from CSV should get `gtSource = 'csv_upload'`
- `gtEditHistory` should never be null (default to empty array)
- Timestamps should use database timezone

---

### Task 1.2: Create Evaluation Results Table
**Priority**: Critical
**Estimated Time**: 45 minutes

#### Subtasks:
- [ ] **1.2.1** Create migration file: `drizzle/migrations/0002_create_evaluation_results.sql`
  ```sql
  CREATE TABLE evaluation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    overall_accuracy DECIMAL(5,2) NOT NULL,
    field_accuracies JSONB NOT NULL,
    mismatch_explanations JSONB,
    evaluation_method TEXT NOT NULL DEFAULT 'exact_match',
    evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- Indexes for performance
  CREATE INDEX idx_evaluation_results_job_id ON evaluation_results(job_id);
  CREATE INDEX idx_evaluation_results_session_id ON evaluation_results(session_id);
  CREATE INDEX idx_evaluation_results_evaluated_at ON evaluation_results(evaluated_at DESC);

  -- Ensure one evaluation per session
  CREATE UNIQUE INDEX idx_evaluation_results_unique_session ON evaluation_results(session_id);

  COMMENT ON TABLE evaluation_results IS 'Stores detailed evaluation results comparing extracted data vs ground truth';
  COMMENT ON COLUMN evaluation_results.field_accuracies IS 'JSONB array of {fieldName, isMatch, matchType, expected, actual, confidence}';
  ```

- [ ] **1.2.2** Update `db/schema.ts` with new table
  ```typescript
  export const evaluationResults = pgTable('evaluation_results', {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
    sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
    overallAccuracy: decimal('overall_accuracy', { precision: 5, scale: 2 }).notNull(),
    fieldAccuracies: jsonb('field_accuracies').notNull().$type<Array<{
      fieldName: string
      isMatch: boolean
      matchType: 'exact' | 'fuzzy' | 'mismatch'
      expected: any
      actual: any
      confidence: number
      explanation?: string
    }>>(),
    mismatchExplanations: jsonb('mismatch_explanations').$type<Array<{
      field: string
      reason: string
      suggestion?: string
    }>>(),
    evaluationMethod: text('evaluation_method').notNull().default('exact_match'),
    evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  })

  // Relations
  export const evaluationResultsRelations = relations(evaluationResults, ({ one }) => ({
    job: one(jobs, {
      fields: [evaluationResults.jobId],
      references: [jobs.id],
    }),
    session: one(sessions, {
      fields: [evaluationResults.sessionId],
      references: [sessions.id],
    }),
  }))
  ```

- [ ] **1.2.3** Run migration
- [ ] **1.2.4** Verify table creation and constraints

**Acceptance Criteria**:
- ✅ Table created with all columns
- ✅ Foreign keys work (cascade delete)
- ✅ Unique constraint prevents duplicate evaluations per session
- ✅ Indexes created for query performance
- ✅ TypeScript types correctly infer JSONB structure

**Edge Cases**:
- If session is deleted, evaluation results should cascade delete
- If job is deleted, evaluation results should cascade delete
- Cannot have multiple evaluations for same session (unique constraint)
- Accuracy must be between 0 and 100

---

## PHASE 2: EVALUATION LOGIC LIBRARY

### Task 2.1: Create Evaluation Comparison Logic
**Priority**: Critical
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **2.1.1** Create `lib/evaluation/compare.ts`
  ```typescript
  export interface ComparisonResult {
    isMatch: boolean
    matchType: 'exact' | 'fuzzy' | 'mismatch'
    confidence: number // 0-1
    explanation?: string
  }

  export interface FieldComparisonResult {
    fieldName: string
    isMatch: boolean
    matchType: 'exact' | 'fuzzy' | 'mismatch'
    expected: any
    actual: any
    confidence: number
    explanation?: string
  }

  export interface EvaluationResult {
    overallAccuracy: number // 0-100
    fieldResults: FieldComparisonResult[]
    matchedFields: number
    totalFields: number
    mismatchExplanations: Array<{
      field: string
      reason: string
      suggestion?: string
    }>
  }

  /**
   * Compare two values with exact matching
   */
  export function compareExact(expected: any, actual: any): ComparisonResult {
    // Handle null/undefined
    if (expected == null && actual == null) {
      return { isMatch: true, matchType: 'exact', confidence: 1.0 }
    }
    if (expected == null || actual == null) {
      return {
        isMatch: false,
        matchType: 'mismatch',
        confidence: 0,
        explanation: 'One value is null/undefined'
      }
    }

    // Convert to strings for comparison
    const expectedStr = String(expected).trim().toLowerCase()
    const actualStr = String(actual).trim().toLowerCase()

    const isMatch = expectedStr === actualStr

    return {
      isMatch,
      matchType: isMatch ? 'exact' : 'mismatch',
      confidence: isMatch ? 1.0 : 0.0,
      explanation: isMatch ? undefined : `Expected "${expected}" but got "${actual}"`
    }
  }

  /**
   * Evaluate extracted data against ground truth
   */
  export function evaluateExtraction(
    groundTruth: Record<string, any>,
    extractedData: Record<string, any>
  ): EvaluationResult {
    const fieldResults: FieldComparisonResult[] = []
    let matchedFields = 0
    const mismatchExplanations: Array<{ field: string; reason: string; suggestion?: string }> = []

    // Get all GT fields
    const gtFields = Object.keys(groundTruth)

    // Compare each field
    for (const fieldName of gtFields) {
      const expected = groundTruth[fieldName]
      const actual = extractedData[fieldName]

      const comparison = compareExact(expected, actual)

      const fieldResult: FieldComparisonResult = {
        fieldName,
        isMatch: comparison.isMatch,
        matchType: comparison.matchType,
        expected,
        actual,
        confidence: comparison.confidence,
        explanation: comparison.explanation,
      }

      fieldResults.push(fieldResult)

      if (comparison.isMatch) {
        matchedFields++
      } else {
        mismatchExplanations.push({
          field: fieldName,
          reason: comparison.explanation || 'Values do not match',
          suggestion: `Check if "${fieldName}" extraction is targeting correct element`,
        })
      }
    }

    const totalFields = gtFields.length
    const overallAccuracy = totalFields > 0 ? (matchedFields / totalFields) * 100 : 0

    return {
      overallAccuracy: Math.round(overallAccuracy * 100) / 100, // Round to 2 decimals
      fieldResults,
      matchedFields,
      totalFields,
      mismatchExplanations,
    }
  }
  ```

- [ ] **2.1.2** Create unit tests: `lib/evaluation/compare.test.ts`
  ```typescript
  import { describe, test, expect } from 'vitest'
  import { compareExact, evaluateExtraction } from './compare'

  describe('compareExact', () => {
    test('matches identical strings', () => {
      const result = compareExact('hello', 'hello')
      expect(result.isMatch).toBe(true)
      expect(result.confidence).toBe(1.0)
    })

    test('matches with different cases', () => {
      const result = compareExact('Hello', 'hello')
      expect(result.isMatch).toBe(true)
    })

    test('matches with whitespace differences', () => {
      const result = compareExact('  hello  ', 'hello')
      expect(result.isMatch).toBe(true)
    })

    test('handles null values', () => {
      const result = compareExact(null, null)
      expect(result.isMatch).toBe(true)
    })

    test('detects mismatch', () => {
      const result = compareExact('hello', 'world')
      expect(result.isMatch).toBe(false)
      expect(result.matchType).toBe('mismatch')
    })
  })

  describe('evaluateExtraction', () => {
    test('calculates 100% accuracy for perfect match', () => {
      const gt = { name: 'John', age: '30', city: 'NYC' }
      const extracted = { name: 'John', age: '30', city: 'NYC' }

      const result = evaluateExtraction(gt, extracted)
      expect(result.overallAccuracy).toBe(100)
      expect(result.matchedFields).toBe(3)
      expect(result.totalFields).toBe(3)
    })

    test('calculates partial accuracy', () => {
      const gt = { name: 'John', age: '30', city: 'NYC' }
      const extracted = { name: 'John', age: '31', city: 'NYC' }

      const result = evaluateExtraction(gt, extracted)
      expect(result.overallAccuracy).toBeCloseTo(66.67, 1)
      expect(result.matchedFields).toBe(2)
      expect(result.mismatchExplanations).toHaveLength(1)
    })

    test('handles missing fields in extracted data', () => {
      const gt = { name: 'John', age: '30' }
      const extracted = { name: 'John' }

      const result = evaluateExtraction(gt, extracted)
      expect(result.overallAccuracy).toBe(50)
    })
  })
  ```

- [ ] **2.1.3** Run tests and ensure 100% pass rate

**Acceptance Criteria**:
- ✅ Exact comparison works for strings, numbers, booleans
- ✅ Case-insensitive comparison
- ✅ Whitespace trimming
- ✅ Null/undefined handling
- ✅ Overall accuracy calculation correct
- ✅ Per-field results accurate
- ✅ Mismatch explanations generated
- ✅ All unit tests pass

**Edge Cases**:
- Empty objects (no GT fields)
- GT field exists but extracted field missing
- Extracted field exists but not in GT (ignored)
- Special characters in values
- Very long strings
- Numbers as strings ("123" vs 123)
- Boolean values ("true" vs true)

---

### Task 2.2: Create Evaluation Service
**Priority**: Critical
**Estimated Time**: 1.5 hours

#### Subtasks:
- [ ] **2.2.1** Create `lib/evaluation/service.ts`
  ```typescript
  import { db, jobs, sessions, evaluationResults } from '@/db'
  import { eq, and } from 'drizzle-orm'
  import { evaluateExtraction } from './compare'

  export interface EvaluateJobOptions {
    jobId: string
    sessionId?: string // If not provided, evaluate latest session
    method?: 'exact_match' // Future: 'fuzzy_match', 'ai_match'
  }

  export interface EvaluationServiceResult {
    success: boolean
    evaluationId?: string
    accuracy?: number
    error?: string
  }

  /**
   * Evaluate a job's session against its ground truth
   */
  export async function evaluateJob(
    options: EvaluateJobOptions
  ): Promise<EvaluationServiceResult> {
    const { jobId, sessionId: providedSessionId, method = 'exact_match' } = options

    try {
      // 1. Fetch job with GT data
      const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId),
      })

      if (!job) {
        return { success: false, error: 'Job not found' }
      }

      if (!job.hasGroundTruth || !job.groundTruthData) {
        return { success: false, error: 'Job has no ground truth data' }
      }

      // 2. Fetch session to evaluate
      let session
      if (providedSessionId) {
        session = await db.query.sessions.findFirst({
          where: and(
            eq(sessions.id, providedSessionId),
            eq(sessions.jobId, jobId)
          ),
        })
      } else {
        // Get latest completed session
        session = await db.query.sessions.findFirst({
          where: and(
            eq(sessions.jobId, jobId),
            eq(sessions.status, 'completed')
          ),
          orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
        })
      }

      if (!session) {
        return { success: false, error: 'No session found to evaluate' }
      }

      if (!session.extractedData) {
        return { success: false, error: 'Session has no extracted data' }
      }

      // 3. Run evaluation
      const evaluation = evaluateExtraction(
        job.groundTruthData,
        session.extractedData
      )

      // 4. Store evaluation results
      const [evaluationResult] = await db
        .insert(evaluationResults)
        .values({
          jobId: job.id,
          sessionId: session.id,
          overallAccuracy: String(evaluation.overallAccuracy), // Decimal as string
          fieldAccuracies: evaluation.fieldResults,
          mismatchExplanations: evaluation.mismatchExplanations,
          evaluationMethod: method,
        })
        .onConflictDoUpdate({
          target: evaluationResults.sessionId,
          set: {
            overallAccuracy: String(evaluation.overallAccuracy),
            fieldAccuracies: evaluation.fieldResults,
            mismatchExplanations: evaluation.mismatchExplanations,
            evaluatedAt: new Date(),
          },
        })
        .returning()

      // 5. Update job evaluation status
      const isPass = evaluation.overallAccuracy === 100
      await db
        .update(jobs)
        .set({
          isEvaluated: true,
          evaluationResult: isPass ? 'pass' : 'fail',
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId))

      return {
        success: true,
        evaluationId: evaluationResult.id,
        accuracy: evaluation.overallAccuracy,
      }
    } catch (error) {
      console.error('Evaluation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get evaluation result for a job
   */
  export async function getJobEvaluation(jobId: string) {
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      with: {
        sessions: {
          limit: 1,
          orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
        },
      },
    })

    if (!job || !job.sessions[0]) {
      return null
    }

    const evaluation = await db.query.evaluationResults.findFirst({
      where: eq(evaluationResults.sessionId, job.sessions[0].id),
    })

    return evaluation
  }
  ```

- [ ] **2.2.2** Create integration tests: `lib/evaluation/service.test.ts`
- [ ] **2.2.3** Test with real database data

**Acceptance Criteria**:
- ✅ Can evaluate job with GT against latest session
- ✅ Can evaluate specific session
- ✅ Stores evaluation results in database
- ✅ Updates job's evaluation status
- ✅ Handles missing GT gracefully
- ✅ Handles missing session gracefully
- ✅ Prevents duplicate evaluations (upsert on conflict)
- ✅ Returns accurate results

**Edge Cases**:
- Job with no sessions
- Job with only failed sessions (no extracted data)
- Multiple sessions (should evaluate latest completed)
- Session evaluatedmultiple times (should update, not duplicate)
- Concurrent evaluation requests
- Database transaction failures

---

## PHASE 3: API ENDPOINTS

### Task 3.1: Create Set Ground Truth API Endpoint
**Priority**: Critical
**Estimated Time**: 1 hour

#### Subtasks:
- [ ] **3.1.1** Create `app/api/jobs/[id]/set-ground-truth/route.ts`
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { db, jobs } from '@/db'
  import { eq } from 'drizzle-orm'
  import { evaluateJob } from '@/lib/evaluation/service'
  import { z } from 'zod'

  // Request body schema
  const SetGTSchema = z.object({
    source: z.enum(['csv_upload', 'selected_from_session', 'manually_edited', 'quick_review', 'click_to_set']),
    sessionId: z.string().uuid().optional(),
    groundTruthData: z.record(z.any()),
    reason: z.string().optional(),
  })

  export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: jobId } = await params

      // 1. Validate request body
      const body = await request.json()
      const validation = SetGTSchema.safeParse(body)

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { source, sessionId, groundTruthData, reason } = validation.data

      // 2. Fetch job
      const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId),
      })

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      // 3. Build GT edit history entry
      const historyEntry = {
        editedAt: new Date().toISOString(),
        changes: {} as Record<string, { from: any; to: any }>,
        reason,
        source,
      }

      // Track what changed
      if (job.groundTruthData) {
        for (const [key, newValue] of Object.entries(groundTruthData)) {
          const oldValue = (job.groundTruthData as any)[key]
          if (oldValue !== newValue) {
            historyEntry.changes[key] = { from: oldValue, to: newValue }
          }
        }
      } else {
        // First time setting GT
        for (const [key, value] of Object.entries(groundTruthData)) {
          historyEntry.changes[key] = { from: null, to: value }
        }
      }

      // 4. Update job with GT
      const [updatedJob] = await db
        .update(jobs)
        .set({
          groundTruthData,
          hasGroundTruth: true,
          gtSource: source,
          gtCreatedAt: job.gtCreatedAt || new Date(), // Keep original if exists
          gtEditHistory: [...(job.gtEditHistory || []), historyEntry],
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId))
        .returning()

      // 5. Automatically evaluate
      const evaluationResult = await evaluateJob({
        jobId,
        sessionId,
      })

      // 6. Return success
      return NextResponse.json({
        success: true,
        job: updatedJob,
        evaluation: evaluationResult,
        message: 'Ground truth set successfully',
      })
    } catch (error) {
      console.error('Set GT error:', error)
      return NextResponse.json(
        { error: 'Failed to set ground truth', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }

  // GET: Retrieve GT history
  export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: jobId } = await params

      const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId),
        columns: {
          id: true,
          groundTruthData: true,
          hasGroundTruth: true,
          gtSource: true,
          gtCreatedAt: true,
          gtEditHistory: true,
        },
      })

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      return NextResponse.json({
        groundTruthData: job.groundTruthData,
        hasGroundTruth: job.hasGroundTruth,
        source: job.gtSource,
        createdAt: job.gtCreatedAt,
        editHistory: job.gtEditHistory || [],
      })
    } catch (error) {
      console.error('Get GT error:', error)
      return NextResponse.json(
        { error: 'Failed to get ground truth' },
        { status: 500 }
      )
    }
  }
  ```

- [ ] **3.1.2** Test API endpoint with Postman/curl
  ```bash
  # Set GT from session
  curl -X POST http://localhost:3000/api/jobs/[job-id]/set-ground-truth \
    -H "Content-Type: application/json" \
    -d '{
      "source": "selected_from_session",
      "sessionId": "session-uuid",
      "groundTruthData": {
        "name": "John Doe",
        "email": "john@example.com",
        "price": "$99.99"
      },
      "reason": "Manually verified as correct"
    }'

  # Get GT history
  curl http://localhost:3000/api/jobs/[job-id]/set-ground-truth
  ```

- [ ] **3.1.3** Test error cases:
  - Invalid job ID
  - Missing required fields
  - Invalid source value
  - Database connection failure

**Acceptance Criteria**:
- ✅ POST creates/updates GT successfully
- ✅ GET returns GT data and history
- ✅ Request validation works (Zod schema)
- ✅ GT edit history tracked correctly
- ✅ Automatic evaluation triggered
- ✅ Error responses are descriptive
- ✅ Returns 400 for invalid input
- ✅ Returns 404 for missing job
- ✅ Returns 500 for server errors

**Edge Cases**:
- Setting GT multiple times (should append to history)
- Setting GT when session doesn't exist (should still work)
- Very large GT data (>1MB)
- Concurrent GT updates to same job
- Setting GT with empty object
- Setting GT with invalid field names

---

### Task 3.2: Create Evaluate Job API Endpoint
**Priority**: High
**Estimated Time**: 45 minutes

#### Subtasks:
- [ ] **3.2.1** Create `app/api/jobs/[id]/evaluate/route.ts`
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { evaluateJob, getJobEvaluation } from '@/lib/evaluation/service'
  import { z } from 'zod'

  const EvaluateSchema = z.object({
    sessionId: z.string().uuid().optional(),
    method: z.enum(['exact_match']).optional(),
  })

  export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: jobId } = await params
      const body = await request.json()

      const validation = EvaluateSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { sessionId, method } = validation.data

      const result = await evaluateJob({ jobId, sessionId, method })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        evaluationId: result.evaluationId,
        accuracy: result.accuracy,
      })
    } catch (error) {
      console.error('Evaluate job error:', error)
      return NextResponse.json(
        { error: 'Evaluation failed' },
        { status: 500 }
      )
    }
  }

  // GET: Retrieve evaluation results
  export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: jobId } = await params

      const evaluation = await getJobEvaluation(jobId)

      if (!evaluation) {
        return NextResponse.json(
          { error: 'No evaluation found for this job' },
          { status: 404 }
        )
      }

      return NextResponse.json(evaluation)
    } catch (error) {
      console.error('Get evaluation error:', error)
      return NextResponse.json(
        { error: 'Failed to get evaluation' },
        { status: 500 }
      )
    }
  }
  ```

- [ ] **3.2.2** Test endpoint
- [ ] **3.2.3** Test error handling

**Acceptance Criteria**:
- ✅ POST triggers evaluation
- ✅ GET returns evaluation results
- ✅ Works with optional sessionId parameter
- ✅ Error handling for missing GT
- ✅ Error handling for missing session

---

## PHASE 4: UI COMPONENTS

### Task 4.1: Create GT Selector Component
**Priority**: Critical
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **4.1.1** Create `components/GTSelector.tsx`
  ```typescript
  'use client'

  import { useState } from 'react'
  import { Button } from '@/components/Button'
  import { Card } from '@/components/Card'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Star, Check, X, Loader2 } from 'lucide-react'

  interface GTSelectorProps {
    jobId: string
    sessionId: string
    extractedData: Record<string, any>
    existingGT?: Record<string, any>
    onSuccess?: () => void
    onError?: (error: string) => void
  }

  export function GTSelector({
    jobId,
    sessionId,
    extractedData,
    existingGT,
    onSuccess,
    onError,
  }: GTSelectorProps) {
    const [selectedFields, setSelectedFields] = useState<Set<string>>(
      new Set(Object.keys(extractedData))
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const fields = Object.entries(extractedData)
    const allSelected = selectedFields.size === fields.length
    const noneSelected = selectedFields.size === 0

    const toggleField = (fieldName: string) => {
      const newSelected = new Set(selectedFields)
      if (newSelected.has(fieldName)) {
        newSelected.delete(fieldName)
      } else {
        newSelected.add(fieldName)
      }
      setSelectedFields(newSelected)
    }

    const toggleAll = () => {
      if (allSelected) {
        setSelectedFields(new Set())
      } else {
        setSelectedFields(new Set(fields.map(([key]) => key)))
      }
    }

    const handleSetGT = async () => {
      if (noneSelected) {
        onError?.('Please select at least one field')
        return
      }

      setIsSubmitting(true)

      try {
        // Build GT data with only selected fields
        const groundTruthData: Record<string, any> = {}
        for (const fieldName of selectedFields) {
          groundTruthData[fieldName] = extractedData[fieldName]
        }

        const response = await fetch(`/api/jobs/${jobId}/set-ground-truth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'selected_from_session',
            sessionId,
            groundTruthData,
            reason: `Selected ${selectedFields.size} fields from session output`,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to set ground truth')
        }

        const result = await response.json()

        // Show success animation
        setShowSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      } catch (error) {
        console.error('Set GT error:', error)
        onError?.(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setIsSubmitting(false)
      }
    }

    if (showSuccess) {
      return (
        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">
            Ground Truth Set Successfully!
          </h3>
          <p className="text-sm text-stone-600">
            Evaluation completed. Results are now visible.
          </p>
        </Card>
      )
    }

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-600" />
              Set as Ground Truth
            </h3>
            <p className="text-sm text-stone-600 mt-1">
              Select fields to use as expected values for evaluation
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAll}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        {existingGT && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ This job already has ground truth. Setting new GT will replace existing values.
            </p>
          </div>
        )}

        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {fields.map(([fieldName, value]) => {
            const isSelected = selectedFields.has(fieldName)
            const hasExistingGT = existingGT && fieldName in existingGT

            return (
              <div
                key={fieldName}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
                onClick={() => toggleField(fieldName)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleField(fieldName)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-stone-900">
                        {fieldName}
                      </span>
                      {hasExistingGT && (
                        <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-700 rounded">
                          Has GT
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-stone-600 break-words">
                      {String(value)}
                    </div>
                    {hasExistingGT && existingGT[fieldName] !== value && (
                      <div className="text-xs text-amber-700 mt-1">
                        Current GT: {String(existingGT[fieldName])}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <span className="text-sm text-stone-600">
            {selectedFields.size} of {fields.length} fields selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onError?.('Cancelled')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetGT}
              disabled={noneSelected || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting GT...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Set Ground Truth
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    )
  }
  ```

- [ ] **4.1.2** Test component in isolation (Storybook or test page)
- [ ] **4.1.3** Test interactions:
  - Select/deselect individual fields
  - Select all / deselect all
  - Submit with validation
  - Loading states
  - Success animation
  - Error handling

**Acceptance Criteria**:
- ✅ Shows all extracted fields
- ✅ Allows field selection via checkbox
- ✅ Select all / deselect all works
- ✅ Warns if GT already exists
- ✅ Shows existing GT values for comparison
- ✅ Disables submit when no fields selected
- ✅ Shows loading state during submission
- ✅ Shows success animation on completion
- ✅ Calls onSuccess callback
- ✅ Handles errors gracefully

**Accessibility**:
- [ ] Keyboard navigation works (tab, space, enter)
- [ ] Screen reader announces selections
- [ ] Focus management after success
- [ ] ARIA labels on all interactive elements

**Edge Cases**:
- Empty extracted data (no fields)
- Very long field values (truncate/wrap)
- Special characters in field names
- Null/undefined values
- Large number of fields (>50)

---

### Task 4.2: Create GT Badge Component
**Priority**: High
**Estimated Time**: 30 minutes

#### Subtasks:
- [ ] **4.2.1** Create `components/GTBadge.tsx`
  ```typescript
  'use client'

  import { Star } from 'lucide-react'
  import { Badge } from '@/components/Badge'

  interface GTBadgeProps {
    source?: 'csv_upload' | 'selected_from_session' | 'manually_edited' | 'quick_review' | 'click_to_set'
    showTooltip?: boolean
    size?: 'sm' | 'md' | 'lg'
  }

  const SOURCE_LABELS = {
    csv_upload: 'CSV Upload',
    selected_from_session: 'From Session',
    manually_edited: 'Manually Edited',
    quick_review: 'Quick Review',
    click_to_set: 'Click to Set',
  }

  export function GTBadge({ source, showTooltip = true, size = 'sm' }: GTBadgeProps) {
    const label = source ? SOURCE_LABELS[source] : 'Has GT'

    return (
      <Badge
        variant="warning"
        size={size}
        className="inline-flex items-center gap-1"
        title={showTooltip ? `Ground Truth: ${label}` : undefined}
      >
        <Star className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} fill-current`} />
        {size !== 'sm' && <span>{label}</span>}
      </Badge>
    )
  }
  ```

- [ ] **4.2.2** Test with different sources and sizes

**Acceptance Criteria**:
- ✅ Shows star icon
- ✅ Displays source label
- ✅ Tooltip on hover
- ✅ Different sizes work
- ✅ Accessible (ARIA labels)

---

### Task 4.3: Create Evaluation Result Badge Component
**Priority**: High
**Estimated Time**: 30 minutes

#### Subtasks:
- [ ] **4.3.1** Create `components/EvaluationResultBadge.tsx`
  ```typescript
  'use client'

  import { Check, X, AlertCircle } from 'lucide-react'
  import { Badge } from '@/components/Badge'

  interface EvaluationResultBadgeProps {
    result: 'pass' | 'fail' | null
    accuracy?: number
    showAccuracy?: boolean
    size?: 'sm' | 'md'
  }

  export function EvaluationResultBadge({
    result,
    accuracy,
    showAccuracy = false,
    size = 'sm',
  }: EvaluationResultBadgeProps) {
    if (!result) {
      return (
        <Badge variant="default" size={size}>
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Evaluated
        </Badge>
      )
    }

    const isPass = result === 'pass'
    const icon = isPass ? Check : X
    const Icon = icon

    return (
      <Badge
        variant={isPass ? 'success' : 'danger'}
        size={size}
        className="inline-flex items-center gap-1"
      >
        <Icon className="h-3 w-3" />
        <span>{result === 'pass' ? 'Pass' : 'Fail'}</span>
        {showAccuracy && accuracy != null && (
          <span className="ml-1">({accuracy}%)</span>
        )}
      </Badge>
    )
  }
  ```

- [ ] **4.3.2** Test all states: pass, fail, not evaluated

**Acceptance Criteria**:
- ✅ Shows pass/fail/not evaluated
- ✅ Correct colors (green/red/gray)
- ✅ Shows accuracy when provided
- ✅ Icons display correctly

---

## PHASE 5: INTEGRATE INTO JOB DETAIL PAGE

### Task 5.1: Add GT Setting to Job Detail Page
**Priority**: Critical
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **5.1.1** Update `app/projects/[id]/jobs/[jobId]/page.tsx`
  - Add state for showing GT selector modal
  - Add "Set as GT ★" button in session detail
  - Integrate GTSelector component
  - Handle success/error callbacks
  - Refresh job data after GT set

- [ ] **5.1.2** Add modal/dialog wrapper for GT selector
  ```typescript
  // In job detail page component
  const [showGTSelector, setShowGTSelector] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const handleSetGT = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setShowGTSelector(true)
  }

  const handleGTSuccess = () => {
    setShowGTSelector(false)
    // Refresh job data
    router.refresh()
    // Or refetch
  }

  // In JSX:
  <Dialog open={showGTSelector} onOpenChange={setShowGTSelector}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Set Ground Truth from Session</DialogTitle>
      </DialogHeader>
      <GTSelector
        jobId={job.id}
        sessionId={selectedSessionId}
        extractedData={session.extractedData}
        existingGT={job.groundTruthData}
        onSuccess={handleGTSuccess}
        onError={(error) => {
          toast.error(error)
          setShowGTSelector(false)
        }}
      />
    </DialogContent>
  </Dialog>
  ```

- [ ] **5.1.3** Update session display to show "Set as GT" button
  - Add button next to session title
  - Only show if session has extracted data
  - Disable if session is failed
  - Show loading state

- [ ] **5.1.4** Display existing GT in session view
  - Show GT badge if job has GT
  - Show GT source in metadata
  - Show GT creation date
  - Link to GT history

- [ ] **5.1.5** Display evaluation results
  - Show overall accuracy
  - Show pass/fail badge
  - Link to detailed evaluation view
  - Show per-field comparison inline

**Acceptance Criteria**:
- ✅ "Set as GT ★" button visible on sessions with extracted data
- ✅ Clicking button opens GT selector modal
- ✅ GT selector shows all extracted fields
- ✅ Setting GT shows success message
- ✅ Page refreshes to show new GT indicator
- ✅ Existing GT is displayed prominently
- ✅ Evaluation results visible after setting GT

**User Flow**:
1. User navigates to job detail page
2. User sees latest session with extracted data
3. User clicks "Set as GT ★" button
4. Modal opens with field selector
5. User selects fields (all selected by default)
6. User clicks "Set Ground Truth"
7. Loading indicator appears
8. Success animation plays
9. Modal closes
10. Page refreshes showing ⭐ badge and evaluation result

---

## PHASE 6: INTEGRATE INTO HOME PAGE (RESULTS TABLE)

### Task 6.1: Add GT Indicators to Results Table
**Priority**: Critical
**Estimated Time**: 1.5 hours

#### Subtasks:
- [ ] **6.1.1** Update `app/page.tsx` to show GT badges
  - Import GTBadge component
  - Add column or inline badge for GT indicator
  - Show GT badge only for jobs with hasGroundTruth

- [ ] **6.1.2** Add evaluation result badges
  - Import EvaluationResultBadge
  - Show pass/fail badge in evaluation column
  - Show accuracy percentage on hover

- [ ] **6.1.3** Add inline expected vs actual comparison
  - For each data column, check if GT exists
  - If GT exists and matches extracted, show green text
  - If GT exists and doesn't match, show red text with expected value below
  - Add small diff indicator

- [ ] **6.1.4** Update filters to include GT status
  - Add "Has GT" filter option
  - Add "Evaluation Result" filter (Pass/Fail/Not Evaluated)
  - Update filter logic

**Example Code**:
```typescript
// In results table row
<TableCell>
  <div className="flex items-center gap-2">
    {job.hasGroundTruth && <GTBadge source={job.gtSource} />}
    <EvaluationResultBadge result={job.evaluationResult} />
  </div>
</TableCell>

// For data columns with GT comparison
{dataColumns.map(col => {
  const extractedValue = job.sessions?.[0]?.extractedData?.[col]
  const gtValue = job.groundTruthData?.[col]
  const hasGT = gtValue != null
  const matches = hasGT && String(extractedValue).toLowerCase() === String(gtValue).toLowerCase()

  return (
    <TableCell key={col} className={matches ? 'text-green-700 font-medium' : hasGT ? 'text-red-700' : 'text-stone-900'}>
      <div>
        {String(extractedValue || '-')}
        {hasGT && !matches && (
          <div className="text-xs text-stone-500 mt-1">
            Expected: {String(gtValue)}
          </div>
        )}
      </div>
    </TableCell>
  )
})}
```

- [ ] **6.1.5** Test with various job states:
  - Job with no GT
  - Job with GT from CSV
  - Job with GT from session
  - Job with matching evaluation (pass)
  - Job with mismatching evaluation (fail)

**Acceptance Criteria**:
- ✅ GT badge (⭐) shows for jobs with GT
- ✅ Evaluation badge shows pass/fail/not evaluated
- ✅ Inline comparison shows expected vs actual
- ✅ Green text for matching values
- ✅ Red text with expected value for mismatches
- ✅ Filters work for GT status
- ✅ Performance acceptable with 100+ jobs

---

## PHASE 7: TESTING

### Task 7.1: Unit Tests
**Priority**: High
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **7.1.1** Test comparison logic (`lib/evaluation/compare.test.ts`)
  - All test cases for compareExact
  - All test cases for evaluateExtraction
  - Edge cases (null, undefined, empty, special chars)

- [ ] **7.1.2** Test evaluation service (`lib/evaluation/service.test.ts`)
  - Mock database queries
  - Test evaluateJob with various inputs
  - Test error handling
  - Test edge cases

- [ ] **7.1.3** Run tests and ensure >80% coverage
  ```bash
  npm test -- --coverage
  ```

**Acceptance Criteria**:
- ✅ All unit tests pass
- ✅ Code coverage >80%
- ✅ No flaky tests
- ✅ Fast execution (<5 seconds)

---

### Task 7.2: Integration Tests
**Priority**: High
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **7.2.1** Test API endpoints with real database
  - Test POST /api/jobs/[id]/set-ground-truth
  - Test GET /api/jobs/[id]/set-ground-truth
  - Test POST /api/jobs/[id]/evaluate
  - Test GET /api/jobs/[id]/evaluate

- [ ] **7.2.2** Test database transactions
  - Setting GT updates job correctly
  - Evaluation results stored correctly
  - GT edit history appended correctly
  - Concurrent updates handled

- [ ] **7.2.3** Test evaluation flow end-to-end
  - Set GT → triggers evaluation → stores results → updates job status

**Acceptance Criteria**:
- ✅ All API endpoints work with real data
- ✅ Database updates are correct
- ✅ Transactions rollback on error
- ✅ No race conditions

---

### Task 7.3: E2E Tests
**Priority**: Medium
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **7.3.1** Create E2E test: Complete GT workflow
  ```typescript
  // test/e2e/gt-setting.spec.ts
  test('User can set GT from session and see evaluation', async ({ page }) => {
    // 1. Navigate to job detail page
    await page.goto('/projects/[project-id]/jobs/[job-id]')

    // 2. Click "Set as GT" button
    await page.click('button:has-text("Set as GT")')

    // 3. Modal opens
    await expect(page.locator('dialog')).toBeVisible()

    // 4. All fields selected by default
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes.first()).toBeChecked()

    // 5. Click "Set Ground Truth"
    await page.click('button:has-text("Set Ground Truth")')

    // 6. Wait for success message
    await expect(page.locator('text=Ground Truth Set Successfully')).toBeVisible()

    // 7. Modal closes
    await expect(page.locator('dialog')).not.toBeVisible()

    // 8. Navigate to home page
    await page.goto('/')

    // 9. See GT badge in results table
    await expect(page.locator('text=★')).toBeVisible()

    // 10. See evaluation badge (Pass or Fail)
    await expect(page.locator('text=Pass,text=Fail').first()).toBeVisible()
  })
  ```

- [ ] **7.3.2** Test error scenarios
  - Setting GT with no extracted data
  - Network error during submission
  - Session not found

- [ ] **7.3.3** Test accessibility
  - Keyboard navigation
  - Screen reader announcements
  - Focus management

**Acceptance Criteria**:
- ✅ E2E test passes consistently
- ✅ Tests run in <30 seconds
- ✅ No test flakiness
- ✅ Accessibility checks pass

---

## PHASE 8: DOCUMENTATION & POLISH

### Task 8.1: API Documentation
**Priority**: Medium
**Estimated Time**: 1 hour

#### Subtasks:
- [ ] **8.1.1** Document POST /api/jobs/[id]/set-ground-truth
  - Request schema
  - Response schema
  - Error codes
  - Examples

- [ ] **8.1.2** Document GET /api/jobs/[id]/set-ground-truth
- [ ] **8.1.3** Document evaluation endpoints
- [ ] **8.1.4** Add to API_DOCS.md

---

### Task 8.2: User Documentation
**Priority**: Medium
**Estimated Time**: 1 hour

#### Subtasks:
- [ ] **8.2.1** Create user guide: "How to Set Ground Truth from Session"
  - Screenshots
  - Step-by-step instructions
  - Common issues and solutions

- [ ] **8.2.2** Add tooltips in UI
  - GT badge tooltip
  - Evaluation badge tooltip
  - Field selection hints

- [ ] **8.2.3** Add help text
  - Modal help text
  - Empty states
  - Error messages

---

### Task 8.3: Performance Optimization
**Priority**: Low
**Estimated Time**: 1 hour

#### Subtasks:
- [ ] **8.3.1** Optimize database queries
  - Add indexes if missing
  - Reduce N+1 queries
  - Use appropriate joins

- [ ] **8.3.2** Optimize evaluation logic
  - Batch evaluations if multiple jobs
  - Cache results when appropriate

- [ ] **8.3.3** Measure and document performance
  - Evaluation time for 100 jobs
  - API response times
  - Page load times

**Acceptance Criteria**:
- ✅ Set GT operation <2 seconds
- ✅ Evaluation <1 second for 100 jobs
- ✅ Page load <2 seconds
- ✅ No performance regressions

---

## USER FLOWS COVERED

### Flow 1: First-Time GT Setting (Happy Path)
1. ✅ User uploads CSV without GT columns
2. ✅ User creates batch and runs jobs
3. ✅ Jobs complete with extracted data
4. ✅ User navigates to job detail page
5. ✅ User views latest session's extracted data
6. ✅ User clicks "Set as GT ★" button
7. ✅ Modal opens with all fields pre-selected
8. ✅ User reviews values
9. ✅ User clicks "Set Ground Truth"
10. ✅ Loading spinner appears
11. ✅ Success animation plays
12. ✅ Modal auto-closes
13. ✅ Job detail page shows GT badge
14. ✅ Evaluation result visible
15. ✅ User returns to home page
16. ✅ Sees ⭐ icon in results table
17. ✅ Sees Pass/Fail badge
18. ✅ Sees inline expected vs actual comparison

### Flow 2: Updating Existing GT
1. ✅ Job already has GT (from CSV or previous session)
2. ✅ New session completes with different data
3. ✅ User wants to update GT with new data
4. ✅ User clicks "Set as GT ★" on new session
5. ✅ Modal shows warning: "GT already exists"
6. ✅ Modal shows existing GT values for comparison
7. ✅ User selects fields to update
8. ✅ User provides reason (optional)
9. ✅ System appends to GT edit history
10. ✅ Re-evaluation triggered automatically
11. ✅ New results shown

### Flow 3: Partial GT Selection
1. ✅ User wants GT for only some fields (not all)
2. ✅ User opens GT selector
3. ✅ User clicks "Deselect All"
4. ✅ User manually selects specific fields
5. ✅ Counter shows "3 of 8 fields selected"
6. ✅ User clicks "Set Ground Truth"
7. ✅ Only selected fields saved as GT
8. ✅ Evaluation only compares selected fields

### Flow 4: Error Handling - No Extracted Data
1. ✅ Session failed or has no extracted data
2. ✅ "Set as GT" button disabled or hidden
3. ✅ Tooltip explains why: "No extracted data available"

### Flow 5: Error Handling - Network Failure
1. ✅ User sets GT
2. ✅ Network request fails (timeout, 500 error)
3. ✅ Error message shown
4. ✅ Modal stays open (doesn't close)
5. ✅ User can retry
6. ✅ No partial data saved (transaction rolled back)

### Flow 6: Multiple Sessions - Choose Which to Use
1. ✅ Job has 3 sessions (retries)
2. ✅ User views session #2
3. ✅ User clicks "Set as GT" on session #2 specifically
4. ✅ System evaluates all sessions against this GT
5. ✅ Shows which session GT came from

### Flow 7: GT History Viewing
1. ✅ User wants to see GT change history
2. ✅ User clicks "View GT History" link
3. ✅ Modal shows timeline:
   - Created from CSV upload (2024-11-04)
   - Updated from session ABC (2024-11-05)
   - Manually edited field "price" (2024-11-06)
4. ✅ Can view each version's data
5. ✅ Can rollback to previous version (future feature)

### Flow 8: Keyboard Navigation (Accessibility)
1. ✅ User navigates with keyboard only
2. ✅ Tab through fields
3. ✅ Space to toggle checkbox
4. ✅ Enter to submit
5. ✅ Escape to cancel
6. ✅ Focus returns to trigger button after close

---

## EDGE CASES COVERED

### Data Edge Cases
- [ ] ✅ Empty extracted data object
- [ ] ✅ Null values in fields
- [ ] ✅ Undefined values
- [ ] ✅ Very long strings (>1000 chars)
- [ ] ✅ Special characters in field names (spaces, symbols)
- [ ] ✅ Unicode characters in values
- [ ] ✅ Numbers stored as strings
- [ ] ✅ Boolean values ("true" vs true)
- [ ] ✅ Arrays in extracted data (convert to string)
- [ ] ✅ Nested objects (flatten or serialize)
- [ ] ✅ Large number of fields (>50)

### Database Edge Cases
- [ ] ✅ Concurrent GT updates to same job
- [ ] ✅ Database connection lost during save
- [ ] ✅ Transaction timeout
- [ ] ✅ Duplicate evaluation (unique constraint)
- [ ] ✅ Orphaned evaluation results (session deleted)
- [ ] ✅ GT edit history exceeds JSONB size limit

### UI Edge Cases
- [ ] ✅ Modal opened while another modal open
- [ ] ✅ User clicks "Set GT" multiple times rapidly
- [ ] ✅ Network slow (>5 seconds)
- [ ] ✅ User closes browser during submission
- [ ] ✅ User navigates away during submission
- [ ] ✅ Screen too small to show all fields
- [ ] ✅ Field values too long (truncate with tooltip)

### Business Logic Edge Cases
- [ ] ✅ Job with no sessions
- [ ] ✅ All sessions failed (no extracted data)
- [ ] ✅ Session completed but extractedData is null
- [ ] ✅ GT exists but session has no extracted data
- [ ] ✅ Evaluation when GT fields don't match extracted fields
- [ ] ✅ Setting GT on job that's currently running
- [ ] ✅ Setting GT on deleted job (404 error)

---

## COMPLETION CHECKLIST

### Before Marking Complete
- [ ] All database migrations run successfully
- [ ] All API endpoints tested and working
- [ ] All UI components render correctly
- [ ] All user flows tested manually
- [ ] All automated tests passing (unit, integration, E2E)
- [ ] Code review completed
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Documentation updated (API + user docs)
- [ ] No critical bugs
- [ ] Deployed to staging for QA
- [ ] QA sign-off received
- [ ] Ready for production deployment

### Success Metrics
- ✅ Users can set GT from session in <10 seconds
- ✅ Evaluation completes in <1 second
- ✅ GT setting success rate >95%
- ✅ Zero data corruption incidents
- ✅ Page load time <2 seconds
- ✅ Zero blocking bugs
- ✅ User satisfaction: "Easy to use" feedback

---

## ESTIMATED TIMELINE

**Total Time**: 3-5 days

### Day 1: Foundation
- Morning: Database schema (Tasks 1.1, 1.2) - 2 hours
- Afternoon: Evaluation logic (Task 2.1) - 2 hours
- Evening: Evaluation service (Task 2.2) - 2 hours

### Day 2: API & Components
- Morning: API endpoints (Tasks 3.1, 3.2) - 2 hours
- Afternoon: GT Selector component (Task 4.1) - 2 hours
- Evening: Badge components (Tasks 4.2, 4.3) - 1 hour

### Day 3: Integration
- Morning: Job detail page integration (Task 5.1) - 2 hours
- Afternoon: Home page integration (Task 6.1) - 2 hours
- Evening: Bug fixes and polish - 1 hour

### Day 4: Testing
- Morning: Unit tests (Task 7.1) - 2 hours
- Afternoon: Integration tests (Task 7.2) - 2 hours
- Evening: E2E tests (Task 7.3) - 2 hours

### Day 5: Documentation & Deploy
- Morning: Documentation (Tasks 8.1, 8.2) - 2 hours
- Afternoon: Performance optimization (Task 8.3) - 1 hour
- Evening: QA, bug fixes, deployment prep - 2 hours

---

## ROLLBACK PLAN

If this feature needs to be rolled back:

1. **Feature Flag**: Set `features.gtFromSession = false`
2. **Hide UI**: GT selector button hidden
3. **API**: Endpoints return 501 Not Implemented
4. **Database**: Keep data (no rollback needed - migrations are additive)
5. **Existing GT**: Jobs with GT from CSV unaffected

No data loss, safe rollback at any point.

---

## NOTES

- This feature is **foundational** for all other GT features
- Success here enables quick review mode, manual editing, click-to-set later
- Focus on UX: Fast, intuitive, forgiving of errors
- Emphasize visual feedback: animations, confirmations, clear states
- Think mobile-first: modal should work on small screens
- Performance matters: Evaluation must be instant (<1 second)

🚀 **Ready to build!**
