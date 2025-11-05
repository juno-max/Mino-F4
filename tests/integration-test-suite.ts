/**
 * Comprehensive Integration Test Suite
 * Tests all major features implemented in the platform
 *
 * Run with: npx tsx tests/integration-test-suite.ts
 */

import { db, projects, batches, jobs, executions } from '../db'
import { eq } from 'drizzle-orm'

const API_URL = process.env.API_URL || 'http://localhost:3001'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration?: number
}

const results: TestResult[] = []

function log(message: string) {
  console.log(`[TEST] ${message}`)
}

function logSuccess(testName: string) {
  console.log(`✅ ${testName}`)
  results.push({ name: testName, passed: true })
}

function logFailure(testName: string, error: string) {
  console.error(`❌ ${testName}: ${error}`)
  results.push({ name: testName, passed: false, error })
}

async function testDatabaseIndexes() {
  log('Testing database indexes...')

  try {
    // Query to check if indexes exist
    const indexQuery = `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('jobs', 'batches', 'executions', 'sessions')
      ORDER BY indexname;
    `

    const indexes = await db.execute(indexQuery) as any

    // Expected indexes
    const expectedIndexes = [
      'idx_batches_project_id',
      'idx_jobs_batch_id',
      'idx_jobs_project_id',
      'idx_jobs_status_batch',
      'idx_jobs_running',
      'idx_jobs_queued',
      'idx_jobs_with_gt',
      'idx_sessions_job_id',
      'idx_executions_batch_id',
      'idx_executions_project_id',
    ]

    const foundIndexNames = indexes.rows.map((row: any) => row.indexname)
    const missingIndexes = expectedIndexes.filter(idx => !foundIndexNames.includes(idx))

    if (missingIndexes.length > 0) {
      logFailure('Database Indexes', `Missing indexes: ${missingIndexes.join(', ')}`)
    } else {
      logSuccess('Database Indexes - All indexes exist')
    }
  } catch (error: any) {
    logFailure('Database Indexes', error.message)
  }
}

async function testAPIValidation() {
  log('Testing API validation...')

  try {
    // Test 1: Invalid project creation (missing required fields)
    const response1 = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }), // Invalid: empty name
    })

    if (response1.status === 400) {
      logSuccess('API Validation - Rejects empty project name')
    } else {
      logFailure('API Validation', `Expected 400, got ${response1.status}`)
    }

    // Test 2: Invalid UUID format
    const response2 = await fetch(`${API_URL}/api/projects/invalid-uuid`, {
      method: 'GET',
    })

    if (response2.status === 400) {
      logSuccess('API Validation - Rejects invalid UUID')
    } else {
      logFailure('API Validation', `Expected 400, got ${response2.status}`)
    }

    // Test 3: Invalid execution parameters
    const response3 = await fetch(`${API_URL}/api/projects/550e8400-e29b-41d4-a716-446655440000/batches/550e8400-e29b-41d4-a716-446655440001/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        executionType: 'invalid',
        sampleSize: -1,
      }),
    })

    if (response3.status === 400) {
      logSuccess('API Validation - Rejects invalid execution parameters')
    } else {
      logFailure('API Validation', `Expected 400, got ${response3.status}`)
    }
  } catch (error: any) {
    logFailure('API Validation', error.message)
  }
}

async function testPagination() {
  log('Testing pagination...')

  try {
    // Create a test project
    const projectResponse = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pagination Test Project',
        instructions: 'Test pagination functionality',
      }),
    })

    const project = await projectResponse.json()

    // Create a batch
    const batchResponse = await fetch(`${API_URL}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: project.id,
        name: 'Pagination Test Batch',
        csv_file: new Blob(['url,name\ntest.com,Test'], { type: 'text/csv' }),
      }),
    })

    const batch = await batchResponse.json()

    // Test pagination on jobs endpoint
    const jobsResponse = await fetch(`${API_URL}/api/batches/${batch.id}/jobs?limit=10`)
    const jobsData = await jobsResponse.json()

    if (jobsData.pagination) {
      logSuccess('Pagination - Returns pagination metadata')
    } else {
      logFailure('Pagination', 'Missing pagination metadata')
    }

    if (jobsData.pagination?.hasMore !== undefined && jobsData.pagination?.nextCursor !== undefined) {
      logSuccess('Pagination - Has hasMore and nextCursor fields')
    } else {
      logFailure('Pagination', 'Missing hasMore or nextCursor fields')
    }

    // Cleanup
    await fetch(`${API_URL}/api/batches/${batch.id}`, { method: 'DELETE' })
    await fetch(`${API_URL}/api/projects/${project.id}`, { method: 'DELETE' })
  } catch (error: any) {
    logFailure('Pagination', error.message)
  }
}

async function testBulkOperations() {
  log('Testing bulk operations...')

  try {
    // Test bulk delete with invalid job IDs
    const deleteResponse = await fetch(`${API_URL}/api/jobs/bulk/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobIds: ['550e8400-e29b-41d4-a716-446655440000'],
      }),
    })

    // Should return 404 since jobs don't exist
    if (deleteResponse.status === 404) {
      logSuccess('Bulk Operations - Delete handles non-existent jobs')
    } else {
      logFailure('Bulk Operations', `Delete: Expected 404, got ${deleteResponse.status}`)
    }

    // Test bulk update validation
    const updateResponse = await fetch(`${API_URL}/api/jobs/bulk/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobIds: [],
        updates: { status: 'completed' },
      }),
    })

    // Should return 400 since jobIds array is empty
    if (updateResponse.status === 400) {
      logSuccess('Bulk Operations - Update validates empty jobIds array')
    } else {
      logFailure('Bulk Operations', `Update: Expected 400, got ${updateResponse.status}`)
    }

    // Test bulk rerun validation
    const rerunResponse = await fetch(`${API_URL}/api/jobs/bulk/rerun`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobIds: ['invalid-uuid'],
      }),
    })

    // Should return 400 since UUID is invalid
    if (rerunResponse.status === 400) {
      logSuccess('Bulk Operations - Rerun validates UUID format')
    } else {
      logFailure('Bulk Operations', `Rerun: Expected 400, got ${rerunResponse.status}`)
    }
  } catch (error: any) {
    logFailure('Bulk Operations', error.message)
  }
}

async function testRetryLogicIntegration() {
  log('Testing retry logic integration...')

  try {
    // Verify retry logic modules exist and export correctly
    const { withRetry, RetryPresets, classifyError, isRetryable } = await import('../lib/retry-logic')

    if (typeof withRetry === 'function') {
      logSuccess('Retry Logic - withRetry function exists')
    } else {
      logFailure('Retry Logic', 'withRetry is not a function')
    }

    if (RetryPresets.PATIENT && RetryPresets.FAST && RetryPresets.STANDARD) {
      logSuccess('Retry Logic - RetryPresets defined')
    } else {
      logFailure('Retry Logic', 'RetryPresets missing expected presets')
    }

    if (typeof classifyError === 'function' && typeof isRetryable === 'function') {
      logSuccess('Retry Logic - Error classification functions exist')
    } else {
      logFailure('Retry Logic', 'Missing error classification functions')
    }

    // Test error classification
    const testError = new Error('Rate limit exceeded')
    const category = classifyError(testError)
    if (category === 'rate_limit') {
      logSuccess('Retry Logic - Correctly classifies rate limit errors')
    } else {
      logFailure('Retry Logic', `Expected rate_limit category, got ${category}`)
    }

    // Test isRetryable
    const permanentError = new Error('Not found')
    if (!isRetryable(permanentError)) {
      logSuccess('Retry Logic - Correctly identifies non-retryable errors')
    } else {
      logFailure('Retry Logic', 'Should not retry permanent errors')
    }
  } catch (error: any) {
    logFailure('Retry Logic', error.message)
  }
}

async function testConcurrencyControl() {
  log('Testing concurrency control...')

  try {
    // Verify concurrency control modules exist and export correctly
    const { createConcurrencyController, ExecutionPool } = await import('../lib/concurrency-control')

    if (typeof createConcurrencyController === 'function') {
      logSuccess('Concurrency Control - createConcurrencyController function exists')
    } else {
      logFailure('Concurrency Control', 'createConcurrencyController is not a function')
    }

    // Create a controller and test basic functionality
    const controller = createConcurrencyController(3)

    if (controller.getCurrentConcurrency() === 3) {
      logSuccess('Concurrency Control - Controller initializes with correct limit')
    } else {
      logFailure('Concurrency Control', `Expected limit 3, got ${controller.getCurrentConcurrency()}`)
    }

    // Test dynamic concurrency adjustment
    controller.updateConcurrency(5)
    if (controller.getCurrentConcurrency() === 5) {
      logSuccess('Concurrency Control - Dynamic concurrency adjustment works')
    } else {
      logFailure('Concurrency Control', 'Failed to update concurrency')
    }

    // Test metrics tracking
    if (typeof controller.getActiveCount === 'function' && typeof controller.getPendingCount === 'function') {
      logSuccess('Concurrency Control - Metrics tracking functions exist')
    } else {
      logFailure('Concurrency Control', 'Missing metrics tracking functions')
    }

    // Test ExecutionPool
    if (typeof ExecutionPool === 'function') {
      const pool = new ExecutionPool(3)
      if (pool.getMetrics) {
        logSuccess('Concurrency Control - ExecutionPool with metrics tracking')
      } else {
        logFailure('Concurrency Control', 'ExecutionPool missing metrics')
      }
    }
  } catch (error: any) {
    logFailure('Concurrency Control', error.message)
  }
}

async function testErrorCodes() {
  log('Testing structured error codes...')

  try {
    const { ErrorCodes, ApiError } = await import('../lib/error-codes')

    if (ErrorCodes.VALIDATION_ERROR && ErrorCodes.NOT_FOUND && ErrorCodes.INTERNAL_ERROR) {
      logSuccess('Error Codes - Core error codes defined')
    } else {
      logFailure('Error Codes', 'Missing core error codes')
    }

    if (typeof ApiError === 'function') {
      const testError = new ApiError('Test error', ErrorCodes.VALIDATION_ERROR, 400)
      if (testError.message === 'Test error' && testError.code === 'VALIDATION_ERROR' && testError.statusCode === 400) {
        logSuccess('Error Codes - ApiError class works correctly')
      } else {
        logFailure('Error Codes', 'ApiError properties incorrect')
      }
    } else {
      logFailure('Error Codes', 'ApiError is not a class')
    }
  } catch (error: any) {
    logFailure('Error Codes', error.message)
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('INTEGRATION TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`\nTotal Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\nFailed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}`)
      if (r.error) {
        console.log(`     Error: ${r.error}`)
      }
    })
  }

  console.log('\n' + '='.repeat(60))

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0)
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Integration Tests\n')

  await testDatabaseIndexes()
  await testAPIValidation()
  await testPagination()
  await testBulkOperations()
  await testRetryLogicIntegration()
  await testConcurrencyControl()
  await testErrorCodes()

  await printSummary()
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})
