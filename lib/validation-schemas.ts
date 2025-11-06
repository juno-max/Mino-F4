/**
 * Comprehensive Zod Validation Schemas
 * All API endpoints should use these schemas for runtime validation
 */

import { z } from 'zod'

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format')
export const urlSchema = z.string().url('Invalid URL format')
export const emailSchema = z.string().email('Invalid email format')
export const positiveIntSchema = z.number().int().positive('Must be a positive integer')
export const nonNegativeIntSchema = z.number().int().min(0, 'Must be non-negative')
export const percentageSchema = z.number().min(0).max(100, 'Must be between 0-100')

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  instructions: z.string()
    .min(10, 'Instructions must be at least 10 characters')
    .max(10000, 'Instructions must be 10,000 characters or less')
    .trim(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const projectIdSchema = z.object({
  id: uuidSchema,
})

// ============================================================================
// BATCH SCHEMAS
// ============================================================================

export const columnSchemaItem = z.object({
  name: z.string().min(1, 'Column name is required'),
  type: z.enum(['text', 'number', 'url', 'email', 'date', 'boolean'], {
    errorMap: () => ({ message: 'Invalid column type' }),
  }),
  isUrl: z.boolean(),
  isGroundTruth: z.boolean(),
})

export const createBatchSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  csvData: z.array(z.record(z.any()))
    .min(1, 'At least one row is required')
    .max(10000, 'Maximum 10,000 rows allowed'),
  columnSchema: z.array(columnSchemaItem)
    .min(1, 'At least one column is required'),
})

export const updateBatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

export const batchIdSchema = z.object({
  id: uuidSchema,
})

export const projectBatchParamsSchema = z.object({
  id: uuidSchema,
  batchId: uuidSchema,
})

// ============================================================================
// EXECUTION SCHEMAS
// ============================================================================

export const executeSchema = z.object({
  executionType: z.enum(['test', 'production'], {
    errorMap: () => ({ message: 'executionType must be either "test" or "production"' }),
  }),
  sampleSize: z.number()
    .int('Sample size must be an integer')
    .min(1, 'Sample size must be at least 1')
    .max(1000, 'Maximum sample size is 1000'),
  useAgentQL: z.boolean().optional().default(false),
  concurrency: z.number()
    .int()
    .min(1, 'Concurrency must be at least 1')
    .max(50, 'Maximum concurrency is 50')
    .optional()
    .default(5),
})

export const updateConcurrencySchema = z.object({
  concurrency: z.number()
    .int('Concurrency must be an integer')
    .min(1, 'Concurrency must be at least 1')
    .max(50, 'Maximum concurrency is 50'),
})

export const executionIdSchema = z.object({
  id: uuidSchema,
})

// ============================================================================
// GROUND TRUTH SCHEMAS
// ============================================================================

export const bulkSetGTSchema = z.object({
  updates: z.array(z.object({
    jobId: uuidSchema,
    groundTruthData: z.record(z.string(), z.any()),
  }))
  .min(1, 'At least one update is required')
  .max(1000, 'Maximum 1000 updates per request'),
})

export const bulkEditGTSchema = z.object({
  jobIds: z.array(uuidSchema)
    .min(1, 'At least one job ID is required')
    .max(1000, 'Maximum 1000 jobs per request'),
  operation: z.enum(['set', 'clear', 'copy'], {
    errorMap: () => ({ message: 'Operation must be "set", "clear", or "copy"' }),
  }),
  field: z.string().min(1, 'Field name is required').optional(),
  value: z.any().optional(),
  sourceJobId: uuidSchema.optional(),
})

// ============================================================================
// BULK OPERATION SCHEMAS
// ============================================================================

export const bulkDeleteJobsSchema = z.object({
  jobIds: z.array(uuidSchema)
    .min(1, 'At least one job ID is required')
    .max(1000, 'Maximum 1000 jobs per request'),
  batchId: uuidSchema.optional(),
})

export const bulkRerunJobsSchema = z.object({
  jobIds: z.array(uuidSchema)
    .min(1, 'At least one job ID is required')
    .max(100, 'Maximum 100 jobs per rerun request'),
  executionType: z.enum(['test', 'production']).optional().default('test'),
  useAgentQL: z.boolean().optional().default(true),
})

export const bulkUpdateJobsSchema = z.object({
  jobIds: z.array(uuidSchema)
    .min(1, 'At least one job ID is required')
    .max(1000, 'Maximum 1000 jobs per request'),
  updates: z.object({
    status: z.enum(['queued', 'running', 'completed', 'error']).optional(),
    groundTruthData: z.record(z.string(), z.any()).optional(),
  }),
})

export const snapshotSchema = z.object({
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  executionId: uuidSchema.optional(),
})

// ============================================================================
// EXPORT SCHEMAS
// ============================================================================

export const exportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx'], {
    errorMap: () => ({ message: 'Format must be "csv", "json", or "xlsx"' }),
  }),
  columns: z.array(z.string()).optional(),
  includeGroundTruth: z.boolean().optional().default(false),
  includeComparison: z.boolean().optional().default(false),
  filters: z.object({
    status: z.array(z.enum(['queued', 'running', 'completed', 'error'])).optional(),
    hasGroundTruth: z.boolean().optional(),
    evaluationResult: z.array(z.enum(['pass', 'fail'])).optional(),
    accuracyRange: z.object({
      min: percentageSchema,
      max: percentageSchema,
    }).optional(),
    search: z.string().max(200).optional(),
  }).optional(),
})

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const jobFilterSchema = z.object({
  status: z.string()
    .regex(/^(queued|running|completed|error)(,(queued|running|completed|error))*$/, {
      message: 'Invalid status format. Use comma-separated: queued,running,completed,error',
    })
    .optional(),
  hasGroundTruth: z.enum(['true', 'false'], {
    errorMap: () => ({ message: 'hasGroundTruth must be "true" or "false"' }),
  }).optional(),
  evaluationResult: z.string()
    .regex(/^(pass|fail)(,(pass|fail))*$/, {
      message: 'Invalid evaluationResult format. Use comma-separated: pass,fail',
    })
    .optional(),
  accuracyMin: z.string()
    .regex(/^\d+$/, 'accuracyMin must be a number')
    .transform(val => parseInt(val))
    .pipe(z.number().min(0).max(100))
    .optional(),
  accuracyMax: z.string()
    .regex(/^\d+$/, 'accuracyMax must be a number')
    .transform(val => parseInt(val))
    .pipe(z.number().min(0).max(100))
    .optional(),
  search: z.string().max(200, 'Search query too long').optional(),
})

// Pagination schema for query parameters
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(val => Math.min(parseInt(val), 100))
    .optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// ============================================================================
// INSTRUCTION VERSION SCHEMAS
// ============================================================================

export const createVersionSchema = z.object({
  instructions: z.string()
    .min(10, 'Instructions must be at least 10 characters')
    .max(10000, 'Instructions must be 10,000 characters or less'),
  changeDescription: z.string()
    .max(500, 'Change description must be 500 characters or less')
    .optional(),
  setAsProduction: z.boolean().optional().default(false),
})

export const versionIdSchema = z.object({
  versionId: uuidSchema,
})

// ============================================================================
// JOB SCHEMAS
// ============================================================================

export const jobIdSchema = z.object({
  id: uuidSchema,
})

export const updateJobSchema = z.object({
  goal: z.string().min(10).max(5000).optional(),
  groundTruthData: z.record(z.string(), z.any()).optional(),
  hasGroundTruth: z.boolean().optional(),
  status: z.enum(['queued', 'running', 'completed', 'error'], {
    errorMap: () => ({ message: 'Status must be one of: queued, running, completed, error' }),
  }).optional(),
  isEvaluated: z.boolean().optional(),
  evaluationResult: z.enum(['pass', 'fail'], {
    errorMap: () => ({ message: 'Evaluation result must be either "pass" or "fail"' }),
  }).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
)

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

export const sessionIdSchema = z.object({
  id: uuidSchema,
})

// ============================================================================
// BULK OPERATION SCHEMAS
// ============================================================================

export const bulkActionSchema = z.object({
  action: z.enum(['delete', 'rerun', 'update_instructions', 'update_status'], {
    errorMap: () => ({ message: 'Invalid action type' }),
  }),
  jobIds: z.array(uuidSchema)
    .min(1, 'At least one job ID is required')
    .max(1000, 'Maximum 1000 jobs per bulk operation'),
  params: z.record(z.any()).optional(),
})

// ============================================================================
// RETRY SCHEMAS
// ============================================================================

export const retryConfigSchema = z.object({
  maxRetries: z.number().int().min(1).max(10).optional(),
  baseDelayMs: z.number().int().min(100).max(60000).optional(),
})

// ============================================================================
// ANALYTICS SCHEMAS
// ============================================================================

export const analyticsQuerySchema = z.object({
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
  columns: z.array(z.string()).optional(),
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate and transform data
 * Returns either validated data or formatted errors
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data)

  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    }
  }

  return {
    success: true as const,
    data: result.data,
  }
}

/**
 * Create a Zod error response
 */
export function formatZodError(error: z.ZodError) {
  return {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: error.issues.map(issue => ({
      path: issue.path.join('.') || 'body',
      message: issue.message,
      code: issue.code,
    })),
  }
}
