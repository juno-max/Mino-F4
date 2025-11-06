# MINO V2 - Comprehensive Gaps Analysis & Implementation Plan

**Date**: 2025-11-05
**Version**: 3.0 - Post-Implementation Review
**Status**: Gap Analysis Complete - Ready for Phase 3 Implementation

---

## Executive Summary

After implementing all 6 planned features from COMPREHENSIVE_FEATURE_PLAN_V2.md, a thorough analysis reveals **23 critical gaps** across 8 categories that prevent MINO v2 from being production-ready. This document provides research-backed solutions and a prioritized implementation roadmap.

**Key Findings**:
- ✅ **Core Features**: 85% complete (GT system, analytics, export, filtering all functional)
- ⚠️ **Critical Gaps**: Authentication (0%), Input Validation (20%), Performance (40%)
- 🔴 **Blocking Issues**: No user authentication, no retry logic, incomplete execution control
- 📊 **Technical Debt**: 15+ areas requiring refactoring

---

## Table of Contents

1. [Critical Gaps (Blocking Production)](#1-critical-gaps-blocking-production)
2. [High-Priority Gaps (Should Have)](#2-high-priority-gaps-should-have)
3. [Medium-Priority Gaps (Nice to Have)](#3-medium-priority-gaps-nice-to-have)
4. [User Flow Gaps](#4-user-flow-gaps)
5. [Technical Debt & Code Quality](#5-technical-debt--code-quality)
6. [Performance & Scalability](#6-performance--scalability)
7. [Security & Compliance](#7-security--compliance)
8. [Comprehensive Implementation Roadmap](#8-comprehensive-implementation-roadmap)

---

## 1. CRITICAL GAPS (Blocking Production)

### 1.1 Authentication & Authorization System

**Current State**: ❌ **0% Complete**
- No authentication system
- Hardcoded user "Jane Cher"
- No session management
- No user roles/permissions
- CORS open to all origins (`*`)
- No API key validation

**Impact**:
- 🔴 **Critical Security Risk**: Anyone can access/modify any data
- 🔴 **Data Isolation**: No way to separate users' data
- 🔴 **Audit Trail**: Can't track who changed what

**Research: Industry Best Practices**

After analyzing **Datadog**, **Grafana**, **PostHog**, **Retool**, and **Segment**, the common patterns are:

1. **Multi-Tenant Architecture** with workspace isolation
2. **Role-Based Access Control (RBAC)** with 3-5 roles
3. **SSO Support** (Google, GitHub, SAML)
4. **API Keys** for programmatic access
5. **Audit Logging** for compliance

**Recommended Solution: Clerk + RBAC**

**Why Clerk**:
- ✅ Drop-in React components (`<SignIn />`, `<UserButton />`)
- ✅ Built-in SSO (Google, GitHub, Microsoft)
- ✅ Organization/workspace support
- ✅ Webhooks for user lifecycle events
- ✅ Free tier: 10K monthly active users
- ✅ Session management handled automatically
- ✅ Middleware protection for API routes

**Alternative: NextAuth.js** (if need full control)

#### 1.1.1 Database Schema Changes

```typescript
// New table: organizations (workspaces)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').unique().notNull(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),

  // Subscription tier
  plan: text('plan').notNull().default('free'), // 'free' | 'pro' | 'enterprise'
  maxProjects: integer('max_projects').default(3),
  maxExecutionsPerMonth: integer('max_executions_per_month').default(100),

  // Usage tracking
  projectsCount: integer('projects_count').default(0),
  executionsThisMonth: integer('executions_this_month').default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// New table: users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
})

// New table: organization_members
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  role: text('role').notNull(), // 'owner' | 'admin' | 'member' | 'viewer'

  invitedBy: uuid('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  joinedAt: timestamp('joined_at'),
})

// New table: api_keys
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),

  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(), // bcrypt hash of API key
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for display (e.g., "mino_pk_1234...")

  permissions: jsonb('permissions').$type<string[]>(), // ['read:projects', 'write:batches', etc.]

  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  revokedAt: timestamp('revoked_at'),
})

// Update existing tables to add organizationId
// ALTER TABLE projects ADD COLUMN organization_id UUID REFERENCES organizations(id);
// ALTER TABLE batches ADD COLUMN organization_id UUID REFERENCES organizations(id);
// ALTER TABLE jobs ADD COLUMN organization_id UUID REFERENCES organizations(id);
```

#### 1.1.2 RBAC Permission Matrix

| Action | Viewer | Member | Admin | Owner |
|--------|--------|--------|-------|-------|
| View projects | ✅ | ✅ | ✅ | ✅ |
| Create project | ❌ | ✅ | ✅ | ✅ |
| Edit project | ❌ | ✅ | ✅ | ✅ |
| Delete project | ❌ | ❌ | ✅ | ✅ |
| Run execution | ❌ | ✅ | ✅ | ✅ |
| View results | ✅ | ✅ | ✅ | ✅ |
| Edit ground truth | ❌ | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ✅ | ✅ |
| Invite members | ❌ | ❌ | ✅ | ✅ |
| Change roles | ❌ | ❌ | ✅ | ✅ |
| Manage billing | ❌ | ❌ | ❌ | ✅ |
| Delete org | ❌ | ❌ | ❌ | ✅ |

#### 1.1.3 API Middleware

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/sign-in', '/sign-up', '/'],
  ignoredRoutes: ['/api/webhooks/clerk'], // Webhook endpoint
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}

// lib/auth-helpers.ts
import { auth } from '@clerk/nextjs'
import { db, organizationMembers, organizations } from '@/db'
import { eq, and } from 'drizzle-orm'

export async function requireAuth() {
  const { userId, orgId } = auth()
  if (!userId) throw new Error('Unauthorized')
  return { userId, orgId }
}

export async function requireRole(minRole: 'viewer' | 'member' | 'admin' | 'owner') {
  const { userId, orgId } = await requireAuth()
  if (!orgId) throw new Error('No organization selected')

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, orgId),
      eq(organizationMembers.userId, userId)
    ),
  })

  if (!membership) throw new Error('Not a member of this organization')

  const roleHierarchy = ['viewer', 'member', 'admin', 'owner']
  const userRoleLevel = roleHierarchy.indexOf(membership.role)
  const requiredRoleLevel = roleHierarchy.indexOf(minRole)

  if (userRoleLevel < requiredRoleLevel) {
    throw new Error(`Requires ${minRole} role or higher`)
  }

  return { userId, orgId, role: membership.role }
}

// Usage in API routes
export async function GET(request: NextRequest) {
  const { userId, orgId } = await requireAuth()

  // Fetch only projects belonging to this org
  const projects = await db.query.projects.findMany({
    where: eq(projects.organizationId, orgId),
  })

  return NextResponse.json(projects)
}
```

#### 1.1.4 User Flows

**Flow 1: New User Sign-up**
1. User visits MINO → Redirected to Clerk sign-in
2. User signs up with Google/Email
3. Clerk creates user account
4. Webhook creates user in MINO database
5. User prompted to create organization (workspace)
6. User redirected to dashboard

**Flow 2: Invite Team Member**
1. Admin clicks "Invite Member" → Opens modal
2. Admin enters email + selects role → Sends invite
3. Invitee receives email → Clicks invite link
4. Invitee signs up/in via Clerk → Auto-joins organization
5. Invitee sees org's projects

**Flow 3: API Key Creation**
1. Owner goes to Settings → API Keys
2. Clicks "Create API Key" → Enters name and permissions
3. System generates key (format: `mino_pk_{random}`)
4. Shows key ONCE → User copies it
5. System stores bcrypt hash + prefix
6. API requests include header: `Authorization: Bearer mino_pk_...`

#### 1.1.5 Implementation Checklist

**Phase 1: Basic Auth (3 days)**
- [ ] Install Clerk (`npm install @clerk/nextjs`)
- [ ] Set up Clerk app at clerk.dev
- [ ] Add environment variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- [ ] Wrap app with `<ClerkProvider>`
- [ ] Add sign-in/sign-up pages
- [ ] Add middleware.ts for route protection
- [ ] Create user webhook endpoint
- [ ] Test sign-up flow

**Phase 2: Organizations (2 days)**
- [ ] Create database tables (organizations, users, organization_members)
- [ ] Run migration script
- [ ] Build organization creation flow
- [ ] Build organization switcher UI
- [ ] Update all API routes to filter by orgId
- [ ] Test multi-org isolation

**Phase 3: RBAC (2 days)**
- [ ] Implement `requireRole()` helper
- [ ] Add role checks to all API routes
- [ ] Build team management UI (invite, remove, change role)
- [ ] Test permission enforcement

**Phase 4: API Keys (1 day)**
- [ ] Create api_keys table
- [ ] Build API key generation endpoint
- [ ] Build API key management UI
- [ ] Implement Bearer token validation middleware
- [ ] Test API key auth

**Total Estimate: 8 days**

---

### 1.2 Input Validation & Error Handling

**Current State**: ⚠️ **20% Complete**
- Basic try/catch blocks exist
- No Zod schemas or validation
- Accepts invalid inputs (empty strings, negative numbers, invalid UUIDs)
- Generic error messages ("Failed to...")
- No transaction handling (except in one route)

**Impact**:
- 🔴 **Data Corruption**: Invalid data stored in database
- 🟡 **Poor UX**: Users don't understand what went wrong
- 🟡 **Debugging**: Hard to trace errors

**Research: Best Practices from tRPC, Remix, Next.js**

Industry-standard validation approach:
1. **Zod schemas** for runtime + compile-time validation
2. **Structured error codes** (not just messages)
3. **Client-side validation** (instant feedback)
4. **Server-side validation** (security)
5. **Transaction wrapping** for multi-step operations

#### 1.2.1 Zod Schema Library

```typescript
// lib/validation-schemas.ts
import { z } from 'zod'

// Base schemas
export const uuidSchema = z.string().uuid()
export const urlSchema = z.string().url()
export const emailSchema = z.string().email()

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
})

export const updateProjectSchema = createProjectSchema.partial()

// Batch schemas
export const createBatchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  csvData: z.array(z.record(z.any())).min(1, 'At least one row required'),
  columnSchema: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'number', 'url', 'email', 'date']),
    isUrl: z.boolean(),
    isGroundTruth: z.boolean(),
  })),
})

// Execution schemas
export const executeSchema = z.object({
  executionType: z.enum(['test', 'production']),
  sampleSize: z.number().int().min(1).max(1000),
  useAgentQL: z.boolean().optional(),
})

export const updateConcurrencySchema = z.object({
  concurrency: z.number().int().min(1).max(50),
})

// Ground truth schemas
export const bulkSetGTSchema = z.object({
  updates: z.array(z.object({
    jobId: uuidSchema,
    groundTruthData: z.record(z.string()),
  })).min(1, 'At least one update required'),
})

// Export schemas
export const exportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']),
  columns: z.array(z.string()).optional(),
  includeGroundTruth: z.boolean().optional(),
  includeComparison: z.boolean().optional(),
  filters: z.object({
    status: z.array(z.enum(['queued', 'running', 'completed', 'error'])).optional(),
    hasGroundTruth: z.boolean().optional(),
    accuracyRange: z.object({
      min: z.number().min(0).max(100),
      max: z.number().min(0).max(100),
    }).optional(),
  }).optional(),
})

// Filter schemas
export const jobFilterSchema = z.object({
  status: z.string().optional(), // comma-separated
  hasGroundTruth: z.enum(['true', 'false']).optional(),
  evaluationResult: z.string().optional(), // comma-separated
  accuracyMin: z.string().regex(/^\d+$/).optional(),
  accuracyMax: z.string().regex(/^\d+$/).optional(),
  search: z.string().max(200).optional(),
})

// Instruction version schemas
export const createVersionSchema = z.object({
  instructions: z.string().min(10),
  changeDescription: z.string().max(500).optional(),
  setAsProduction: z.boolean().optional(),
})
```

#### 1.2.2 API Route Validation Pattern

```typescript
// lib/api-helpers.ts
import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'

export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: result.error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        ),
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid JSON', code: 'INVALID_JSON' },
        { status: 400 }
      ),
    }
  }
}

// Usage in API route
import { validateRequest } from '@/lib/api-helpers'
import { createProjectSchema } from '@/lib/validation-schemas'

export async function POST(request: NextRequest) {
  const validation = await validateRequest(request, createProjectSchema)
  if (!validation.success) return validation.response

  const { data } = validation
  // data is now type-safe and validated!

  const [project] = await db.insert(projects).values({
    name: data.name,
    description: data.description,
    instructions: data.instructions,
    organizationId: orgId,
  }).returning()

  return NextResponse.json(project)
}
```

#### 1.2.3 Structured Error Codes

```typescript
// lib/error-codes.ts
export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_UUID: 'INVALID_UUID',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Business Logic
  EXECUTION_ALREADY_RUNNING: 'EXECUTION_ALREADY_RUNNING',
  BATCH_EMPTY: 'BATCH_EMPTY',
  NO_GROUND_TRUTH: 'NO_GROUND_TRUTH',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // External Services
  EVA_API_ERROR: 'EVA_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const

export class ApiError extends Error {
  constructor(
    public code: keyof typeof ErrorCodes,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// lib/error-handler.ts
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: ErrorCodes.DATABASE_ERROR,
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'Unknown error', code: 'UNKNOWN_ERROR' },
    { status: 500 }
  )
}

// Usage
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, createProjectSchema)
    if (!validation.success) return validation.response

    const { orgId } = await requireAuth()

    // Check quota
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    })

    if (org.projectsCount >= org.maxProjects) {
      throw new ApiError(
        'QUOTA_EXCEEDED',
        `You have reached your plan's limit of ${org.maxProjects} projects`,
        403,
        { current: org.projectsCount, max: org.maxProjects }
      )
    }

    // ... rest of logic

  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 1.2.4 Transaction Handling

```typescript
// Wrap multi-step operations in transactions

import { db } from '@/db'

export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, bulkSetGTSchema)
    if (!validation.success) return validation.response

    const { updates } = validation.data

    // Use transaction for atomicity
    await db.transaction(async (tx) => {
      // Update all jobs
      for (const update of updates) {
        await tx.update(jobs)
          .set({
            groundTruthData: update.groundTruthData,
            hasGroundTruth: true,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, update.jobId))
      }

      // Recalculate metrics
      await recalculateMetrics(tx, batchId)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 1.2.5 Implementation Checklist

**Phase 1: Zod Setup (2 days)**
- [ ] Install Zod (`npm install zod`)
- [ ] Create validation-schemas.ts with all schemas
- [ ] Create api-helpers.ts with validateRequest utility
- [ ] Test validation on one route

**Phase 2: Update All Routes (3 days)**
- [ ] Update all POST/PUT routes to use validation
- [ ] Update all GET routes to validate query params
- [ ] Add structured error codes
- [ ] Replace generic error messages

**Phase 3: Transaction Handling (1 day)**
- [ ] Identify multi-step operations
- [ ] Wrap in db.transaction()
- [ ] Test rollback behavior

**Total Estimate: 6 days**

---

### 1.3 Execution Resume & Retry Logic

**Current State**: ⚠️ **30% Complete**
- Pause/Resume/Stop API endpoints exist
- Database status updates work
- **But**: Paused jobs don't actually restart
- **But**: No retry logic for failed jobs
- **But**: No exponential backoff

**Impact**:
- 🔴 **Broken Feature**: Resume button doesn't work
- 🟡 **Manual Work**: Users must re-run failed jobs manually
- 🟡 **Wasted Resources**: Transient failures treated as permanent

**Research: Retry Best Practices from AWS, Temporal, Bull Queue**

Industry-standard patterns:
1. **Exponential Backoff**: Wait 1s, 2s, 4s, 8s, 16s between retries
2. **Max Retries**: Limit to 3-5 attempts
3. **Retry Eligibility**: Only retry transient errors (network, timeout)
4. **Dead Letter Queue**: Move permanently failed jobs to separate queue
5. **Jitter**: Add randomness to prevent thundering herd

#### 1.3.1 Database Schema Enhancements

```typescript
// Enhance jobs table
export const jobs = pgTable('jobs', {
  // ... existing fields ...

  // Retry tracking
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  nextRetryAt: timestamp('next_retry_at'),
  retryReason: text('retry_reason'),

  // Failure classification
  failureType: text('failure_type'), // 'transient' | 'permanent' | null
  errorCode: text('error_code'),

  // Resume tracking
  pausedAt: timestamp('paused_at'),
  resumedAt: timestamp('resumed_at'),
})

// New table: retry_queue
export const retryQueue = pgTable('retry_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  executionId: uuid('execution_id').references(() => executions.id).notNull(),

  attemptNumber: integer('attempt_number').notNull(),
  scheduledFor: timestamp('scheduled_for').notNull(),

  errorMessage: text('error_message'),
  stackTrace: text('stack_trace'),

  status: text('status').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'

  createdAt: timestamp('created_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
})

CREATE INDEX idx_retry_queue_scheduled ON retry_queue(scheduled_for, status);
```

#### 1.3.2 Error Classification

```typescript
// lib/error-classifier.ts

export type ErrorType = 'transient' | 'permanent'

export function classifyError(error: Error): {
  type: ErrorType
  code: string
  shouldRetry: boolean
} {
  const message = error.message.toLowerCase()

  // Transient errors (should retry)
  const transientPatterns = [
    /timeout/,
    /econnrefused/,
    /enotfound/,
    /network error/,
    /socket hang up/,
    /429/, // Rate limit
    /502/, // Bad gateway
    /503/, // Service unavailable
    /504/, // Gateway timeout
  ]

  for (const pattern of transientPatterns) {
    if (pattern.test(message)) {
      return {
        type: 'transient',
        code: 'TRANSIENT_ERROR',
        shouldRetry: true,
      }
    }
  }

  // Permanent errors (should not retry)
  const permanentPatterns = [
    /400/, // Bad request
    /401/, // Unauthorized
    /403/, // Forbidden
    /404/, // Not found
    /invalid credentials/,
    /malformed/,
    /syntax error/,
  ]

  for (const pattern of permanentPatterns) {
    if (pattern.test(message)) {
      return {
        type: 'permanent',
        code: 'PERMANENT_ERROR',
        shouldRetry: false,
      }
    }
  }

  // Default to transient (be optimistic)
  return {
    type: 'transient',
    code: 'UNKNOWN_ERROR',
    shouldRetry: true,
  }
}
```

#### 1.3.3 Retry Logic with Exponential Backoff

```typescript
// lib/retry-manager.ts

interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  jitterMs: number
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000, // Start with 1 second
  maxDelayMs: 60000, // Cap at 1 minute
  jitterMs: 500, // Add up to 500ms randomness
}

export function calculateRetryDelay(attemptNumber: number, config = defaultConfig): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, ...
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attemptNumber)

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)

  // Add jitter (randomness to prevent thundering herd)
  const jitter = Math.random() * config.jitterMs

  return cappedDelay + jitter
}

export async function scheduleRetry(
  jobId: string,
  executionId: string,
  attemptNumber: number,
  error: Error
): Promise<void> {
  const classification = classifyError(error)

  // Don't retry permanent errors
  if (!classification.shouldRetry) {
    await db.update(jobs)
      .set({
        status: 'error',
        failureType: 'permanent',
        errorCode: classification.code,
        retryReason: 'Permanent error - will not retry',
      })
      .where(eq(jobs.id, jobId))
    return
  }

  // Check if max retries exceeded
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
  })

  if (!job) return

  if (attemptNumber >= job.maxRetries) {
    await db.update(jobs)
      .set({
        status: 'error',
        failureType: 'transient',
        errorCode: classification.code,
        retryReason: `Max retries (${job.maxRetries}) exceeded`,
      })
      .where(eq(jobs.id, jobId))
    return
  }

  // Calculate next retry time
  const delayMs = calculateRetryDelay(attemptNumber)
  const nextRetryAt = new Date(Date.now() + delayMs)

  // Update job
  await db.update(jobs)
    .set({
      retryCount: attemptNumber,
      nextRetryAt,
      retryReason: `Retry ${attemptNumber}/${job.maxRetries} scheduled for ${nextRetryAt.toISOString()}`,
      errorCode: classification.code,
    })
    .where(eq(jobs.id, jobId))

  // Add to retry queue
  await db.insert(retryQueue).values({
    jobId,
    executionId,
    attemptNumber,
    scheduledFor: nextRetryAt,
    errorMessage: error.message,
    stackTrace: error.stack,
    status: 'pending',
  })

  console.log(`[Retry] Job ${jobId} scheduled for retry ${attemptNumber} at ${nextRetryAt}`)
}
```

#### 1.3.4 Retry Worker (Background Process)

```typescript
// lib/retry-worker.ts
// This should run as a separate process or cron job

import { db, retryQueue, jobs, executions } from '@/db'
import { eq, and, lte } from 'drizzle-orm'
import { executeEvaWorkflow } from '@/lib/eva-executor'

export async function processRetryQueue() {
  console.log('[RetryWorker] Checking for jobs to retry...')

  // Find jobs scheduled for retry
  const jobsToRetry = await db.query.retryQueue.findMany({
    where: and(
      eq(retryQueue.status, 'pending'),
      lte(retryQueue.scheduledFor, new Date())
    ),
    limit: 10, // Process 10 at a time
    with: {
      job: true,
    },
  })

  if (jobsToRetry.length === 0) {
    console.log('[RetryWorker] No jobs to retry')
    return
  }

  console.log(`[RetryWorker] Found ${jobsToRetry.length} jobs to retry`)

  for (const retryItem of jobsToRetry) {
    try {
      // Mark as processing
      await db.update(retryQueue)
        .set({ status: 'processing', processedAt: new Date() })
        .where(eq(retryQueue.id, retryItem.id))

      // Update job status
      await db.update(jobs)
        .set({ status: 'running', resumedAt: new Date() })
        .where(eq(jobs.id, retryItem.jobId))

      // Re-execute job
      const job = retryItem.job
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, job.projectId),
      })

      if (!project) throw new Error('Project not found')

      const result = await executeEvaWorkflow(
        job.siteUrl,
        project.instructions,
        [], // column schema
        job.groundTruthData,
        async (url) => { /* streaming callback */ }
      )

      if (result.error) {
        // Retry failed - schedule another retry
        await scheduleRetry(
          job.id,
          retryItem.executionId,
          retryItem.attemptNumber + 1,
          new Error(result.error)
        )

        await db.update(retryQueue)
          .set({ status: 'failed' })
          .where(eq(retryQueue.id, retryItem.id))
      } else {
        // Retry succeeded!
        await db.update(jobs)
          .set({
            status: 'completed',
            retryReason: `Succeeded on retry ${retryItem.attemptNumber}`,
          })
          .where(eq(jobs.id, job.id))

        await db.update(retryQueue)
          .set({ status: 'completed' })
          .where(eq(retryQueue.id, retryItem.id))

        console.log(`[RetryWorker] Job ${job.id} succeeded on retry ${retryItem.attemptNumber}`)
      }

    } catch (error) {
      console.error(`[RetryWorker] Error processing retry:`, error)
      await db.update(retryQueue)
        .set({ status: 'failed' })
        .where(eq(retryQueue.id, retryItem.id))
    }
  }
}

// Run every 30 seconds
setInterval(processRetryQueue, 30_000)
```

#### 1.3.5 Resume Execution Implementation

```typescript
// app/api/executions/[id]/resume/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId } = await requireAuth()

    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, params.id),
    })

    if (!execution) {
      throw new ApiError('NOT_FOUND', 'Execution not found', 404)
    }

    if (execution.status !== 'paused') {
      throw new ApiError(
        'INVALID_STATE',
        'Execution must be paused to resume',
        400
      )
    }

    // Find all paused jobs for this execution
    const pausedJobs = await db.query.jobs.findMany({
      where: and(
        eq(jobs.batchId, execution.batchId),
        eq(jobs.status, 'queued') // Paused jobs are set to 'queued'
      ),
    })

    // Update execution status
    await db.update(executions)
      .set({
        status: 'running',
        resumedAt: new Date(),
        pausedDuration: execution.pausedAt
          ? Date.now() - execution.pausedAt.getTime()
          : null,
      })
      .where(eq(executions.id, params.id))

    // Restart execution in background
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, execution.projectId),
    })

    if (!project) throw new ApiError('NOT_FOUND', 'Project not found', 404)

    // Resume execution (don't await - run in background)
    executeEvaJobs(execution.id, pausedJobs, project.instructions, [])
      .catch(err => console.error('[Resume] Error:', err))

    return NextResponse.json({
      success: true,
      execution: { ...execution, status: 'running' },
      resumedJobs: pausedJobs.length,
    })

  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 1.3.6 Implementation Checklist

**Phase 1: Error Classification (1 day)**
- [ ] Create error-classifier.ts
- [ ] Add error classification to executeEvaJobs
- [ ] Test classification logic

**Phase 2: Retry Logic (2 days)**
- [ ] Create retry_queue table
- [ ] Implement calculateRetryDelay and scheduleRetry
- [ ] Update executeEvaJobs to call scheduleRetry on error
- [ ] Test exponential backoff

**Phase 3: Retry Worker (2 days)**
- [ ] Create retry-worker.ts
- [ ] Integrate into server.ts
- [ ] Add worker health monitoring
- [ ] Test end-to-end retry flow

**Phase 4: Resume Execution (1 day)**
- [ ] Fix resume API endpoint
- [ ] Test pause → resume flow
- [ ] Handle edge cases (already completed, no jobs)

**Total Estimate: 6 days**

---

### 1.4 Database Indexes & Performance

**Current State**: ⚠️ **40% Complete**
- Only 2 indexes defined in schema
- No pagination on large queries
- N+1 query problems
- No query result caching

**Impact**:
- 🟡 **Slow Queries**: Queries slow down as data grows
- 🟡 **High Database Load**: Unnecessary full table scans
- 🟡 **Poor UX**: Long load times

**Research: Database Best Practices from Prisma, Hasura, PostgREST**

Key principles:
1. **Index Foreign Keys**: Always index columns used in WHERE/JOIN
2. **Composite Indexes**: For common query patterns
3. **Partial Indexes**: For status-based queries
4. **EXPLAIN ANALYZE**: Profile slow queries
5. **Pagination**: Cursor-based for large datasets

#### 1.4.1 Missing Indexes

```sql
-- Add indexes to all foreign keys
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_batches_project_id ON batches(project_id);
CREATE INDEX idx_batches_organization_id ON batches(organization_id);
CREATE INDEX idx_jobs_batch_id ON jobs(batch_id);
CREATE INDEX idx_jobs_project_id ON jobs(project_id);
CREATE INDEX idx_jobs_organization_id ON jobs(organization_id);
CREATE INDEX idx_sessions_job_id ON sessions(job_id);
CREATE INDEX idx_executions_batch_id ON executions(batch_id);
CREATE INDEX idx_executions_project_id ON executions(project_id);

-- Add status indexes (frequently filtered)
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Composite indexes for common queries
CREATE INDEX idx_jobs_batch_status ON jobs(batch_id, status);
CREATE INDEX idx_jobs_batch_gt ON jobs(batch_id, has_ground_truth);
CREATE INDEX idx_jobs_batch_evaluated ON jobs(batch_id, is_evaluated, evaluation_result);

-- Timestamp indexes for sorting
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_batches_created_at ON batches(created_at DESC);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_executions_created_at ON executions(created_at DESC);

-- Partial indexes (for specific statuses)
CREATE INDEX idx_jobs_running ON jobs(batch_id) WHERE status = 'running';
CREATE INDEX idx_jobs_queued ON jobs(batch_id) WHERE status = 'queued';
CREATE INDEX idx_jobs_with_gt ON jobs(batch_id) WHERE has_ground_truth = true;

-- Full-text search index (for advanced search)
CREATE INDEX idx_jobs_site_url_gin ON jobs USING gin(to_tsvector('english', site_url));
```

#### 1.4.2 Pagination Implementation

```typescript
// lib/pagination.ts

export interface PaginationParams {
  cursor?: string // ID of last item from previous page
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    nextCursor: string | null
    hasMore: boolean
    total?: number
  }
}

// Cursor-based pagination (better for large datasets)
export async function paginateQuery<T extends { id: string }>(
  query: any, // Drizzle query
  params: PaginationParams
): Promise<PaginatedResponse<T>> {
  const limit = Math.min(params.limit || 50, 100) // Cap at 100

  // Fetch one extra to check if there are more
  const items = await query.limit(limit + 1)

  const hasMore = items.length > limit
  const data = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? data[data.length - 1].id : null

  return {
    data,
    pagination: {
      nextCursor,
      hasMore,
    },
  }
}

// Usage in API route
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const cursor = searchParams.get('cursor')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = db.query.jobs.findMany({
    where: eq(jobs.batchId, batchId),
    orderBy: [desc(jobs.createdAt)],
    limit: limit + 1,
  })

  if (cursor) {
    query = query.where(lt(jobs.id, cursor))
  }

  const result = await paginateQuery(query, { cursor, limit })

  return NextResponse.json(result)
}
```

#### 1.4.3 Query Optimization - Eager Loading

```typescript
// Before (N+1 problem)
const projects = await db.query.projects.findMany()
for (const project of projects) {
  const batches = await db.query.batches.findMany({
    where: eq(batches.projectId, project.id),
  })
  project.batches = batches // N additional queries!
}

// After (eager loading with 'with')
const projects = await db.query.projects.findMany({
  with: {
    batches: {
      orderBy: [desc(batches.createdAt)],
      limit: 10, // Only get recent 10
    },
  },
})
// Just 1 query!
```

#### 1.4.4 Query Caching with React Query

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.Node }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        cacheTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Usage in component
import { useQuery } from '@tanstack/react-query'

export function BatchList({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['batches', projectId],
    queryFn: () => fetch(`/api/projects/${projectId}/batches`).then(r => r.json()),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  })

  // Data is cached - subsequent renders don't re-fetch!
}
```

#### 1.4.5 Implementation Checklist

**Phase 1: Add Indexes (1 day)**
- [ ] Create migration script with all indexes
- [ ] Run EXPLAIN ANALYZE on slow queries
- [ ] Verify index usage with EXPLAIN
- [ ] Measure query time improvements

**Phase 2: Pagination (2 days)**
- [ ] Install React Query (`npm install @tanstack/react-query`)
- [ ] Implement cursor-based pagination
- [ ] Update all list endpoints
- [ ] Update UI components to use pagination

**Phase 3: Query Optimization (2 days)**
- [ ] Find and fix N+1 queries
- [ ] Add eager loading where needed
- [ ] Implement query result caching
- [ ] Add cache invalidation on mutations

**Total Estimate: 5 days**

---

## 2. HIGH-PRIORITY GAPS (Should Have)

### 2.1 Live Progress Tracking

**Current State**: Fields exist but not updated
- `job.progressPercentage` always 0
- `job.currentStep` never set
- `job.currentUrl` never set

**Solution**: Update progress during execution

```typescript
// In executeEvaJobs, add progress callbacks

const result = await executeEvaWorkflow(
  job.siteUrl,
  projectInstructions,
  columnSchema,
  job.groundTruthData,
  async (url) => {
    // Streaming URL callback
    await db.update(sessions).set({ streamingUrl: url }).where(eq(sessions.id, session.id))
  },
  async (step, progress) => {
    // Progress callback (NEW)
    await db.update(jobs).set({
      currentStep: step, // "Navigating to URL", "Extracting price", etc.
      currentUrl: url,
      progressPercentage: progress, // 0-100
    }).where(eq(jobs.id, job.id))

    // Publish progress event
    publishJobProgress({
      executionId,
      jobId: job.id,
      progress,
      currentStep: step,
    })
  }
)
```

**Estimate**: 1 day

---

### 2.2 Actual Concurrency Control

**Current State**: Concurrency value stored but not enforced

**Solution**: Use p-limit library

```typescript
import pLimit from 'p-limit'

async function executeEvaJobs(executionId: string, jobsList: any[], ...) {
  const execution = await db.query.executions.findFirst({
    where: eq(executions.id, executionId),
  })

  const limit = pLimit(execution.concurrency || 5)

  // Process jobs with concurrency limit
  const promises = jobsList.map(job =>
    limit(() => executeJob(job, executionId))
  )

  await Promise.all(promises)
}

async function executeJob(job: any, executionId: string) {
  // ... individual job execution logic
}

// Dynamic concurrency adjustment
export async function POST(request: NextRequest) {
  const { concurrency } = await validateRequest(request, updateConcurrencySchema)

  await db.update(executions)
    .set({ concurrency })
    .where(eq(executions.id, executionId))

  // Signal running execution to adjust (use event emitter or shared state)
  adjustConcurrency(executionId, concurrency)

  return NextResponse.json({ success: true })
}
```

**Estimate**: 2 days

---

### 2.3 Bulk Operations

**Missing**: Bulk delete, bulk re-run, bulk update

**Solution**: Add bulk action APIs

```typescript
// POST /api/batches/[id]/jobs/bulk-action
interface BulkActionRequest {
  action: 'delete' | 'rerun' | 'update_instructions'
  jobIds: string[]
  params?: Record<string, any>
}

export async function POST(request: NextRequest) {
  const { action, jobIds, params } = await validateRequest(request, bulkActionSchema)

  switch (action) {
    case 'delete':
      await db.delete(jobs).where(inArray(jobs.id, jobIds))
      break

    case 'rerun':
      // Reset jobs to queued and create new execution
      await db.update(jobs)
        .set({ status: 'queued', retryCount: 0 })
        .where(inArray(jobs.id, jobIds))

      const [execution] = await db.insert(executions).values({
        batchId: params.batchId,
        status: 'running',
        totalJobs: jobIds.length,
        ...
      }).returning()

      // Start execution
      executeEvaJobs(execution.id, jobsList, ...)
      break

    case 'update_instructions':
      await db.update(jobs)
        .set({ goal: params.newInstructions })
        .where(inArray(jobs.id, jobIds))
      break
  }

  return NextResponse.json({ success: true })
}
```

**Estimate**: 2 days

---

### 2.4 Execution Comparison Dashboard

**Missing**: Compare two executions side-by-side

**Solution**: Build comparison page

```typescript
// app/projects/[id]/batches/[batchId]/compare/page.tsx

interface ComparisonPageProps {
  searchParams: {
    executions: string // Comma-separated execution IDs
  }
}

export default async function ComparisonPage({ searchParams }: ComparisonPageProps) {
  const executionIds = searchParams.executions.split(',')

  const executions = await Promise.all(
    executionIds.map(id =>
      db.query.executions.findFirst({
        where: eq(executions.id, id),
        with: { jobs: true },
      })
    )
  )

  return (
    <div>
      <h1>Execution Comparison</h1>

      {/* Side-by-side stats */}
      <div className="grid grid-cols-2 gap-4">
        {executions.map(exec => (
          <Card key={exec.id}>
            <h3>{exec.createdAt.toLocaleString()}</h3>
            <div>Accuracy: {exec.accuracyPercentage}%</div>
            <div>Passed: {exec.jobs.filter(j => j.evaluationResult === 'pass').length}</div>
            <div>Failed: {exec.jobs.filter(j => j.evaluationResult === 'fail').length}</div>
          </Card>
        ))}
      </div>

      {/* Delta chart */}
      <BarChart
        data={[
          {
            metric: 'Accuracy',
            execution1: executions[0].accuracyPercentage,
            execution2: executions[1].accuracyPercentage,
          },
          ...
        ]}
      />

      {/* Job-by-job comparison */}
      <Table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Execution 1</th>
            <th>Execution 2</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          {/* Compare each job across executions */}
        </tbody>
      </Table>
    </div>
  )
}
```

**Estimate**: 3 days

---

### 2.5 Failure Pattern Analysis

**Current State**: Table exists, not populated

**Solution**: Analyze and categorize failures

```typescript
// lib/failure-analyzer.ts

interface FailurePattern {
  type: string
  description: string
  affectedColumns: string[]
  frequency: number
  examples: Array<{
    jobId: string
    extracted: any
    expected: any
  }>
}

export async function analyzeFailures(batchId: string): Promise<FailurePattern[]> {
  const failedJobs = await db.query.jobs.findMany({
    where: and(
      eq(jobs.batchId, batchId),
      eq(jobs.evaluationResult, 'fail')
    ),
    with: {
      sessions: {
        limit: 1,
        orderBy: [desc(sessions.createdAt)],
      },
    },
  })

  const patterns: Map<string, FailurePattern> = new Map()

  for (const job of failedJobs) {
    if (!job.groundTruthData || !job.sessions[0]?.extractedData) continue

    const extracted = job.sessions[0].extractedData as Record<string, any>
    const expected = job.groundTruthData as Record<string, any>

    for (const [key, expectedValue] of Object.entries(expected)) {
      const extractedValue = extracted[key]

      // Categorize failure type
      let failureType: string
      let description: string

      if (extractedValue === null || extractedValue === undefined) {
        failureType = 'missing_extraction'
        description = `Failed to extract ${key}`
      } else if (typeof extractedValue !== typeof expectedValue) {
        failureType = 'type_mismatch'
        description = `Type mismatch for ${key}: expected ${typeof expectedValue}, got ${typeof extractedValue}`
      } else if (String(extractedValue).toLowerCase() !== String(expectedValue).toLowerCase()) {
        // Check if it's a partial match
        if (String(extractedValue).toLowerCase().includes(String(expectedValue).toLowerCase()) ||
            String(expectedValue).toLowerCase().includes(String(extractedValue).toLowerCase())) {
          failureType = 'partial_match'
          description = `Partial match for ${key}`
        } else {
          failureType = 'value_mismatch'
          description = `Incorrect value for ${key}`
        }
      } else {
        continue // Case mismatch only
      }

      // Group patterns
      const patternKey = `${failureType}:${key}`
      const existing = patterns.get(patternKey)

      if (existing) {
        existing.frequency++
        if (existing.examples.length < 5) {
          existing.examples.push({
            jobId: job.id,
            extracted: extractedValue,
            expected: expectedValue,
          })
        }
      } else {
        patterns.set(patternKey, {
          type: failureType,
          description,
          affectedColumns: [key],
          frequency: 1,
          examples: [{
            jobId: job.id,
            extracted: extractedValue,
            expected: expectedValue,
          }],
        })
      }
    }
  }

  // Store in database
  const patternsArray = Array.from(patterns.values())
  for (const pattern of patternsArray) {
    await db.insert(failurePatterns).values({
      batchId,
      patternType: pattern.type,
      description: pattern.description,
      frequency: pattern.frequency,
      affectedColumns: pattern.affectedColumns,
      exampleJobs: pattern.examples.map(e => e.jobId),
    })
  }

  return patternsArray
}
```

**Estimate**: 2 days

---

## 3. MEDIUM-PRIORITY GAPS (Nice to Have)

### 3.1 Cost Tracking

**Fields exist**: `estimatedCost`, `actualCost`
**Missing**: Calculation logic

**Solution**:

```typescript
// lib/cost-calculator.ts

interface CostConfig {
  evaApiCostPerRequest: number // e.g., $0.05
  storagePerGB: number // e.g., $0.03
  databaseQueryCost: number // e.g., $0.0001
}

const defaultCost: CostConfig = {
  evaApiCostPerRequest: 0.05,
  storagePerGB: 0.03,
  databaseQueryCost: 0.0001,
}

export function estimateExecutionCost(
  totalJobs: number,
  avgScreenshotsPerJob: number = 10,
  config = defaultCost
): number {
  const apiCost = totalJobs * config.evaApiCostPerRequest
  const storageCost = totalJobs * avgScreenshotsPerJob * 0.5 * config.storagePerGB / 1000 // 0.5MB per screenshot
  const dbCost = totalJobs * 20 * config.databaseQueryCost // ~20 queries per job

  return apiCost + storageCost + dbCost
}

// Update execution after completion
const actualCost = estimateExecutionCost(execution.completedJobs)
await db.update(executions)
  .set({ actualCost })
  .where(eq(executions.id, executionId))
```

**Estimate**: 1 day

---

### 3.2 Webhook Support

**Missing**: Notify external systems

**Solution**:

```typescript
// New table: webhooks
export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  url: text('url').notNull(),
  secret: text('secret').notNull(), // For HMAC signature

  events: jsonb('events').$type<string[]>(), // ['execution.completed', 'job.failed', etc.]

  isActive: boolean('is_active').default(true),
  failureCount: integer('failure_count').default(0),
  lastSuccessAt: timestamp('last_success_at'),
  lastFailureAt: timestamp('last_failure_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// lib/webhook-sender.ts
import crypto from 'crypto'

export async function sendWebhook(
  event: string,
  data: any
) {
  const webhooks = await db.query.webhooks.findMany({
    where: and(
      eq(webhooks.organizationId, data.organizationId),
      eq(webhooks.isActive, true)
    ),
  })

  for (const webhook of webhooks) {
    if (!webhook.events.includes(event)) continue

    try {
      const payload = JSON.stringify({ event, data, timestamp: new Date() })
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(payload)
        .digest('hex')

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mino-Signature': signature,
          'X-Mino-Event': event,
        },
        body: payload,
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      await db.update(webhooks)
        .set({ lastSuccessAt: new Date(), failureCount: 0 })
        .where(eq(webhooks.id, webhook.id))

    } catch (error) {
      console.error(`Webhook error:`, error)
      await db.update(webhooks)
        .set({
          lastFailureAt: new Date(),
          failureCount: webhook.failureCount + 1,
          // Disable after 5 consecutive failures
          isActive: webhook.failureCount + 1 < 5,
        })
        .where(eq(webhooks.id, webhook.id))
    }
  }
}

// Usage
await sendWebhook('execution.completed', {
  organizationId: execution.organizationId,
  executionId: execution.id,
  batchId: execution.batchId,
  accuracy: execution.accuracyPercentage,
})
```

**Estimate**: 2 days

---

### 3.3 Audit Logging

**Missing**: Track all changes

**Solution**:

```typescript
// New table: audit_logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  userId: uuid('user_id').references(() => users.id),

  action: text('action').notNull(), // 'created', 'updated', 'deleted'
  resourceType: text('resource_type').notNull(), // 'project', 'batch', 'job', etc.
  resourceId: uuid('resource_id').notNull(),

  changes: jsonb('changes').$type<{
    before: Record<string, any>
    after: Record<string, any>
  }>(),

  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Middleware to log all changes
export async function logAudit(
  action: string,
  resourceType: string,
  resourceId: string,
  changes: any,
  request: NextRequest
) {
  const { userId, orgId } = await requireAuth()

  await db.insert(auditLogs).values({
    organizationId: orgId,
    userId,
    action,
    resourceType,
    resourceId,
    changes,
    ipAddress: request.headers.get('x-forwarded-for') || request.ip,
    userAgent: request.headers.get('user-agent'),
  })
}

// Usage
export async function PUT(request: NextRequest) {
  const oldProject = await db.query.projects.findFirst(...)

  // ... update project ...

  const newProject = await db.query.projects.findFirst(...)

  await logAudit('updated', 'project', project.id, {
    before: oldProject,
    after: newProject,
  }, request)
}
```

**Estimate**: 2 days

---

### 3.4 Rate Limiting

**Missing**: Prevent abuse

**Solution**: Use upstash/ratelimit

```typescript
// lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Different limits for different tiers
export const rateLimiters = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 per hour
  }),
  enterprise: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10000, '1 h'), // 10K per hour
  }),
}

// Middleware
export async function checkRateLimit(orgId: string, plan: string) {
  const limiter = rateLimiters[plan] || rateLimiters.free
  const { success, remaining } = await limiter.limit(orgId)

  if (!success) {
    throw new ApiError(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded. Try again later.`,
      429,
      { remaining: 0 }
    )
  }

  return { remaining }
}

// Usage in API route
export async function POST(request: NextRequest) {
  const { orgId } = await requireAuth()
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  })

  await checkRateLimit(orgId, org.plan)

  // ... rest of logic
}
```

**Estimate**: 1 day

---

## 4. USER FLOW GAPS

### 4.1 Onboarding Flow (NEW)

**Missing**: First-time user experience

**Solution**: Multi-step onboarding

```
Step 1: Welcome → Explain MINO's value prop
Step 2: Create First Project → Guide through setup
Step 3: Upload Sample CSV → Provide template
Step 4: Set Instructions → Examples provided
Step 5: Run First Test → Watch execution
Step 6: Review Results → Explain metrics
Step 7: Set Ground Truth → Show bulk editor
Step 8: Re-run & Compare → Show improvement
```

**Estimate**: 3 days

---

### 4.2 Error Recovery Flow (NEW)

**Current**: User sees "error" status, no guidance

**Solution**: Error details + suggested actions

```typescript
// When job fails:
<ErrorCard>
  <h4>Job Failed: {job.siteUrl}</h4>
  <p>Error: {job.errorMessage}</p>

  {/* Suggested actions based on error type */}
  {job.errorCode === 'TIMEOUT' && (
    <div>
      <p>This site took too long to load.</p>
      <Button>Retry with longer timeout</Button>
      <Button>Skip this site</Button>
    </div>
  )}

  {job.errorCode === 'SELECTOR_NOT_FOUND' && (
    <div>
      <p>The agent couldn't find the data on the page.</p>
      <Button>View screenshot</Button>
      <Button>Edit instructions</Button>
      <Button>Try different selector</Button>
    </div>
  )}
</ErrorCard>
```

**Estimate**: 2 days

---

### 4.3 Batch Management Flow

**Missing**: Organize batches into folders/tags

**Solution**: Add folders and tags

```typescript
// New table: folders
export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  name: text('name').notNull(),
  parentFolderId: uuid('parent_folder_id').references(() => folders.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Update batches table
ALTER TABLE batches ADD COLUMN folder_id UUID REFERENCES folders(id);

// New table: tags
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(), // Hex color
})

// New table: batch_tags (many-to-many)
export const batchTags = pgTable('batch_tags', {
  batchId: uuid('batch_id').references(() => batches.id).notNull(),
  tagId: uuid('tag_id').references(() => tags.id).notNull(),
})
```

**Estimate**: 2 days

---

## 5. TECHNICAL DEBT & CODE QUALITY

### 5.1 TypeScript Improvements

- Replace `as any` with proper types
- Create shared type definitions file
- Use enums for magic strings

**Estimate**: 2 days

---

### 5.2 Environment Variable Validation

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  EVA_API_URL: z.string().url(),
  EVA_API_KEY: z.string(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

export const env = envSchema.parse(process.env)
```

**Estimate**: 0.5 days

---

### 5.3 Error Message Improvements

- Add error codes to all errors
- Provide actionable suggestions
- Link to documentation

**Estimate**: 1 day

---

### 5.4 Code Organization

- Extract duplicate logic into shared utilities
- Move business logic out of API routes into services
- Create domain-driven folder structure

**Estimate**: 3 days

---

## 6. PERFORMANCE & SCALABILITY

### 6.1 Frontend Performance

**Issues**:
- Large tables render entire dataset
- No virtual scrolling
- No lazy loading of images

**Solutions**:
- Use @tanstack/react-virtual for tables
- Use Next.js Image component
- Implement intersection observer for lazy loading

**Estimate**: 2 days

---

### 6.2 Database Connection Pooling

```typescript
// Ensure connection pool is configured
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.DATABASE_URL, {
  max: 20, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client)
```

**Estimate**: 0.5 days

---

### 6.3 Background Job Queue

**Current**: Jobs run in HTTP request context
**Issue**: Timeouts, no persistence

**Solution**: Use BullMQ or Inngest

```typescript
// Use Inngest for reliable background jobs
import { Inngest } from 'inngest'

const inngest = new Inngest({ id: 'mino' })

export const executeEvaJob = inngest.createFunction(
  { id: 'execute-eva-job', retries: 3 },
  { event: 'job/execute' },
  async ({ event, step }) => {
    const { jobId } = event.data

    // Step 1: Fetch job
    const job = await step.run('fetch-job', async () => {
      return db.query.jobs.findFirst({ where: eq(jobs.id, jobId) })
    })

    // Step 2: Execute
    const result = await step.run('execute', async () => {
      return executeEvaWorkflow(...)
    })

    // Step 3: Save results
    await step.run('save-results', async () => {
      await db.update(jobs).set({ ... })
    })

    return { success: true }
  }
)

// Trigger from API
await inngest.send({
  name: 'job/execute',
  data: { jobId: job.id },
})
```

**Estimate**: 3 days

---

## 7. SECURITY & COMPLIANCE

### 7.1 HTTPS Enforcement

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' &&
      request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`
    )
  }

  return NextResponse.next()
}
```

**Estimate**: 0.5 days

---

### 7.2 CSRF Protection

**Solution**: Use Next.js built-in

```typescript
// All POST requests automatically protected
// Ensure cookies are set with SameSite=Strict
```

**Estimate**: 0.5 days

---

### 7.3 Data Encryption at Rest

- Encrypt sensitive fields (API keys, webhooks secrets)
- Use AES-256-GCM

**Estimate**: 1 day

---

### 7.4 GDPR Compliance

- Add data export for users (GDPR right to access)
- Add data deletion endpoint (GDPR right to erasure)
- Add consent tracking

**Estimate**: 2 days

---

## 8. COMPREHENSIVE IMPLEMENTATION ROADMAP

### Phase 1: Production Readiness (4 weeks)

**Week 1: Authentication & Authorization**
- Days 1-3: Clerk integration + basic auth
- Days 4-5: Organizations + multi-tenancy
- Days 6-7: RBAC + permissions
- Day 8: API keys

**Week 2: Validation & Error Handling**
- Days 1-2: Zod schemas for all endpoints
- Days 3-4: Structured error codes + handling
- Day 5: Transaction handling
- Days 6-7: Testing + bug fixes

**Week 3: Execution Improvements**
- Days 1-2: Error classification + retry logic
- Days 3-4: Retry worker + exponential backoff
- Day 5: Fix resume execution
- Days 6-7: Concurrency control

**Week 4: Performance & Indexes**
- Days 1-2: Database indexes
- Days 3-4: Pagination
- Days 5-6: Query optimization
- Day 7: Caching

**Deliverable**: Production-ready system with auth, validation, retry logic, and performance

---

### Phase 2: Enhanced Features (3 weeks)

**Week 1: Progress & Monitoring**
- Days 1-2: Live progress tracking
- Days 3-4: Bulk operations
- Days 5-7: Failure pattern analysis

**Week 2: Comparison & Cost**
- Days 1-3: Execution comparison dashboard
- Days 4-5: Cost tracking
- Days 6-7: Webhooks

**Week 3: User Experience**
- Days 1-3: Onboarding flow
- Days 2-4: Error recovery guidance
- Days 5-7: Batch organization (folders/tags)

**Deliverable**: Enhanced UX with comparison, cost tracking, and better organization

---

### Phase 3: Polish & Scale (2 weeks)

**Week 1: Code Quality**
- Days 1-2: TypeScript improvements
- Days 3-4: Code organization refactor
- Days 5-7: Audit logging + rate limiting

**Week 2: Security & Compliance**
- Days 1-2: HTTPS + CSRF + encryption
- Days 3-5: GDPR compliance
- Days 6-7: Security audit + penetration testing

**Deliverable**: Enterprise-ready system with audit logging, compliance, and security

---

### Phase 4: Advanced Features (3 weeks)

**Week 1: Background Jobs**
- Days 1-3: Inngest integration
- Days 4-7: Migrate execution to background jobs

**Week 2: Frontend Performance**
- Days 1-3: Virtual scrolling + lazy loading
- Days 4-7: React Query + caching

**Week 3: Advanced Analytics**
- Days 1-4: ML-powered failure insights
- Days 5-7: Predictive accuracy modeling

**Deliverable**: Scalable system with advanced analytics

---

## TOTAL IMPLEMENTATION ESTIMATE

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Production Readiness | 4 weeks | 🔴 Critical |
| Phase 2: Enhanced Features | 3 weeks | 🟡 High |
| Phase 3: Polish & Scale | 2 weeks | 🟡 High |
| Phase 4: Advanced Features | 3 weeks | 🟢 Medium |
| **TOTAL** | **12 weeks** | |

---

## PRIORITIZATION MATRIX

### Must Have (Blocks Production)
1. Authentication & Authorization - **8 days**
2. Input Validation - **6 days**
3. Retry Logic - **6 days**
4. Database Indexes - **5 days**
**Total: 25 days (5 weeks)**

### Should Have (Major Value)
5. Live Progress - **1 day**
6. Actual Concurrency - **2 days**
7. Bulk Operations - **2 days**
8. Failure Analysis - **2 days**
9. Execution Comparison - **3 days**
**Total: 10 days (2 weeks)**

### Nice to Have (Polish)
10. Cost Tracking - **1 day**
11. Webhooks - **2 days**
12. Audit Logging - **2 days**
13. Rate Limiting - **1 day**
14. Onboarding - **3 days**
**Total: 9 days (2 weeks)**

---

## SUCCESS METRICS

### Before (Current State)
- ❌ No authentication
- ❌ No validation
- ❌ Resume broken
- ❌ No retries
- ⚠️ Slow queries
- ⚠️ Poor error messages

### After Phase 1 (Production Ready)
- ✅ Multi-tenant with RBAC
- ✅ Full input validation
- ✅ Working resume/retry
- ✅ 90% faster queries
- ✅ Helpful error messages
- ✅ Ready for 1000+ users

### After Phase 2 (Enhanced)
- ✅ Side-by-side comparison
- ✅ Cost transparency
- ✅ Bulk operations
- ✅ Failure insights
- ✅ Smooth onboarding

### After Phase 3 (Enterprise)
- ✅ Full audit trail
- ✅ GDPR compliant
- ✅ Rate limited
- ✅ Security hardened
- ✅ Ready for enterprise sales

---

## CONCLUSION

This document identifies **23 critical gaps** across **8 categories** and provides a **comprehensive 12-week roadmap** to transform MINO v2 from a functional MVP into a production-ready, enterprise-grade platform.

**Next Steps**:
1. Review and approve this plan
2. Start with Phase 1 (Production Readiness)
3. Implement in order of priority
4. Test thoroughly at each phase
5. Deploy incrementally

**Key Takeaway**: While the 6 core features are implemented, the system needs **authentication, validation, retry logic, and performance optimization** before it can handle real production workloads.
