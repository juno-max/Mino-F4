# STAGE 1 - FEATURE SET 1: LIVE EXECUTION MONITORING & CONTROL

## Overview
**Feature**: Real-time execution viewer showing 4-6 agents working concurrently with live progress updates, execution controls, and streaming results.

**User Value**: The "AHA MOMENT" - Users see their automation working in real-time, understand what agents are doing, and have full control over execution. This transforms batch execution from a black box into a transparent, controllable process.

**Complete User Flow**:
1. User uploads CSV and creates batch
2. User clicks "Execute Batch" with test/production options
3. System shows execution configuration modal
4. User confirms and starts execution
5. Page transitions to **Live Execution Viewer**
6. User sees 4-6 agent cards showing concurrent work
7. Each card displays: current URL, last action, progress, status
8. Results stream into live table below as jobs complete
9. User can pause, resume, stop, or adjust concurrency
10. User sees real-time stats: completed, running, queued, failed
11. User gets completion notification when done
12. User can export results or navigate to detailed view

**Estimated Time**: 5-7 days
**Complexity**: High (WebSocket, real-time updates, state management)
**Dependencies**: Existing execution infrastructure

---

## PHASE 1: DATABASE SCHEMA UPDATES

### Task 1.1: Add Execution Control Fields
**Priority**: Critical
**Estimated Time**: 45 minutes

#### Subtasks:
- [ ] **1.1.1** Create migration: `drizzle/migrations/0001_add_execution_controls.sql`
  ```sql
  -- Add execution control fields
  ALTER TABLE executions ADD COLUMN concurrency INTEGER DEFAULT 5;
  ALTER TABLE executions ADD COLUMN paused_at TIMESTAMP;
  ALTER TABLE executions ADD COLUMN resumed_at TIMESTAMP;
  ALTER TABLE executions ADD COLUMN stopped_at TIMESTAMP;
  ALTER TABLE executions ADD COLUMN stop_reason TEXT;
  ALTER TABLE executions ADD COLUMN execution_mode TEXT DEFAULT 'production'; -- 'test' | 'production'
  ALTER TABLE executions ADD COLUMN sample_size INTEGER;
  ALTER TABLE executions ADD COLUMN estimated_duration_ms INTEGER;
  ALTER TABLE executions ADD COLUMN estimated_cost DECIMAL(10,2);

  -- Add live tracking fields
  ALTER TABLE executions ADD COLUMN running_jobs_count INTEGER DEFAULT 0;
  ALTER TABLE executions ADD COLUMN queued_jobs_count INTEGER DEFAULT 0;
  ALTER TABLE executions ADD COLUMN failed_jobs_count INTEGER DEFAULT 0;
  ALTER TABLE executions ADD COLUMN last_activity_at TIMESTAMP;

  -- Add indexes
  CREATE INDEX idx_executions_status_active ON executions(status) WHERE status IN ('pending', 'running');
  CREATE INDEX idx_executions_last_activity ON executions(last_activity_at DESC);

  COMMENT ON COLUMN executions.concurrency IS 'Number of concurrent jobs (1-10)';
  COMMENT ON COLUMN executions.execution_mode IS 'test (sample) or production (all)';
  ```

- [ ] **1.1.2** Update `db/schema.ts`
  ```typescript
  export const executions = pgTable('executions', {
    // ... existing columns ...
    concurrency: integer('concurrency').default(5).notNull(),
    pausedAt: timestamp('paused_at'),
    resumedAt: timestamp('resumed_at'),
    stoppedAt: timestamp('stopped_at'),
    stopReason: text('stop_reason'),
    executionMode: text('execution_mode').$type<'test' | 'production'>().default('production').notNull(),
    sampleSize: integer('sample_size'),
    estimatedDurationMs: integer('estimated_duration_ms'),
    estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
    runningJobsCount: integer('running_jobs_count').default(0).notNull(),
    queuedJobsCount: integer('queued_jobs_count').default(0).notNull(),
    failedJobsCount: integer('failed_jobs_count').default(0).notNull(),
    lastActivityAt: timestamp('last_activity_at'),
  })
  ```

- [ ] **1.1.3** Run migration
  ```bash
  npx drizzle-kit push:pg
  ```

- [ ] **1.1.4** Verify migration success

**Acceptance Criteria**:
- ✅ All new columns added successfully
- ✅ Indexes created for performance
- ✅ Default values work correctly
- ✅ TypeScript types updated

**Edge Cases**:
- Existing executions get default concurrency (5)
- Null timestamps handled correctly
- Concurrency bounded (1-10)

---

### Task 1.2: Add Job Live Tracking Fields
**Priority**: Critical
**Estimated Time**: 30 minutes

#### Subtasks:
- [ ] **1.2.1** Create migration: `drizzle/migrations/0002_add_job_live_tracking.sql`
  ```sql
  -- Add live tracking to jobs
  ALTER TABLE jobs ADD COLUMN current_step TEXT;
  ALTER TABLE jobs ADD COLUMN current_url TEXT;
  ALTER TABLE jobs ADD COLUMN progress_percentage INTEGER DEFAULT 0;
  ALTER TABLE jobs ADD COLUMN started_at TIMESTAMP;
  ALTER TABLE jobs ADD COLUMN completed_at TIMESTAMP;
  ALTER TABLE jobs ADD COLUMN execution_duration_ms INTEGER;
  ALTER TABLE jobs ADD COLUMN retry_count INTEGER DEFAULT 0;
  ALTER TABLE jobs ADD COLUMN retry_reason TEXT;

  -- Add index for live queries
  CREATE INDEX idx_jobs_status_running ON jobs(status) WHERE status = 'running';
  CREATE INDEX idx_jobs_execution_id ON jobs(batch_id, status);

  COMMENT ON COLUMN jobs.current_step IS 'Current step in execution (for live display)';
  COMMENT ON COLUMN jobs.progress_percentage IS 'Job progress 0-100';
  ```

- [ ] **1.2.2** Update `db/schema.ts`
  ```typescript
  export const jobs = pgTable('jobs', {
    // ... existing columns ...
    currentStep: text('current_step'),
    currentUrl: text('current_url'),
    progressPercentage: integer('progress_percentage').default(0).notNull(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    executionDurationMs: integer('execution_duration_ms'),
    retryCount: integer('retry_count').default(0).notNull(),
    retryReason: text('retry_reason'),
  })
  ```

- [ ] **1.2.3** Run migration and verify

**Acceptance Criteria**:
- ✅ Job tracking fields added
- ✅ Can store live progress updates
- ✅ Queries for running jobs optimized

---

## PHASE 2: WEBSOCKET INFRASTRUCTURE

### Task 2.1: Setup WebSocket Server
**Priority**: Critical
**Estimated Time**: 3 hours

#### Subtasks:
- [ ] **2.1.1** Install dependencies
  ```bash
  npm install ws @types/ws
  ```

- [ ] **2.1.2** Create WebSocket server: `lib/websocket/server.ts`
  ```typescript
  import { WebSocketServer, WebSocket } from 'ws'
  import { IncomingMessage } from 'http'

  interface WSClient {
    ws: WebSocket
    executionId: string
    userId?: string
    subscribedChannels: Set<string>
  }

  class ExecutionWebSocketServer {
    private wss: WebSocketServer | null = null
    private clients: Map<string, WSClient> = new Map()

    initialize(server: any) {
      this.wss = new WebSocketServer({
        server,
        path: '/api/ws/executions'
      })

      this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        this.handleConnection(ws, req)
      })

      console.log('✅ WebSocket server initialized on /api/ws/executions')
    }

    private handleConnection(ws: WebSocket, req: IncomingMessage) {
      const clientId = this.generateClientId()

      const client: WSClient = {
        ws,
        executionId: '',
        subscribedChannels: new Set(),
      }

      this.clients.set(clientId, client)

      console.log(`🔌 Client connected: ${clientId} (Total: ${this.clients.size})`)

      ws.on('message', (data: string) => {
        this.handleMessage(clientId, data)
      })

      ws.on('close', () => {
        this.clients.delete(clientId)
        console.log(`🔌 Client disconnected: ${clientId} (Total: ${this.clients.size})`)
      })

      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        this.clients.delete(clientId)
      })

      // Send welcome message
      this.send(clientId, {
        type: 'connected',
        clientId,
        timestamp: new Date().toISOString(),
      })
    }

    private handleMessage(clientId: string, data: string) {
      try {
        const message = JSON.parse(data.toString())
        const client = this.clients.get(clientId)
        if (!client) return

        switch (message.type) {
          case 'subscribe':
            this.handleSubscribe(clientId, message)
            break
          case 'unsubscribe':
            this.handleUnsubscribe(clientId, message)
            break
          case 'ping':
            this.send(clientId, { type: 'pong' })
            break
          default:
            console.warn('Unknown message type:', message.type)
        }
      } catch (error) {
        console.error('Error handling message:', error)
      }
    }

    private handleSubscribe(clientId: string, message: any) {
      const client = this.clients.get(clientId)
      if (!client) return

      const { executionId } = message
      if (!executionId) return

      client.executionId = executionId
      client.subscribedChannels.add(`execution:${executionId}`)

      this.send(clientId, {
        type: 'subscribed',
        executionId,
        channel: `execution:${executionId}`,
      })

      console.log(`📡 Client ${clientId} subscribed to execution:${executionId}`)
    }

    private handleUnsubscribe(clientId: string, message: any) {
      const client = this.clients.get(clientId)
      if (!client) return

      const { channel } = message
      client.subscribedChannels.delete(channel)

      this.send(clientId, {
        type: 'unsubscribed',
        channel,
      })
    }

    // Broadcast to all clients watching an execution
    broadcast(executionId: string, event: any) {
      const channel = `execution:${executionId}`
      let sentCount = 0

      for (const [clientId, client] of this.clients.entries()) {
        if (client.subscribedChannels.has(channel)) {
          this.send(clientId, {
            type: 'execution_event',
            executionId,
            event,
            timestamp: new Date().toISOString(),
          })
          sentCount++
        }
      }

      if (sentCount > 0) {
        console.log(`📤 Broadcasted to ${sentCount} clients watching ${executionId}`)
      }
    }

    // Send message to specific client
    private send(clientId: string, data: any) {
      const client = this.clients.get(clientId)
      if (!client || client.ws.readyState !== WebSocket.OPEN) return

      try {
        client.ws.send(JSON.stringify(data))
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }

    private generateClientId(): string {
      return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    getStats() {
      return {
        totalClients: this.clients.size,
        subscriptions: Array.from(this.clients.values()).reduce(
          (acc, client) => acc + client.subscribedChannels.size,
          0
        ),
      }
    }
  }

  export const wsServer = new ExecutionWebSocketServer()
  ```

- [ ] **2.1.3** Create WebSocket API route: `app/api/ws/executions/route.ts`
  ```typescript
  import { NextRequest } from 'next/server'
  import { wsServer } from '@/lib/websocket/server'

  // This is a placeholder - actual WebSocket handling happens in custom server
  export async function GET(request: NextRequest) {
    return new Response('WebSocket endpoint - use ws:// protocol', {
      status: 426, // Upgrade Required
      headers: {
        'Upgrade': 'websocket',
      },
    })
  }
  ```

- [ ] **2.1.4** Create custom server: `server.js` (for WebSocket support)
  ```javascript
  const { createServer } = require('http')
  const { parse } = require('url')
  const next = require('next')
  const { wsServer } = require('./lib/websocket/server')

  const dev = process.env.NODE_ENV !== 'production'
  const hostname = 'localhost'
  const port = parseInt(process.env.PORT || '3000', 10)

  const app = next({ dev, hostname, port })
  const handle = app.getRequestHandler()

  app.prepare().then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })

    // Initialize WebSocket server
    wsServer.initialize(server)

    server.listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> WebSocket on ws://${hostname}:${port}/api/ws/executions`)
    })
  })
  ```

- [ ] **2.1.5** Update `package.json` scripts
  ```json
  {
    "scripts": {
      "dev": "node server.js",
      "build": "next build",
      "start": "NODE_ENV=production node server.js"
    }
  }
  ```

- [ ] **2.1.6** Test WebSocket connection with client
  ```typescript
  // Test in browser console
  const ws = new WebSocket('ws://localhost:3000/api/ws/executions')
  ws.onopen = () => console.log('Connected')
  ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data))
  ws.send(JSON.stringify({ type: 'subscribe', executionId: 'test-123' }))
  ```

**Acceptance Criteria**:
- ✅ WebSocket server starts with Next.js
- ✅ Clients can connect
- ✅ Subscribe/unsubscribe works
- ✅ Broadcasting to multiple clients works
- ✅ Reconnection handled gracefully
- ✅ No memory leaks (clients cleaned up on disconnect)

**Edge Cases**:
- Server restart (clients auto-reconnect)
- Client network interruption
- Multiple tabs watching same execution
- Very rapid events (throttling)
- Client closes tab without unsubscribe

---

### Task 2.2: Create Execution Event Publisher
**Priority**: Critical
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **2.2.1** Create event publisher: `lib/websocket/events.ts`
  ```typescript
  import { wsServer } from './server'

  export type ExecutionEventType =
    | 'execution_started'
    | 'execution_progress'
    | 'execution_completed'
    | 'execution_paused'
    | 'execution_resumed'
    | 'execution_stopped'
    | 'job_started'
    | 'job_progress'
    | 'job_completed'
    | 'job_failed'
    | 'stats_update'

  export interface ExecutionEvent {
    type: ExecutionEventType
    executionId: string
    data: any
    timestamp: string
  }

  export class ExecutionEventPublisher {
    /**
     * Publish execution started event
     */
    static executionStarted(executionId: string, data: {
      totalJobs: number
      concurrency: number
      mode: 'test' | 'production'
      estimatedDuration?: number
    }) {
      this.publish({
        type: 'execution_started',
        executionId,
        data,
        timestamp: new Date().toISOString(),
      })
    }

    /**
     * Publish execution progress update
     */
    static executionProgress(executionId: string, data: {
      completedJobs: number
      totalJobs: number
      runningJobs: number
      queuedJobs: number
      failedJobs: number
      successRate: number
      elapsedMs: number
      estimatedRemainingMs?: number
    }) {
      this.publish({
        type: 'execution_progress',
        executionId,
        data,
        timestamp: new Date().toISOString(),
      })
    }

    /**
     * Publish job started event
     */
    static jobStarted(executionId: string, data: {
      jobId: string
      inputId: string
      siteUrl: string
      goal: string
    }) {
      this.publish({
        type: 'job_started',
        executionId,
        data,
        timestamp: new Date().toISOString(),
      })
    }

    /**
     * Publish job progress update
     */
    static jobProgress(executionId: string, data: {
      jobId: string
      currentStep: string
      currentUrl: string
      progress: number // 0-100
    }) {
      this.publish({
        type: 'job_progress',
        executionId,
        data,
        timestamp: new Date().toISOString(),
      })
    }

    /**
     * Publish job completed event
     */
    static jobCompleted(executionId: string, data: {
      jobId: string
      inputId: string
      success: boolean
      extractedData?: any
      durationMs: number
    }) {
      this.publish({
        type: 'job_completed',
        executionId,
        data,
        timestamp: new Date().toISOString(),
      })
    }

    /**
     * Publish job failed event
     */
    static jobFailed(executionId: string, data: {
      jobId: string
      inputId: string
      error: string
      willRetry: boolean
    }) {
      this.publish({
        type: 'job_failed',
        executionId,
        data,
        timestamp: new Date().toISOString(),
      })
    }

    /**
     * Publish stats update (throttled, every 2 seconds)
     */
    static statsUpdate(executionId: string, data: {
      running: number
      queued: number
      completed: number
      failed: number
      totalJobs: number
      successRate: number
      avgDurationMs: number
    }) {
      this.publish({
        type: 'stats_update',
        executionId,
        data,
        timestamp: new Date().toISOString(),
      })
    }

    /**
     * Publish execution completed
     */
    static executionCompleted(executionId: string, data: {
      totalJobs: number
      successfulJobs: number
      failedJobs: number
      totalDurationMs: number
      successRate: number
    }) {
      this.publish({
        type: 'execution_completed',
        executionId,
        data,
        timestamp: new Date().toISOString(),
      })
    }

    /**
     * Generic publish method
     */
    private static publish(event: ExecutionEvent) {
      // Broadcast via WebSocket
      wsServer.broadcast(event.executionId, event)

      // Also log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 Event: ${event.type}`, event.data)
      }
    }
  }
  ```

- [ ] **2.2.2** Integrate with existing execution code
  - Find where jobs start/complete in EVA execution
  - Add event publishing at key points
  - Ensure events fire in correct order

- [ ] **2.2.3** Test event flow end-to-end

**Acceptance Criteria**:
- ✅ Events published at correct times
- ✅ Event data complete and accurate
- ✅ Events received by WebSocket clients
- ✅ No performance impact on execution
- ✅ Events throttled when necessary

**Edge Cases**:
- Very fast job completion (events throttled)
- Events during pause/resume
- Events during stop
- WebSocket not connected (events logged but not sent)

---

## PHASE 3: EXECUTION CONTROL API

### Task 3.1: Create Pause/Resume/Stop Endpoints
**Priority**: Critical
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **3.1.1** Create `app/api/executions/[id]/pause/route.ts`
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { db, executions } from '@/db'
  import { eq } from 'drizzle-orm'
  import { ExecutionEventPublisher } from '@/lib/websocket/events'

  export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: executionId } = await params

      // Update execution status
      const [execution] = await db
        .update(executions)
        .set({
          status: 'paused',
          pausedAt: new Date(),
          lastActivityAt: new Date(),
        })
        .where(eq(executions.id, executionId))
        .returning()

      if (!execution) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        )
      }

      // Publish pause event
      ExecutionEventPublisher.publish({
        type: 'execution_paused',
        executionId,
        data: { pausedAt: execution.pausedAt },
        timestamp: new Date().toISOString(),
      })

      // TODO: Signal running jobs to pause
      // This requires worker coordination

      return NextResponse.json({
        success: true,
        execution,
        message: 'Execution paused successfully',
      })
    } catch (error) {
      console.error('Pause execution error:', error)
      return NextResponse.json(
        { error: 'Failed to pause execution' },
        { status: 500 }
      )
    }
  }
  ```

- [ ] **3.1.2** Create `app/api/executions/[id]/resume/route.ts`
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { db, executions } from '@/db'
  import { eq } from 'drizzle-orm'
  import { ExecutionEventPublisher } from '@/lib/websocket/events'

  export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: executionId } = await params

      // Update execution status
      const [execution] = await db
        .update(executions)
        .set({
          status: 'running',
          resumedAt: new Date(),
          lastActivityAt: new Date(),
        })
        .where(eq(executions.id, executionId))
        .returning()

      if (!execution) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        )
      }

      // Publish resume event
      ExecutionEventPublisher.publish({
        type: 'execution_resumed',
        executionId,
        data: { resumedAt: execution.resumedAt },
        timestamp: new Date().toISOString(),
      })

      // TODO: Signal workers to resume processing

      return NextResponse.json({
        success: true,
        execution,
        message: 'Execution resumed successfully',
      })
    } catch (error) {
      console.error('Resume execution error:', error)
      return NextResponse.json(
        { error: 'Failed to resume execution' },
        { status: 500 }
      )
    }
  }
  ```

- [ ] **3.1.3** Create `app/api/executions/[id]/stop/route.ts`
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { db, executions, jobs } from '@/db'
  import { eq, inArray } from 'drizzle-orm'
  import { ExecutionEventPublisher } from '@/lib/websocket/events'
  import { z } from 'zod'

  const StopSchema = z.object({
    reason: z.string().optional(),
  })

  export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: executionId } = await params
      const body = await request.json()

      const validation = StopSchema.safeParse(body)
      const reason = validation.success ? validation.data.reason : undefined

      // Update execution status
      const [execution] = await db
        .update(executions)
        .set({
          status: 'stopped',
          stoppedAt: new Date(),
          stopReason: reason,
          completedAt: new Date(),
          lastActivityAt: new Date(),
        })
        .where(eq(executions.id, executionId))
        .returning()

      if (!execution) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        )
      }

      // Cancel all queued/running jobs in this execution
      await db
        .update(jobs)
        .set({
          status: 'error',
          errorMessage: `Execution stopped: ${reason || 'Manual stop'}`,
          updatedAt: new Date(),
        })
        .where(
          eq(jobs.batchId, execution.batchId),
          inArray(jobs.status, ['queued', 'running'])
        )

      // Publish stop event
      ExecutionEventPublisher.publish({
        type: 'execution_stopped',
        executionId,
        data: {
          stoppedAt: execution.stoppedAt,
          reason,
        },
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        execution,
        message: 'Execution stopped successfully',
      })
    } catch (error) {
      console.error('Stop execution error:', error)
      return NextResponse.json(
        { error: 'Failed to stop execution' },
        { status: 500 }
      )
    }
  }
  ```

- [ ] **3.1.4** Create `app/api/executions/[id]/adjust-concurrency/route.ts`
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { db, executions } from '@/db'
  import { eq } from 'drizzle-orm'
  import { z } from 'zod'

  const AdjustConcurrencySchema = z.object({
    concurrency: z.number().min(1).max(10),
  })

  export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: executionId } = await params
      const body = await request.json()

      const validation = AdjustConcurrencySchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid concurrency value. Must be 1-10.' },
          { status: 400 }
        )
      }

      const { concurrency } = validation.data

      // Update concurrency
      const [execution] = await db
        .update(executions)
        .set({
          concurrency,
          lastActivityAt: new Date(),
        })
        .where(eq(executions.id, executionId))
        .returning()

      if (!execution) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        )
      }

      // TODO: Signal workers to adjust concurrency

      return NextResponse.json({
        success: true,
        concurrency,
        message: `Concurrency adjusted to ${concurrency}`,
      })
    } catch (error) {
      console.error('Adjust concurrency error:', error)
      return NextResponse.json(
        { error: 'Failed to adjust concurrency' },
        { status: 500 }
      )
    }
  }
  ```

- [ ] **3.1.5** Test all control endpoints

**Acceptance Criteria**:
- ✅ Pause stops new jobs from starting
- ✅ Resume continues processing
- ✅ Stop cancels all pending jobs
- ✅ Concurrency adjustment takes effect immediately
- ✅ Events published for all actions
- ✅ Database updated correctly

**Edge Cases**:
- Pausing already paused execution
- Resuming already running execution
- Stopping already stopped execution
- Adjusting concurrency during pause
- Multiple control actions in rapid succession

---

### Task 3.2: Create Live Stats Endpoint
**Priority**: High
**Estimated Time**: 1 hour

#### Subtasks:
- [ ] **3.2.1** Create `app/api/executions/[id]/live-stats/route.ts`
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { db, executions, jobs } from '@/db'
  import { eq, and, inArray } from 'drizzle-orm'

  export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: executionId } = await params

      // Get execution
      const execution = await db.query.executions.findFirst({
        where: eq(executions.id, executionId),
      })

      if (!execution) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        )
      }

      // Get job counts by status
      const jobStats = await db
        .select({
          status: jobs.status,
          count: db.fn.count(jobs.id),
        })
        .from(jobs)
        .where(eq(jobs.batchId, execution.batchId))
        .groupBy(jobs.status)

      const stats = {
        total: execution.totalJobs,
        running: 0,
        queued: 0,
        completed: 0,
        failed: 0,
      }

      for (const stat of jobStats) {
        stats[stat.status as keyof typeof stats] = Number(stat.count)
      }

      // Calculate derived metrics
      const successRate = stats.total > 0
        ? ((stats.completed / stats.total) * 100).toFixed(1)
        : '0'

      const elapsedMs = execution.startedAt
        ? Date.now() - new Date(execution.startedAt).getTime()
        : 0

      const avgDurationMs = stats.completed > 0
        ? elapsedMs / stats.completed
        : 0

      const estimatedRemainingMs = stats.queued > 0
        ? (stats.queued / (execution.concurrency || 5)) * avgDurationMs
        : 0

      return NextResponse.json({
        executionId,
        status: execution.status,
        concurrency: execution.concurrency,
        stats,
        metrics: {
          successRate: parseFloat(successRate),
          elapsedMs,
          avgDurationMs: Math.round(avgDurationMs),
          estimatedRemainingMs: Math.round(estimatedRemainingMs),
          estimatedCompletionTime: new Date(Date.now() + estimatedRemainingMs).toISOString(),
        },
        lastUpdate: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get live stats error:', error)
      return NextResponse.json(
        { error: 'Failed to get live stats' },
        { status: 500 }
      )
    }
  }
  ```

- [ ] **3.2.2** Test stats endpoint
- [ ] **3.2.3** Add caching (1 second) to prevent overload

**Acceptance Criteria**:
- ✅ Returns accurate counts
- ✅ Calculates success rate correctly
- ✅ Estimates completion time
- ✅ Fast response (<200ms)
- ✅ Can handle frequent polling

---

## PHASE 4: FRONTEND - LIVE EXECUTION VIEWER

### Task 4.1: Create Live Execution Page
**Priority**: Critical
**Estimated Time**: 4 hours

#### Subtasks:
- [ ] **4.1.1** Create page: `app/projects/[id]/batches/[batchId]/executions/[executionId]/live/page.tsx`
  ```typescript
  'use client'

  import { useEffect, useState, useRef } from 'react'
  import { useRouter } from 'next/navigation'
  import { Card } from '@/components/Card'
  import { Button } from '@/components/Button'
  import {
    Play,
    Pause,
    Square,
    Settings,
    Download,
    Activity,
    Clock,
    TrendingUp
  } from 'lucide-react'
  import { LiveExecutionGrid } from '@/components/LiveExecutionGrid'
  import { LiveStatsPanel } from '@/components/LiveStatsPanel'
  import { LiveResultsTable } from '@/components/LiveResultsTable'
  import { ExecutionControls } from '@/components/ExecutionControls'
  import { useWebSocket } from '@/hooks/useWebSocket'
  import { useExecution } from '@/hooks/useExecution'

  interface LiveExecutionPageProps {
    params: {
      id: string
      batchId: string
      executionId: string
    }
  }

  export default function LiveExecutionPage({ params }: LiveExecutionPageProps) {
    const router = useRouter()
    const { id: projectId, batchId, executionId } = params

    // WebSocket connection
    const {
      connected,
      events,
      subscribe,
      unsubscribe
    } = useWebSocket()

    // Execution data
    const {
      execution,
      stats,
      runningJobs,
      completedJobs,
      loading,
      pause,
      resume,
      stop,
      adjustConcurrency,
    } = useExecution(executionId)

    // Subscribe to execution events
    useEffect(() => {
      subscribe(executionId)
      return () => unsubscribe(executionId)
    }, [executionId])

    // Handle execution completion
    useEffect(() => {
      if (execution?.status === 'completed') {
        // Show completion notification
        // Auto-navigate to results after 3 seconds
        setTimeout(() => {
          router.push(`/projects/${projectId}/batches/${batchId}`)
        }, 3000)
      }
    }, [execution?.status])

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Activity className="h-8 w-8 animate-spin text-amber-600" />
          <span className="ml-3 text-lg text-stone-600">Loading execution...</span>
        </div>
      )
    }

    if (!execution) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-lg text-stone-600">Execution not found</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      )
    }

    const isRunning = execution.status === 'running'
    const isPaused = execution.status === 'paused'
    const isCompleted = execution.status === 'completed' || execution.status === 'stopped'

    return (
      <div className="min-h-screen bg-stone-50">
        {/* Header */}
        <header className="border-b border-stone-200 bg-white shadow-sm sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-stone-900 flex items-center gap-3">
                  <Activity className={`h-6 w-6 ${isRunning ? 'text-green-600 animate-pulse' : 'text-stone-400'}`} />
                  Live Execution
                </h1>
                <p className="text-sm text-stone-600 mt-1">
                  Batch: {batchId} • Mode: {execution.executionMode}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-4">
                {connected ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                    Live
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <div className="h-2 w-2 rounded-full bg-red-600" />
                    Disconnected
                  </div>
                )}

                <ExecutionControls
                  execution={execution}
                  onPause={pause}
                  onResume={resume}
                  onStop={stop}
                  onAdjustConcurrency={adjustConcurrency}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/projects/${projectId}/batches/${batchId}`)}
                >
                  Exit Live View
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Stats Panel */}
          <LiveStatsPanel
            stats={stats}
            execution={execution}
            events={events}
          />

          {/* Running Jobs Grid (4-6 concurrent) */}
          {runningJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Running Jobs ({runningJobs.length})
              </h2>
              <LiveExecutionGrid jobs={runningJobs} />
            </div>
          )}

          {/* Live Results Table */}
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-stone-600" />
              Completed Results ({completedJobs.length})
            </h2>
            <LiveResultsTable
              jobs={completedJobs}
              events={events}
            />
          </div>

          {/* Completion State */}
          {isCompleted && (
            <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-amber-50">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-stone-900 mb-2">
                Execution Complete!
              </h3>
              <p className="text-stone-600 mb-4">
                {stats.completed} jobs completed • {stats.failed} failed
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push(`/projects/${projectId}/batches/${batchId}`)}>
                  View Results
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  }
  ```

- [ ] **4.1.2** Test page renders correctly
- [ ] **4.1.3** Test responsive design (mobile, tablet, desktop)

**Acceptance Criteria**:
- ✅ Page loads without errors
- ✅ Shows execution status correctly
- ✅ Live connection indicator works
- ✅ Controls visible and functional
- ✅ Stats update in real-time
- ✅ Responsive on all screen sizes

---

### Task 4.2: Create Live Execution Grid Component
**Priority**: Critical
**Estimated Time**: 3 hours

#### Subtasks:
- [ ] **4.2.1** Create `components/LiveExecutionGrid.tsx`
  ```typescript
  'use client'

  import { Card } from '@/components/Card'
  import { Badge } from '@/components/Badge'
  import { Progress } from '@/components/Progress'
  import { Activity, Globe, ChevronRight } from 'lucide-react'

  interface Job {
    id: string
    inputId: string
    siteUrl: string
    currentStep?: string
    currentUrl?: string
    progressPercentage: number
    startedAt: string
  }

  interface LiveExecutionGridProps {
    jobs: Job[]
  }

  export function LiveExecutionGrid({ jobs }: LiveExecutionGridProps) {
    // Show max 6 jobs in grid
    const visibleJobs = jobs.slice(0, 6)

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleJobs.map((job) => (
          <AgentCard key={job.id} job={job} />
        ))}
      </div>
    )
  }

  function AgentCard({ job }: { job: Job }) {
    const elapsed = Date.now() - new Date(job.startedAt).getTime()
    const elapsedSeconds = Math.floor(elapsed / 1000)

    return (
      <Card className="p-4 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white relative overflow-hidden">
        {/* Animated pulse background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse" />

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-600 animate-pulse" />
            <span className="text-xs font-mono text-stone-600">
              {job.inputId}
            </span>
          </div>
          <Badge variant="success" size="sm">
            Running
          </Badge>
        </div>

        {/* Current URL */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Globe className="h-3 w-3" />
            Current Page
          </div>
          <p className="text-sm text-stone-900 truncate font-medium">
            {job.currentUrl || job.siteUrl}
          </p>
        </div>

        {/* Current Step */}
        {job.currentStep && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <ChevronRight className="h-3 w-3" />
              Current Step
            </div>
            <p className="text-sm text-stone-700">
              {job.currentStep}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-2">
          <Progress value={job.progressPercentage} size="sm" />
        </div>

        {/* Footer Stats */}
        <div className="flex justify-between text-xs text-stone-500">
          <span>{job.progressPercentage}% complete</span>
          <span>{elapsedSeconds}s elapsed</span>
        </div>
      </Card>
    )
  }
  ```

- [ ] **4.2.2** Add animations for new jobs appearing
- [ ] **4.2.3** Add hover effects
- [ ] **4.2.4** Test with different job states

**Acceptance Criteria**:
- ✅ Shows up to 6 concurrent jobs
- ✅ Each card shows job progress
- ✅ Current step displayed
- ✅ URL displayed and truncated
- ✅ Progress bar updates smoothly
- ✅ Elapsed time updates every second
- ✅ Visual feedback for active state (pulse, animation)

**Edge Cases**:
- Job with very long URL (truncate)
- Job with no current step (hide section)
- Job that completes very quickly (<1 second)
- Job with progress 0% (show but indicate starting)

---

### Task 4.3: Create Live Stats Panel Component
**Priority**: High
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **4.3.1** Create `components/LiveStatsPanel.tsx`
  ```typescript
  'use client'

  import { Card } from '@/components/Card'
  import {
    CheckCircle,
    XCircle,
    Clock,
    Activity,
    TrendingUp,
    Zap
  } from 'lucide-react'

  interface LiveStatsPanelProps {
    stats: {
      total: number
      running: number
      queued: number
      completed: number
      failed: number
    }
    execution: {
      concurrency: number
      estimatedDurationMs?: number
    }
    events: any[]
  }

  export function LiveStatsPanel({ stats, execution, events }: LiveStatsPanelProps) {
    const successRate = stats.total > 0
      ? ((stats.completed / stats.total) * 100).toFixed(1)
      : '0.0'

    const completionPercentage = stats.total > 0
      ? ((stats.completed + stats.failed) / stats.total) * 100
      : 0

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Progress */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase">
              Total Progress
            </span>
            <Activity className="h-4 w-4 text-stone-400" />
          </div>
          <div className="text-3xl font-bold text-stone-900 mb-1">
            {stats.completed + stats.failed}/{stats.total}
          </div>
          <div className="text-sm text-stone-600">
            {completionPercentage.toFixed(0)}% complete
          </div>
          <div className="mt-3 h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </Card>

        {/* Success Rate */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase">
              Success Rate
            </span>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {successRate}%
          </div>
          <div className="text-sm text-stone-600">
            {stats.completed} successful
          </div>
        </Card>

        {/* Currently Running */}
        <Card className="p-5 border-2 border-green-200 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-green-700 uppercase">
              Running Now
            </span>
            <Zap className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-700 mb-1">
            {stats.running}
          </div>
          <div className="text-sm text-green-600">
            {stats.queued} queued
          </div>
        </Card>

        {/* Failed */}
        {stats.failed > 0 && (
          <Card className="p-5 border-2 border-red-200 bg-red-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-700 uppercase">
                Failed
              </span>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-700 mb-1">
              {stats.failed}
            </div>
            <div className="text-sm text-red-600">
              {((stats.failed / stats.total) * 100).toFixed(1)}% failure rate
            </div>
          </Card>
        )}

        {/* Concurrency */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase">
              Concurrency
            </span>
            <Settings className="h-4 w-4 text-stone-400" />
          </div>
          <div className="text-3xl font-bold text-stone-900 mb-1">
            {execution.concurrency}
          </div>
          <div className="text-sm text-stone-600">
            agents at once
          </div>
        </Card>
      </div>
    )
  }
  ```

- [ ] **4.3.2** Add smooth transitions for number changes
- [ ] **4.3.3** Add celebratory animation when 100% complete

**Acceptance Criteria**:
- ✅ Shows all key metrics
- ✅ Updates in real-time
- ✅ Numbers animate smoothly
- ✅ Progress bar fills correctly
- ✅ Success/failure rates accurate
- ✅ Visual distinction for different states

---

### Task 4.4: Create Execution Controls Component
**Priority**: High
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **4.4.1** Create `components/ExecutionControls.tsx`
  ```typescript
  'use client'

  import { useState } from 'react'
  import { Button } from '@/components/Button'
  import {
    Play,
    Pause,
    Square,
    Settings,
    AlertCircle
  } from 'lucide-react'
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
  } from '@/components/ui/dialog'
  import { Input } from '@/components/Input'
  import { Label } from '@/components/ui/label'

  interface ExecutionControlsProps {
    execution: {
      id: string
      status: string
      concurrency: number
    }
    onPause: () => Promise<void>
    onResume: () => Promise<void>
    onStop: (reason?: string) => Promise<void>
    onAdjustConcurrency: (concurrency: number) => Promise<void>
  }

  export function ExecutionControls({
    execution,
    onPause,
    onResume,
    onStop,
    onAdjustConcurrency,
  }: ExecutionControlsProps) {
    const [showStopDialog, setShowStopDialog] = useState(false)
    const [showConcurrencyDialog, setShowConcurrencyDialog] = useState(false)
    const [stopReason, setStopReason] = useState('')
    const [newConcurrency, setNewConcurrency] = useState(execution.concurrency)
    const [loading, setLoading] = useState(false)

    const isRunning = execution.status === 'running'
    const isPaused = execution.status === 'paused'

    const handlePause = async () => {
      setLoading(true)
      try {
        await onPause()
      } finally {
        setLoading(false)
      }
    }

    const handleResume = async () => {
      setLoading(true)
      try {
        await onResume()
      } finally {
        setLoading(false)
      }
    }

    const handleStop = async () => {
      setLoading(true)
      try {
        await onStop(stopReason || 'Manual stop')
        setShowStopDialog(false)
      } finally {
        setLoading(false)
      }
    }

    const handleAdjustConcurrency = async () => {
      setLoading(true)
      try {
        await onAdjustConcurrency(newConcurrency)
        setShowConcurrencyDialog(false)
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="flex items-center gap-2">
        {/* Pause/Resume */}
        {isRunning && (
          <Button
            size="sm"
            variant="outline"
            onClick={handlePause}
            disabled={loading}
          >
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        )}

        {isPaused && (
          <Button
            size="sm"
            onClick={handleResume}
            disabled={loading}
          >
            <Play className="h-4 w-4 mr-2" />
            Resume
          </Button>
        )}

        {/* Adjust Concurrency */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConcurrencyDialog(true)}
          disabled={loading}
        >
          <Settings className="h-4 w-4 mr-2" />
          {execution.concurrency}x
        </Button>

        {/* Stop */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowStopDialog(true)}
          disabled={loading}
          className="text-red-600 hover:bg-red-50"
        >
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Button>

        {/* Stop Confirmation Dialog */}
        <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Stop Execution?
              </DialogTitle>
              <DialogDescription>
                This will cancel all queued and running jobs. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="stopReason">Reason (optional)</Label>
                <Input
                  id="stopReason"
                  placeholder="e.g., Too many errors, wrong configuration"
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStopDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleStop}
                disabled={loading}
              >
                {loading ? 'Stopping...' : 'Stop Execution'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Concurrency Adjustment Dialog */}
        <Dialog open={showConcurrencyDialog} onOpenChange={setShowConcurrencyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Concurrency</DialogTitle>
              <DialogDescription>
                Change how many jobs run simultaneously (1-10)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="concurrency">Concurrent Jobs</Label>
                <Input
                  id="concurrency"
                  type="number"
                  min={1}
                  max={10}
                  value={newConcurrency}
                  onChange={(e) => setNewConcurrency(parseInt(e.target.value))}
                />
                <p className="text-xs text-stone-500 mt-2">
                  Higher concurrency = faster execution but more resource intensive
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConcurrencyDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdjustConcurrency}
                disabled={loading || newConcurrency < 1 || newConcurrency > 10}
              >
                {loading ? 'Applying...' : 'Apply'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
  ```

- [ ] **4.4.2** Test all control buttons
- [ ] **4.4.3** Test dialogs and confirmations

**Acceptance Criteria**:
- ✅ Pause/resume buttons toggle correctly
- ✅ Stop requires confirmation
- ✅ Concurrency adjustment validates input (1-10)
- ✅ Loading states prevent double-clicks
- ✅ Error messages displayed if actions fail

---

## PHASE 5: WEBSOCKET HOOK

### Task 5.1: Create useWebSocket Hook
**Priority**: Critical
**Estimated Time**: 2 hours

#### Subtasks:
- [ ] **5.1.1** Create `hooks/useWebSocket.ts`
  ```typescript
  'use client'

  import { useEffect, useRef, useState, useCallback } from 'react'

  interface WebSocketMessage {
    type: string
    [key: string]: any
  }

  export function useWebSocket() {
    const [connected, setConnected] = useState(false)
    const [events, setEvents] = useState<WebSocketMessage[]>([])
    const ws = useRef<WebSocket | null>(null)
    const reconnectTimer = useRef<NodeJS.Timeout>()
    const subscriptions = useRef<Set<string>>(new Set())

    // Connect to WebSocket
    const connect = useCallback(() => {
      if (ws.current?.readyState === WebSocket.OPEN) return

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws/executions`

      console.log('🔌 Connecting to WebSocket:', wsUrl)

      const socket = new WebSocket(wsUrl)

      socket.onopen = () => {
        console.log('✅ WebSocket connected')
        setConnected(true)

        // Re-subscribe to all channels
        for (const executionId of subscriptions.current) {
          socket.send(JSON.stringify({
            type: 'subscribe',
            executionId,
          }))
        }
      }

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          // Add to events array (keep last 100)
          setEvents((prev) => {
            const newEvents = [message, ...prev].slice(0, 100)
            return newEvents
          })

          console.log('📨 WebSocket message:', message.type, message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      socket.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        setConnected(false)

        // Attempt reconnect after 3 seconds
        reconnectTimer.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...')
          connect()
        }, 3000)
      }

      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      ws.current = socket
    }, [])

    // Subscribe to execution updates
    const subscribe = useCallback((executionId: string) => {
      subscriptions.current.add(executionId)

      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'subscribe',
          executionId,
        }))
      }
    }, [])

    // Unsubscribe
    const unsubscribe = useCallback((executionId: string) => {
      subscriptions.current.delete(executionId)

      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'unsubscribe',
          channel: `execution:${executionId}`,
        }))
      }
    }, [])

    // Connect on mount
    useEffect(() => {
      connect()

      // Cleanup on unmount
      return () => {
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current)
        }
        if (ws.current) {
          ws.current.close()
        }
      }
    }, [connect])

    // Ping every 30 seconds to keep connection alive
    useEffect(() => {
      if (!connected) return

      const pingInterval = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)

      return () => clearInterval(pingInterval)
    }, [connected])

    return {
      connected,
      events,
      subscribe,
      unsubscribe,
      reconnect: connect,
    }
  }
  ```

- [ ] **5.1.2** Test hook with multiple subscriptions
- [ ] **5.1.3** Test reconnection logic
- [ ] **5.1.4** Test event accumulation and limits

**Acceptance Criteria**:
- ✅ Auto-connects on mount
- ✅ Auto-reconnects on disconnect
- ✅ Subscribes/unsubscribes correctly
- ✅ Events accumulated and limited to 100
- ✅ Ping keeps connection alive
- ✅ Cleanup on unmount

---

## PHASE 6: INTEGRATION & TESTING

### Task 6.1: Integrate with Batch Execution Flow
**Priority**: Critical
**Estimated Time**: 3 hours

#### Subtasks:
- [ ] **6.1.1** Update batch execute endpoint to create execution with new fields
- [ ] **6.1.2** Modify EVA job execution to publish WebSocket events
- [ ] **6.1.3** Add navigation to live view after starting execution
- [ ] **6.1.4** Test complete flow: Start → Live View → Control → Complete

**User Flow to Test**:
1. User uploads CSV
2. User clicks "Execute Batch"
3. Configuration modal appears
4. User confirms
5. Execution starts
6. User navigated to live view automatically
7. User sees agents working in grid
8. User sees results streaming in table
9. User adjusts concurrency mid-execution
10. User pauses execution
11. User resumes execution
12. Execution completes
13. User sees completion celebration
14. User navigated to results page

---

### Task 6.2: End-to-End Testing
**Priority**: High
**Estimated Time**: 3 hours

#### Test Scenarios:
- [ ] **6.2.1** Happy path: Upload → Execute → Watch → Complete
- [ ] **6.2.2** Pause during execution → Resume → Complete
- [ ] **6.2.3** Stop during execution → Jobs cancelled
- [ ] **6.2.4** Adjust concurrency during execution
- [ ] **6.2.5** Multiple tabs watching same execution
- [ ] **6.2.6** Network disconnect → Reconnect
- [ ] **6.2.7** Page refresh during execution (resume watching)
- [ ] **6.2.8** Very fast execution (<5 seconds)
- [ ] **6.2.9** Very long execution (>5 minutes)
- [ ] **6.2.10** Execution with all failures

---

## USER FLOWS COVERED

### Flow 1: First Execution (Happy Path)
1. ✅ User uploads CSV with 20 rows
2. ✅ User clicks "Execute Batch" → "Test Run"
3. ✅ Modal shows: "Test 20 jobs? Estimated 2 minutes"
4. ✅ User confirms
5. ✅ Page transitions to live view
6. ✅ Connection established (green dot)
7. ✅ Stats panel shows 0/20 complete
8. ✅ First 5 jobs appear in grid (5x concurrency)
9. ✅ Each card shows current URL, progress
10. ✅ Jobs complete one by one
11. ✅ Completed jobs move to results table below
12. ✅ Stats update in real-time (5/20, 10/20, etc.)
13. ✅ Success rate calculated live
14. ✅ All 20 jobs complete
15. ✅ Completion celebration shown
16. ✅ "View Results" button appears
17. ✅ User clicks to see detailed results

### Flow 2: Pause and Resume
1. ✅ Execution running with 10/50 jobs complete
2. ✅ User clicks "Pause"
3. ✅ Running jobs complete (don't interrupt)
4. ✅ No new jobs start
5. ✅ Status changes to "Paused"
6. ✅ Grid shows "Paused" state
7. ✅ User waits 10 seconds
8. ✅ User clicks "Resume"
9. ✅ New jobs start immediately
10. ✅ Execution continues normally

### Flow 3: Stop Execution
1. ✅ Execution running with 15/100 jobs complete
2. ✅ User notices errors in results
3. ✅ User clicks "Stop"
4. ✅ Confirmation dialog appears
5. ✅ User enters reason: "Wrong instructions"
6. ✅ User confirms stop
7. ✅ Running jobs complete
8. ✅ Queued jobs cancelled
9. ✅ Status changes to "Stopped"
10. ✅ Results show 15 complete, 85 cancelled

### Flow 4: Adjust Concurrency Mid-Execution
1. ✅ Execution running with concurrency 5
2. ✅ User sees it's going slowly
3. ✅ User clicks "5x" concurrency button
4. ✅ Dialog appears
5. ✅ User changes to 10
6. ✅ User clicks "Apply"
7. ✅ More agent cards appear in grid (now showing 10)
8. ✅ Execution speeds up noticeably

### Flow 5: Multiple Tabs Watching
1. ✅ User opens execution in tab 1
2. ✅ User opens same execution in tab 2
3. ✅ Both tabs receive same WebSocket events
4. ✅ Both tabs stay in sync
5. ✅ User closes tab 1
6. ✅ Tab 2 continues working normally

### Flow 6: Network Interruption
1. ✅ Execution running normally
2. ✅ User's WiFi drops for 5 seconds
3. ✅ Connection indicator turns red
4. ✅ "Disconnected" shown
5. ✅ WiFi reconnects
6. ✅ WebSocket auto-reconnects
7. ✅ Events resume streaming
8. ✅ No data loss (page may need refresh for missed events)

### Flow 7: Page Refresh During Execution
1. ✅ Execution running with 30/100 complete
2. ✅ User accidentally refreshes page
3. ✅ Page reloads
4. ✅ Live view loads current state
5. ✅ Shows 32/100 (execution continued)
6. ✅ WebSocket reconnects
7. ✅ Continues watching from current point

### Flow 8: Very Fast Execution
1. ✅ User tests 3 jobs (all cached)
2. ✅ All complete in <2 seconds
3. ✅ Live view shows brief flashes of agent cards
4. ✅ Results appear almost instantly
5. ✅ Completion shown
6. ✅ User didn't miss anything important

---

## EDGE CASES COVERED

### WebSocket Edge Cases
- [ ] ✅ Connection fails initially (retry)
- [ ] ✅ Connection drops mid-stream (reconnect)
- [ ] ✅ Multiple rapid reconnects (throttle)
- [ ] ✅ Server restarts (clients reconnect)
- [ ] ✅ Invalid messages received (ignore)
- [ ] ✅ Very large message (>1MB) (handle or reject)

### Execution Edge Cases
- [ ] ✅ All jobs fail (show 0% success)
- [ ] ✅ No jobs in batch (show empty state)
- [ ] ✅ Execution already complete when viewing (show static results)
- [ ] ✅ Pause while paused (noop)
- [ ] ✅ Resume while running (noop)
- [ ] ✅ Stop after already stopped (noop)
- [ ] ✅ Adjust concurrency to same value (noop)
- [ ] ✅ Adjust concurrency out of bounds (validate)

### UI Edge Cases
- [ ] ✅ Very long URL (truncate)
- [ ] ✅ Very long current step (wrap)
- [ ] ✅ Job with no progress updates (show spinner)
- [ ] ✅ 0% progress for extended time (show "starting")
- [ ] ✅ 100+ concurrent jobs (show only 6 in grid)
- [ ] ✅ Results table with 1000+ rows (pagination)

### Performance Edge Cases
- [ ] ✅ 1000 jobs executing (throttle UI updates)
- [ ] ✅ Events every 10ms (batch updates)
- [ ] ✅ 10 tabs watching same execution (server handles)
- [ ] ✅ Memory leak from event accumulation (limit to 100)

---

## COMPLETION CHECKLIST

- [ ] All database migrations run
- [ ] WebSocket server starts with Next.js
- [ ] All API endpoints tested
- [ ] All components render correctly
- [ ] WebSocket connection works
- [ ] Events flow end-to-end
- [ ] Pause/resume/stop work
- [ ] Concurrency adjustment works
- [ ] Live stats update in real-time
- [ ] Agent cards update smoothly
- [ ] Results stream correctly
- [ ] All user flows tested
- [ ] All edge cases handled
- [ ] Performance acceptable (60fps)
- [ ] No memory leaks
- [ ] Mobile responsive
- [ ] Accessibility audit passed
- [ ] Documentation updated
- [ ] Ready for QA

---

## SUCCESS METRICS

- ✅ Live view loads in <2 seconds
- ✅ WebSocket connection <500ms
- ✅ Event latency <100ms
- ✅ UI updates 60fps
- ✅ Can handle 100 concurrent jobs
- ✅ Can handle 10 watching clients
- ✅ Reconnection <3 seconds
- ✅ Zero blocking bugs
- ✅ User satisfaction: "This is amazing!" feedback

---

## TIMELINE

**Total: 5-7 days**

**Day 1**: Database + WebSocket infrastructure
**Day 2**: WebSocket events + API controls
**Day 3**: Live execution page + grid component
**Day 4**: Stats panel + controls component
**Day 5**: Integration + testing
**Day 6-7**: Bug fixes + polish + documentation

🚀 **This is the WOW feature!**
