import { pgTable, text, uuid, timestamp, jsonb, integer, decimal, boolean } from 'drizzle-orm/pg-core'

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

// Executions Table
export const executions = pgTable('executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull().default('pending'), // pending, running, completed, failed
  executionType: text('execution_type').notNull().default('test'), // test, production
  totalSites: integer('total_sites').notNull(),
  completedSites: integer('completed_sites').default(0).notNull(),
  successfulSites: integer('successful_sites').default(0).notNull(),
  failedSites: integer('failed_sites').default(0).notNull(),
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

// Types for TypeScript
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

export type Batch = typeof batches.$inferSelect
export type NewBatch = typeof batches.$inferInsert

export type Execution = typeof executions.$inferSelect
export type NewExecution = typeof executions.$inferInsert

export type ExecutionResult = typeof executionResults.$inferSelect
export type NewExecutionResult = typeof executionResults.$inferInsert

export type AccuracyMetric = typeof accuracyMetrics.$inferSelect
export type NewAccuracyMetric = typeof accuracyMetrics.$inferInsert

export type FailurePattern = typeof failurePatterns.$inferSelect
export type NewFailurePattern = typeof failurePatterns.$inferInsert
