import { pgTable, text, uuid, timestamp, jsonb, integer, decimal, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Projects Table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  instructions: text('instructions').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Instruction Versions Table
export const instructionVersions = pgTable('instruction_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  instructions: text('instructions').notNull(),
  versionNumber: integer('version_number').notNull(),
  changeDescription: text('change_description'),
  accuracyImpact: decimal('accuracy_impact', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Batches Table - Flexible JSONB schema
export const batches = pgTable('batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  // Flexible column schema - stores array of { name, type, isGroundTruth, isUrl }
  columnSchema: jsonb('column_schema').notNull().$type<Array<{
    name: string
    type: 'text' | 'number' | 'url'
    isGroundTruth: boolean
    isUrl: boolean
  }>>(),
  // CSV data - array of row objects with dynamic keys
  csvData: jsonb('csv_data').notNull().$type<Array<Record<string, any>>>(),
  hasGroundTruth: boolean('has_ground_truth').default(false).notNull(),
  groundTruthColumns: text('ground_truth_columns').array(),
  totalSites: integer('total_sites').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Jobs Table (individual tasks from batch rows)
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  inputId: text('input_id').notNull(), // Row identifier from CSV
  siteUrl: text('site_url').notNull(),
  siteName: text('site_name'),
  goal: text('goal').notNull(), // Generated from project instructions + row data
  // Full CSV row data (all input columns)
  csvRowData: jsonb('csv_row_data').$type<Record<string, any>>(),
  // Ground truth data from CSV for this job
  groundTruthData: jsonb('ground_truth_data').$type<Record<string, any>>(),
  status: text('status').notNull().default('queued'), // queued, running, completed, error, labeled
  hasGroundTruth: boolean('has_ground_truth').default(false).notNull(),
  isEvaluated: boolean('is_evaluated').default(false).notNull(),
  evaluationResult: text('evaluation_result'), // pass, fail
  lastRunAt: timestamp('last_run_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Sessions Table (execution attempts for a job)
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  sessionNumber: integer('session_number').notNull(), // #1, #2, #3, etc
  status: text('status').notNull().default('pending'), // pending, running, completed, failed
  // Extracted output from AgentQL execution
  extractedData: jsonb('extracted_data').$type<Record<string, any>>(),
  rawOutput: text('raw_output'),
  errorMessage: text('error_message'),
  failureReason: text('failure_reason'),
  executionTimeMs: integer('execution_time_ms'),
  // Screenshot/chapter data for playback
  screenshots: jsonb('screenshots').$type<Array<{
    timestamp: string
    title: string
    description: string
    screenshotUrl: string
  }>>(),
  streamingUrl: text('streaming_url'), // Live browser stream URL from EVA agent
  screenshotUrl: text('screenshot_url'), // Final screenshot URL from execution
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Executions Table (batch-level execution runs)
export const executions = pgTable('executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull().default('pending'), // pending, running, completed, failed
  executionType: text('execution_type').notNull().default('test'), // test, production
  concurrency: integer('concurrency').default(20).notNull(),
  totalJobs: integer('total_jobs').notNull(),
  completedJobs: integer('completed_jobs').default(0).notNull(),
  runningJobs: integer('running_jobs').default(0).notNull(),
  queuedJobs: integer('queued_jobs').default(0).notNull(),
  errorJobs: integer('error_jobs').default(0).notNull(),
  evaluatedJobs: integer('evaluated_jobs').default(0).notNull(),
  passedJobs: integer('passed_jobs').default(0).notNull(),
  failedJobs: integer('failed_jobs').default(0).notNull(),
  passRate: decimal('pass_rate', { precision: 5, scale: 2 }),
  accuracyPercentage: decimal('accuracy_percentage', { precision: 5, scale: 2 }),
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Execution Results Table - Flexible JSONB for extracted data
export const executionResults = pgTable('execution_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').references(() => executions.id, { onDelete: 'cascade' }).notNull(),
  siteUrl: text('site_url').notNull(),
  siteName: text('site_name'),
  // Flexible extracted data - dynamic keys based on column schema
  extractedData: jsonb('extracted_data').$type<Record<string, any>>(),
  // Ground truth data - dynamic keys based on column schema
  groundTruthData: jsonb('ground_truth_data').$type<Record<string, any>>(),
  isAccurate: boolean('is_accurate'),
  matchPercentage: decimal('match_percentage', { precision: 5, scale: 2 }),
  failureReason: text('failure_reason'),
  failureCategory: text('failure_category'),
  executionTimeMs: integer('execution_time_ms'),
  screenshotUrl: text('screenshot_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Accuracy Metrics Table - Dynamic column-level accuracy
export const accuracyMetrics = pgTable('accuracy_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').references(() => executions.id, { onDelete: 'cascade' }).notNull(),
  // Column-level accuracy stored as JSONB
  // Structure: { columnName: { total, accurate, accuracyPercentage } }
  columnAccuracies: jsonb('column_accuracies').notNull().$type<Record<string, {
    total: number
    accurate: number
    accuracyPercentage: number
  }>>(),
  overallAccuracy: decimal('overall_accuracy', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Failure Patterns Table
export const failurePatterns = pgTable('failure_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').references(() => executions.id, { onDelete: 'cascade' }).notNull(),
  patternDescription: text('pattern_description').notNull(),
  patternCategory: text('pattern_category'),
  affectedSitesCount: integer('affected_sites_count').notNull(),
  suggestedFix: text('suggested_fix'),
  affectedColumns: text('affected_columns').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  batches: many(batches),
  jobs: many(jobs),
  executions: many(executions),
}))

export const batchesRelations = relations(batches, ({ one, many }) => ({
  project: one(projects, {
    fields: [batches.projectId],
    references: [projects.id],
  }),
  jobs: many(jobs),
  executions: many(executions),
}))

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  batch: one(batches, {
    fields: [jobs.batchId],
    references: [batches.id],
  }),
  project: one(projects, {
    fields: [jobs.projectId],
    references: [projects.id],
  }),
  sessions: many(sessions),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  job: one(jobs, {
    fields: [sessions.jobId],
    references: [jobs.id],
  }),
}))

export const executionsRelations = relations(executions, ({ one, many }) => ({
  batch: one(batches, {
    fields: [executions.batchId],
    references: [batches.id],
  }),
  project: one(projects, {
    fields: [executions.projectId],
    references: [projects.id],
  }),
  results: many(executionResults),
  accuracyMetrics: many(accuracyMetrics),
  failurePatterns: many(failurePatterns),
}))

export const executionResultsRelations = relations(executionResults, ({ one }) => ({
  execution: one(executions, {
    fields: [executionResults.executionId],
    references: [executions.id],
  }),
}))

export const accuracyMetricsRelations = relations(accuracyMetrics, ({ one }) => ({
  execution: one(executions, {
    fields: [accuracyMetrics.executionId],
    references: [executions.id],
  }),
}))

export const failurePatternsRelations = relations(failurePatterns, ({ one }) => ({
  execution: one(executions, {
    fields: [failurePatterns.executionId],
    references: [executions.id],
  }),
}))

// Types for TypeScript
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

export type Batch = typeof batches.$inferSelect
export type NewBatch = typeof batches.$inferInsert

export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type Execution = typeof executions.$inferSelect
export type NewExecution = typeof executions.$inferInsert

export type ExecutionResult = typeof executionResults.$inferSelect
export type NewExecutionResult = typeof executionResults.$inferInsert

export type AccuracyMetric = typeof accuracyMetrics.$inferSelect
export type NewAccuracyMetric = typeof accuracyMetrics.$inferInsert

export type FailurePattern = typeof failurePatterns.$inferSelect
export type NewFailurePattern = typeof failurePatterns.$inferInsert
