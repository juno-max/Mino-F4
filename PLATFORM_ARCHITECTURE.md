# MINO F4 - Platform Architecture Documentation

**Version**: 4.0
**Last Updated**: 2025-11-05
**Status**: Production-Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [EVA Agent Integration](#eva-agent-integration)
6. [Database Schema](#database-schema)
7. [Authentication & Authorization](#authentication--authorization)
8. [Real-Time Communication](#real-time-communication)
9. [API Architecture](#api-architecture)
10. [Performance Optimizations](#performance-optimizations)
11. [Security](#security)
12. [Deployment Architecture](#deployment-architecture)

---

## Executive Summary

MINO F4 is a production-ready web automation platform that combines AI-powered agents with comprehensive batch processing, real-time monitoring, and enterprise-grade multi-tenancy. Built on Next.js 14 with TypeScript, PostgreSQL, and EVA Agent integration.

**Key Capabilities:**
- AI-powered web automation via EVA Agent
- Batch processing with ground truth comparison
- Real-time execution monitoring with WebSocket
- Multi-tenant architecture with RBAC
- Google OAuth authentication
- High-performance database with 32 optimized indexes
- Comprehensive error handling and retry logic

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MINO F4 Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐      ┌──────────────────┐                   │
│  │   Next.js 14   │◄────►│   PostgreSQL     │                   │
│  │   Frontend     │      │   (Supabase)     │                   │
│  │   + API Routes │      │   + Drizzle ORM  │                   │
│  └────────┬───────┘      └──────────────────┘                   │
│           │                                                       │
│           │              ┌──────────────────┐                   │
│           └─────────────►│   EVA Agent API  │                   │
│                          │   (AgentQL)      │                   │
│                          └──────────────────┘                   │
│                                                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │  Authentication: NextAuth.js + Google OAuth         │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │  Real-Time: WebSocket/SSE for Live Monitoring       │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Technology Stack:**
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **Auth**: NextAuth.js with Google OAuth
- **AI Agent**: EVA Agent (AgentQL)
- **Real-Time**: WebSocket/Server-Sent Events
- **Validation**: Zod schemas
- **UI Components**: Headless UI, Heroicons

---

## Frontend Architecture

### Component Structure

```
app/
├── auth/
│   ├── signin/page.tsx          - Google OAuth sign-in
│   ├── signout/page.tsx         - Sign-out flow
│   └── error/page.tsx           - Auth error handling
├── projects/
│   ├── [id]/
│   │   ├── page.tsx             - Project dashboard
│   │   ├── batches/
│   │   │   └── [batchId]/
│   │   │       ├── page.tsx     - Batch execution view
│   │   │       ├── BatchJobsList.tsx
│   │   │       ├── AccuracyTrendChart.tsx
│   │   │       ├── BulkGTEditor.tsx
│   │   │       ├── ColumnMetrics.tsx
│   │   │       └── ExportButton.tsx
│   │   └── jobs/
│   │       └── [jobId]/
│   │           └── JobDetailClient.tsx
│   └── page.tsx                 - Projects list
└── api/                         - API routes (see Backend section)

components/
├── BulkActionsToolbar.tsx       - Bulk operations UI
├── ExecutionComparison.tsx      - A/B test comparison
├── FailurePatternsPanel.tsx     - Error analysis
├── GroundTruthDiff.tsx          - GT comparison
├── InstructionVersions.tsx      - Version control
└── ScreenshotPlayback.tsx       - Visual debugging
```

### Key Features

**1. Real-Time Monitoring**
- WebSocket connection for live progress updates
- Auto-refreshing job lists
- Live execution statistics
- Progress bars with percentage completion

**2. Batch Management**
- CSV upload for batch job creation
- Ground truth data import
- Bulk operations (rerun, delete, update)
- Export results to CSV/JSON

**3. Interactive Dashboards**
- Project overview with metrics
- Batch execution monitoring
- Job detail views with screenshots
- Accuracy trend charts
- Failure pattern analysis

**4. User Experience**
- Responsive design (mobile-first)
- Loading states and skeletons
- Error boundaries
- Toast notifications
- Confirmation dialogs

---

## Backend Architecture

### API Routes Structure

```
app/api/
├── auth/
│   └── [...nextauth]/route.ts   - NextAuth.js handler
├── projects/
│   ├── route.ts                 - List/create projects
│   └── [id]/
│       ├── route.ts             - Get/update/delete project
│       ├── batches/
│       │   └── [batchId]/
│       │       └── execute/route.ts - Execute batch
│       ├── instructions/route.ts
│       └── jobs/route.ts        - Create jobs
├── batches/
│   ├── route.ts                 - List/create batches
│   └── [id]/
│       ├── route.ts             - Get/update/delete batch
│       ├── analytics/route.ts   - Batch analytics
│       ├── export/route.ts      - Export results
│       ├── ground-truth/route.ts- GT management
│       ├── jobs/route.ts        - List batch jobs
│       └── failure-patterns/route.ts - Error analysis
├── jobs/
│   ├── route.ts                 - List jobs
│   ├── [id]/route.ts            - Get/update job
│   └── bulk/route.ts            - Bulk operations
└── executions/
    ├── [id]/
    │   ├── route.ts             - Get execution
    │   ├── pause/route.ts       - Pause execution
    │   ├── resume/route.ts      - Resume execution
    │   ├── stop/route.ts        - Stop execution
    │   └── concurrency/route.ts - Update concurrency
    └── compare/route.ts         - Compare executions
```

### Core Libraries

**1. Job Executor (`lib/job-executor.ts`)**
- Centralized job execution logic
- Concurrency control with p-limit
- Progress tracking and WebSocket publishing
- Resume/pause/stop functionality
- Error handling and retry logic

```typescript
export async function executeEvaJobs(
  executionId: string,
  jobsList: JobToExecute[],
  projectInstructions: string,
  columnSchema: any[]
): Promise<void>

export async function resumeExecution(executionId: string)
```

**2. EVA Executor (`lib/eva-executor.ts`)**
- EVA Agent API integration
- Streaming URL capture
- Progress callbacks
- Ground truth comparison
- Screenshot and recording capture

```typescript
export async function executeEvaWorkflow(
  siteUrl: string,
  projectInstructions: string,
  columnSchema: any[],
  groundTruthData: Record<string, any> | null,
  onStreamingUrl?: (url: string) => void,
  onProgress?: (progress: number, step: string) => void
): Promise<ExecutionResult>
```

**3. Real-Time Events (`lib/realtime-events.ts`)**
- WebSocket/SSE event publishing
- Job lifecycle events
- Progress updates
- Statistics updates

```typescript
export function publishJobStarted(data: JobStartedData)
export function publishJobProgress(data: JobProgressData)
export function publishJobCompleted(data: JobCompletedData)
export function publishExecutionStatsUpdated(data)
```

**4. Retry Logic (`lib/retry-logic.ts`)**
- Exponential backoff
- Configurable retry presets
- Max attempts and delays
- Timeout handling

```typescript
export enum RetryPresets {
  QUICK_RETRY = 'quick',
  STANDARD_RETRY = 'standard',
  PERSISTENT_RETRY = 'persistent'
}

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  preset: RetryPresets
): Promise<T>
```

**5. Validation (`lib/validation-schemas.ts`)**
- Zod schemas for all API inputs
- Type-safe validation
- Error messages

```typescript
export const createProjectSchema = z.object({ ... })
export const createBatchSchema = z.object({ ... })
export const bulkOperationSchema = z.object({ ... })
```

**6. API Helpers (`lib/api-helpers.ts`)**
- Standardized error handling
- ApiError class with error codes
- Response helpers

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  )
}

export function handleApiError(error: unknown): NextResponse
```

---

## EVA Agent Integration

### Architecture

```
MINO Backend ──► EVA Agent API ──► Browser Automation
                                    │
                                    ├─► Execute Workflow
                                    ├─► Extract Data
                                    ├─► Capture Screenshots
                                    └─► Generate Recordings
```

### EVA Workflow Execution

**1. Job Submission**
```typescript
// lib/eva-executor.ts
const response = await fetch(`${EVA_API_URL}/executions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentqlQuery: generatedQuery,
    url: siteUrl,
    instructions: projectInstructions,
    schema: columnSchema
  })
})
```

**2. Polling for Results**
- Polls execution status every 5 seconds
- Captures streaming URL when available
- Tracks progress (0-100%)
- Handles timeouts and errors

**3. Data Extraction**
```typescript
const executionResult = await response.json()
const extractedData = executionResult.data
const screenshots = executionResult.screenshots
const recordingUrl = executionResult.recording_url
```

**4. Ground Truth Comparison**
- Compares extracted data with expected results
- Calculates accuracy metrics
- Identifies mismatches
- Generates diff reports

### EVA Configuration

**Environment Variables:**
```bash
EVA_AGENT_API_URL=https://api.agentql.com
EVA_AGENT_API_KEY=your-api-key
EVA_AGENT_TIMEOUT=300000  # 5 minutes
EVA_AGENT_POLL_INTERVAL=5000  # 5 seconds
```

---

## Database Schema

### Core Tables

**Projects**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  instructions TEXT NOT NULL,
  column_schema JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Batches**
```sql
CREATE TABLE batches (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  ground_truth_data JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Jobs**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  batch_id UUID REFERENCES batches(id),
  site_url TEXT NOT NULL,
  goal TEXT NOT NULL,
  ground_truth_data JSONB,
  status TEXT DEFAULT 'pending',
  result_data JSONB,
  screenshots JSONB,
  recording_url TEXT,
  error_message TEXT,
  accuracy_score DECIMAL(5,2),
  execution_time INTEGER,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Executions**
```sql
CREATE TABLE executions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  batch_id UUID REFERENCES batches(id),
  status TEXT DEFAULT 'pending',
  total_jobs INTEGER NOT NULL,
  completed_jobs INTEGER DEFAULT 0,
  successful_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2),
  concurrency_limit INTEGER DEFAULT 5,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Authentication Tables

**Users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  email_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Organizations**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  owner_id UUID REFERENCES users(id),
  max_projects INTEGER DEFAULT 5,
  max_jobs_per_month INTEGER DEFAULT 1000,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Organization Members**
```sql
CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member',
  can_create_projects BOOLEAN DEFAULT TRUE,
  can_execute_jobs BOOLEAN DEFAULT TRUE,
  can_manage_members BOOLEAN DEFAULT FALSE,
  can_manage_billing BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);
```

### Performance Indexes

**32 Strategic Indexes:**
- Single column indexes on foreign keys (batch_id, project_id, organization_id)
- Composite indexes for common queries (batch_id + status, organization_id + status)
- Timestamp indexes for date range queries
- GIN indexes for JSONB column searches
- Partial indexes for active records
- Unique indexes for constraints

```sql
-- Example indexes
CREATE INDEX idx_jobs_batch_id ON jobs(batch_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_batch_status ON jobs(batch_id, status);
CREATE INDEX idx_jobs_org_id ON jobs(organization_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_accuracy ON jobs(accuracy_score) WHERE accuracy_score IS NOT NULL;
```

**Performance Impact:** 20x faster queries on common operations

---

## Authentication & Authorization

### Authentication Flow

```
User ──► Sign in with Google ──► Google OAuth ──► Callback
                                                      │
                                                      ▼
                                              NextAuth.js
                                                      │
                                                      ▼
                                              Create Session
                                                      │
                                                      ▼
                                     Auto-Create Organization (first time)
                                                      │
                                                      ▼
                                              Redirect to Dashboard
```

### Authorization Levels

**1. Organization Roles**
- **Owner**: Full control, created automatically
- **Admin**: Manage members, projects, jobs
- **Member**: Create projects, execute jobs
- **Viewer**: Read-only access

**2. Permissions**
```typescript
interface Permissions {
  canCreateProjects: boolean
  canExecuteJobs: boolean
  canManageMembers: boolean
  canManageBilling: boolean
}
```

### Auth Helpers

```typescript
// Get authenticated user
const user = await getUserWithOrganization()

// Require specific permission
const user = await requirePermission('canCreateProjects')

// Require admin access
const user = await requireAdminRole()

// Check organization access
await checkOrganizationAccess(organizationId)

// API key authentication
const { organizationId } = await validateApiKey(apiKey)
```

### Middleware Protection

All routes protected except:
- `/auth/*` - Authentication pages
- `/api/auth/*` - NextAuth.js endpoints

```typescript
// middleware.ts
export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)
```

---

## Real-Time Communication

### WebSocket Architecture

```
Frontend ──► WebSocket Connection ──► Server
                                        │
                                        ▼
                              Event Broadcasting
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            Job Started          Job Progress      Job Completed
```

### Event Types

**1. Job Lifecycle Events**
```typescript
// Job started
{
  type: 'job_started',
  data: {
    executionId: string,
    jobId: string,
    batchId: string,
    siteUrl: string,
    goal: string
  }
}

// Job progress
{
  type: 'job_progress',
  data: {
    executionId: string,
    jobId: string,
    currentStep: string,
    currentUrl: string,
    progressPercentage: number
  }
}

// Job completed
{
  type: 'job_completed',
  data: {
    executionId: string,
    jobId: string,
    status: 'success' | 'failed',
    resultData: any,
    accuracyScore: number,
    duration: number
  }
}
```

**2. Execution Statistics**
```typescript
{
  type: 'execution_stats_updated',
  data: {
    executionId: string,
    stats: {
      totalJobs: number,
      completedJobs: number,
      successfulJobs: number,
      failedJobs: number,
      averageAccuracy: number
    }
  }
}
```

### Frontend Integration

```typescript
// Connect to WebSocket
const ws = new WebSocket(`${WS_URL}/executions/${executionId}`)

// Listen for events
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data)

  switch(type) {
    case 'job_progress':
      updateJobProgress(data)
      break
    case 'execution_stats_updated':
      updateStats(data.stats)
      break
  }
}
```

---

## API Architecture

### RESTful Design

**Resource Structure:**
```
/api/projects                    - Collection
/api/projects/:id                - Resource
/api/projects/:id/batches        - Sub-collection
/api/projects/:id/batches/:id    - Sub-resource
```

**HTTP Methods:**
- `GET` - Retrieve resource(s)
- `POST` - Create resource
- `PATCH` - Update resource
- `DELETE` - Delete resource

### Error Handling

**Standardized Error Response:**
```typescript
{
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: {
      field: 'email',
      issue: 'Invalid email format'
    }
  }
}
```

**Error Codes:**
```typescript
export const ErrorCodes = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
}
```

### Request Validation

All endpoints use Zod schemas:
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createProjectSchema.parse(body)
    // ... process request
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: error.errors } },
        { status: 400 }
      )
    }
  }
}
```

---

## Performance Optimizations

### Database Optimizations

**1. Strategic Indexing**
- 32 indexes on frequently queried columns
- Composite indexes for multi-column queries
- Partial indexes for filtered queries
- GIN indexes for JSONB searches

**Result:** 20x performance improvement on common queries

**2. Query Optimization**
- Use Drizzle's query builder for type safety
- Limit result sets with pagination
- Select only required columns
- Use joins instead of multiple queries

**3. Connection Pooling**
- Supabase handles connection pooling
- Reuse database connections
- Configure pool size based on load

### Backend Optimizations

**1. Concurrency Control**
- p-limit for controlled parallelization
- Configurable concurrency (1-50 jobs)
- Prevents resource exhaustion
- Optimizes throughput

```typescript
const limit = pLimit(concurrencyLimit)
const promises = jobsList.map(job =>
  limit(() => executeJob(job))
)
```

**2. Retry Logic**
- Exponential backoff for failed requests
- Configurable retry presets
- Max attempts to prevent infinite loops
- Timeout protection

**3. Caching**
- Next.js automatic caching
- Revalidation strategies
- Static generation where possible

### Frontend Optimizations

**1. Code Splitting**
- Dynamic imports for large components
- Route-based splitting (Next.js default)
- Lazy loading non-critical features

**2. Image Optimization**
- Next.js Image component
- Automatic format selection (WebP)
- Responsive image sizing
- Lazy loading

**3. Data Fetching**
- Server Components for initial data
- Client-side fetching for updates
- Optimistic UI updates
- Request deduplication

---

## Security

### Authentication Security

**1. OAuth 2.0**
- Google OAuth for trusted authentication
- No password storage
- Automatic token refresh
- Secure session management

**2. Session Management**
- Database-backed sessions
- 30-day expiration
- Secure cookie flags (httpOnly, secure)
- CSRF protection

**3. API Key Security**
- SHA-256 hashed storage
- Scoped permissions
- Revocation support
- Rate limiting

### Authorization Security

**1. Organization Isolation**
- All queries filtered by organization_id
- Row-level security
- No cross-organization access
- Verified on every request

```typescript
// Automatic org filtering
const projects = await db.query.projects.findMany({
  where: eq(projects.organizationId, user.organizationId)
})
```

**2. Permission Checks**
- Middleware-level authentication
- Endpoint-level authorization
- Resource-level access control
- Audit logging

### Data Security

**1. Input Validation**
- Zod schemas for all inputs
- SQL injection prevention (ORM)
- XSS protection (React escaping)
- CSRF tokens

**2. Secrets Management**
- Environment variables for secrets
- No secrets in code
- Different secrets per environment
- Regular rotation

**3. HTTPS**
- TLS 1.3 in production
- Secure cookie transmission
- HSTS headers
- Certificate management

---

## Deployment Architecture

### Production Stack

```
┌─────────────────────────────────────────────┐
│              Load Balancer                   │
│              (Vercel Edge)                   │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│         Next.js Application                  │
│         (Vercel Serverless)                  │
└─────────────┬───────────────────────────────┘
              │
     ┌────────┴────────┐
     ▼                 ▼
┌──────────┐    ┌──────────────┐
│PostgreSQL│    │  EVA Agent   │
│(Supabase)│    │  API         │
└──────────┘    └──────────────┘
```

### Deployment Platforms

**1. Vercel (Recommended)**
- Zero-config Next.js deployment
- Automatic HTTPS
- Global CDN
- Serverless functions
- Edge network

**2. Docker**
- Containerized deployment
- Portable across platforms
- Easy scaling
- Version control

**3. Self-Hosted**
- Node.js server
- Reverse proxy (nginx)
- Process manager (PM2)
- SSL certificates (Let's Encrypt)

### Environment Configuration

**Development:**
```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost/mino_dev
EVA_AGENT_API_URL=https://api.agentql.com/dev
```

**Production:**
```bash
NODE_ENV=production
NEXTAUTH_URL=https://mino.app
DATABASE_URL=postgresql://prod-server/mino_prod
EVA_AGENT_API_URL=https://api.agentql.com
```

### Scaling Strategy

**Horizontal Scaling:**
- Multiple Next.js instances
- Load balancer distribution
- Stateless design
- Database connection pooling

**Vertical Scaling:**
- Increase instance size
- More CPU/memory
- Larger connection pool
- Higher concurrency limits

**Database Scaling:**
- Read replicas
- Connection pooling
- Query optimization
- Caching layer

---

## Monitoring & Observability

### Application Monitoring

**1. Logging**
- Structured JSON logs
- Log levels (error, warn, info, debug)
- Request/response logging
- Error stack traces

**2. Metrics**
- Request duration
- Error rates
- Database query times
- API response times

**3. Alerting**
- Error rate thresholds
- Performance degradation
- Database connection issues
- Authentication failures

### Database Monitoring

**1. Supabase Dashboard**
- Query performance
- Connection pool status
- Storage usage
- Replication lag

**2. Custom Metrics**
- Jobs per minute
- Execution success rate
- Average accuracy score
- Error pattern frequencies

---

## Development Workflow

### Local Development

**1. Setup**
```bash
# Clone repository
git clone https://github.com/your-org/mino-f4.git
cd mino-f4

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run migrations
node scripts/add-auth-tables.js

# Start dev server
npm run dev
```

**2. Database**
```bash
# Generate schema types
npm run db:generate

# Push schema changes
npm run db:push

# View database
npm run db:studio
```

**3. Testing**
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### Git Workflow

**1. Branching Strategy**
- `main` - production-ready code
- `develop` - integration branch
- `feature/*` - feature branches
- `fix/*` - bug fix branches

**2. Commit Convention**
```
feat: Add user profile page
fix: Resolve job resume bug
docs: Update API documentation
perf: Optimize database queries
```

**3. Pull Request Process**
- Create feature branch
- Implement changes
- Write tests
- Update documentation
- Submit PR
- Code review
- Merge to develop

---

## Technical Specifications

### Performance Targets

- **Page Load**: < 2 seconds (initial)
- **API Response**: < 500ms (median)
- **Database Query**: < 100ms (median)
- **Job Execution**: Variable (depends on EVA Agent)
- **WebSocket Latency**: < 100ms

### Scalability Targets

- **Concurrent Users**: 1,000+
- **Jobs per Day**: 100,000+
- **Organizations**: 10,000+
- **Database Size**: 500GB+
- **API Requests**: 1M+ per day

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Appendix

### File Structure

```
mino-ux-2/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   ├── auth/                     # Auth pages
│   ├── projects/                 # Project pages
│   └── layout.tsx                # Root layout
├── components/                   # React components
├── db/                           # Database
│   ├── index.ts                  # DB client
│   ├── schema.ts                 # Main schema
│   └── auth-schema.ts            # Auth schema
├── lib/                          # Utilities
│   ├── auth.ts                   # NextAuth config
│   ├── auth-helpers.ts           # Auth utilities
│   ├── job-executor.ts           # Job execution
│   ├── eva-executor.ts           # EVA integration
│   ├── realtime-events.ts        # WebSocket
│   ├── retry-logic.ts            # Retry utilities
│   ├── validation-schemas.ts     # Zod schemas
│   └── api-helpers.ts            # API utilities
├── scripts/                      # Database scripts
├── middleware.ts                 # Auth middleware
├── next.config.js                # Next.js config
└── package.json                  # Dependencies
```

### Dependencies

**Core:**
- next: ^14.2.0
- react: ^18.0.0
- typescript: ^5.0.0

**Database:**
- drizzle-orm: ^0.30.0
- postgres: ^3.4.0
- @auth/drizzle-adapter: ^0.9.0

**Authentication:**
- next-auth: ^4.24.0

**Validation:**
- zod: ^3.22.0

**UI:**
- @headlessui/react: ^1.7.0
- @heroicons/react: ^2.1.0
- tailwindcss: ^3.4.0

**Utilities:**
- p-limit: ^5.0.0

---

## Support & Resources

**Documentation:**
- API Reference: `/docs/api`
- Setup Guide: `GOOGLE_OAUTH_SETUP.md`
- Auth Guide: `AUTH_IMPLEMENTATION_SUMMARY.md`

**Links:**
- GitHub: https://github.com/your-org/mino-f4
- Production: https://mino.app

**Contact:**
- Email: support@mino.app
- Documentation: https://docs.mino.app

---

**Document Version**: 4.0
**Last Updated**: 2025-11-05
**Status**: ✅ Production-Ready
