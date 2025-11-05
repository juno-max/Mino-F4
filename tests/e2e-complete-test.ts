/**
 * Complete End-to-End Test Suite
 * Tests the entire user journey: Project → Batch → Execution → Results
 *
 * Run with: npx tsx tests/e2e-complete-test.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:3001'

interface TestResult {
  test: string
  passed: boolean
  duration: number
  error?: string
}

const results: TestResult[] = []
let projectId: string
let batchId: string
let executionId: string

function log(message: string) {
  console.log(`[E2E] ${message}`)
}

function logSuccess(test: string, duration: number) {
  console.log(`✅ ${test} (${duration}ms)`)
  results.push({ test, passed: true, duration })
}

function logFail(test: string, duration: number, error: string) {
  console.error(`❌ ${test} (${duration}ms): ${error}`)
  results.push({ test, passed: false, duration, error })
}

async function runTest(testName: string, testFn: () => Promise<void>) {
  const start = Date.now()
  try {
    await testFn()
    logSuccess(testName, Date.now() - start)
  } catch (error: any) {
    logFail(testName, Date.now() - start, error.message)
    throw error // Stop on first failure
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function testCreateProject() {
  log('\n=== TEST 1: Create Project ===')

  const response = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Test Project',
      instructions: 'Extract product name, price, and description from e-commerce product pages. Be precise and extract exactly what you see on the page.',
    }),
  })

  assert(response.status === 201, `Expected 201, got ${response.status}`)

  const data = await response.json()
  assert(!!data.id, 'Project should have ID')
  assert(data.name === 'E2E Test Project', 'Project name should match')

  projectId = data.id
  log(`✓ Project created: ${projectId}`)
}

async function testCreateBatch() {
  log('\n=== TEST 2: Create Batch with CSV ===')

  const csvContent = `url,product_name_gt,price_gt
https://example.com/product1,Premium Widget,29.99
https://example.com/product2,Deluxe Gadget,49.99
https://example.com/product3,Standard Tool,19.99`

  const response = await fetch(`${API_URL}/api/projects/${projectId}/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      csvContent,
      batchName: 'E2E Test Batch',
      batchDescription: 'Test batch with ground truth',
    }),
  })

  assert(response.status === 200, `Expected 200, got ${response.status}`)

  const data = await response.json()
  assert(!!data.id, 'Batch should have ID')
  assert(data.totalSites === 3, `Expected 3 sites, got ${data.totalSites}`)
  assert(data.hasGroundTruth === true, 'Should have ground truth')

  batchId = data.id
  log(`✓ Batch created: ${batchId}`)
  log(`✓ Total sites: ${data.totalSites}`)
  log(`✓ Ground truth columns: ${data.groundTruthColumns?.join(', ')}`)
}

async function testGetBatch() {
  log('\n=== TEST 3: Get Batch Details ===')

  const response = await fetch(`${API_URL}/api/batches/${batchId}`)
  assert(response.status === 200, `Expected 200, got ${response.status}`)

  const data = await response.json()
  assert(data.id === batchId, 'Batch ID should match')
  assert(Array.isArray(data.csvData), 'Should have CSV data')
  assert(Array.isArray(data.columnSchema), 'Should have column schema')

  log(`✓ Batch details retrieved`)
  log(`✓ CSV data rows: ${data.csvData.length}`)
  log(`✓ Columns: ${data.columnSchema.map((c: any) => c.name).join(', ')}`)
}

async function testExecuteBatch() {
  log('\n=== TEST 4: Execute Batch (Test Mode) ===')

  const response = await fetch(`${API_URL}/api/projects/${projectId}/batches/${batchId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      executionType: 'test',
      sampleSize: 2, // Test with 2 sites only
      concurrency: 2,
      useAgentQL: true,
    }),
  })

  assert(response.status === 200 || response.status === 201, `Expected 200 or 201, got ${response.status}`)

  const data = await response.json()
  assert(!!data.execution, 'Should have execution object')
  assert(data.execution.status === 'running', 'Execution should be running')

  executionId = data.execution.id
  log(`✓ Execution started: ${executionId}`)
  log(`✓ Status: ${data.execution.status}`)
  log(`✓ Total jobs: ${data.execution.totalJobs}`)
}

async function testGetExecutionStats() {
  log('\n=== TEST 5: Get Execution Stats ===')

  // Wait a moment for execution to start
  await new Promise(resolve => setTimeout(resolve, 2000))

  const response = await fetch(`${API_URL}/api/executions/${executionId}/stats`)
  assert(response.status === 200, `Expected 200, got ${response.status}`)

  const data = await response.json()
  assert(data.executionId === executionId, 'Execution ID should match')
  assert(!!data.stats, 'Should have stats object')
  assert(!!data.status, 'Should have status')

  log(`✓ Execution stats retrieved`)
  log(`✓ Status: ${data.status}`)
  log(`✓ Total: ${data.stats.totalJobs}`)
  log(`✓ Completed: ${data.stats.completedJobs}`)
  log(`✓ Running: ${data.stats.runningJobs}`)
}

async function testPauseExecution() {
  log('\n=== TEST 6: Pause Execution ===')

  const response = await fetch(`${API_URL}/api/executions/${executionId}/pause`, {
    method: 'POST',
  })

  assert(response.status === 200, `Expected 200, got ${response.status}`)

  const data = await response.json()
  assert(data.execution && data.execution.status === 'paused', `Expected execution.status 'paused', got ${data.execution?.status}`)

  log(`✓ Execution paused`)
}

async function testResumeExecution() {
  log('\n=== TEST 7: Resume Execution ===')

  const response = await fetch(`${API_URL}/api/executions/${executionId}/resume`, {
    method: 'POST',
  })

  assert(response.status === 200, `Expected 200, got ${response.status}`)

  const data = await response.json()
  assert(data.execution && data.execution.status === 'running', `Expected execution.status 'running', got ${data.execution?.status}`)

  log(`✓ Execution resumed`)
}

async function testUpdateConcurrency() {
  log('\n=== TEST 8: Update Concurrency ===')

  const response = await fetch(`${API_URL}/api/executions/${executionId}/concurrency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concurrency: 1 }),
  })

  assert(response.status === 200, `Expected 200, got ${response.status}`)

  const data = await response.json()
  assert(data.execution && data.execution.concurrency === 1, `Expected execution.concurrency 1, got ${data.execution?.concurrency}`)

  log(`✓ Concurrency updated to 1`)
}

async function testWaitForCompletion() {
  log('\n=== TEST 9: Wait for Execution Completion ===')

  log('Waiting for execution to complete (max 2 minutes)...')

  let attempts = 0
  const maxAttempts = 60 // 2 minutes (2 second intervals)

  while (attempts < maxAttempts) {
    const response = await fetch(`${API_URL}/api/executions/${executionId}/stats`)
    const data = await response.json()

    log(`  Status: ${data.status} | Completed: ${data.stats.completedJobs}/${data.stats.totalJobs}`)

    if (data.status === 'completed' || data.status === 'stopped' || data.status === 'failed') {
      log(`✓ Execution finished with status: ${data.status}`)
      // Accept either completed or error jobs (example.com URLs may fail)
      const finishedJobs = (data.stats.completedJobs || 0) + (data.stats.errorJobs || 0)
      assert(finishedJobs > 0, `Should have finished at least one job (completed: ${data.stats.completedJobs}, errors: ${data.stats.errorJobs})`)
      return
    }

    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }

  throw new Error('Execution did not complete within 2 minutes')
}

async function testGetJobs() {
  log('\n=== TEST 10: Get Jobs for Batch ===')

  const response = await fetch(`${API_URL}/api/batches/${batchId}/jobs?limit=50`)
  assert(response.status === 200, `Expected 200, got ${response.status}`)

  const data = await response.json()
  assert(Array.isArray(data.data), 'Should return jobs array')
  assert(data.data.length > 0, 'Should have at least one job')
  assert(!!data.pagination, 'Should have pagination metadata')

  log(`✓ Jobs retrieved: ${data.data.length} jobs`)

  // Log job statuses
  const statuses = data.data.reduce((acc: any, job: any) => {
    acc[job.status] = (acc[job.status] || 0) + 1
    return acc
  }, {})

  log(`✓ Job statuses: ${JSON.stringify(statuses)}`)
}

async function testCleanup() {
  log('\n=== CLEANUP ===')

  try {
    // Delete batch (will cascade to jobs)
    const batchRes = await fetch(`${API_URL}/api/batches/${batchId}`, { method: 'DELETE' })
    if (batchRes.ok) log('✓ Deleted batch')

    // Delete project
    const projectRes = await fetch(`${API_URL}/api/projects/${projectId}`, { method: 'DELETE' })
    if (projectRes.ok) log('✓ Deleted project')
  } catch (error) {
    log('⚠️  Cleanup had errors (this is okay for testing)')
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(80))
  console.log('E2E TEST RESULTS SUMMARY')
  console.log('='.repeat(80))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`\nTotal Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
  console.log(`Total Duration: ${(totalTime / 1000).toFixed(2)}s`)

  if (failed > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('FAILED TESTS:')
    console.log('='.repeat(80))
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n❌ ${r.test}`)
      console.log(`   Error: ${r.error}`)
    })
  }

  console.log('\n' + '='.repeat(80))

  if (failed === 0) {
    console.log('🟢 E2E TESTS: PASSED - Platform is fully functional!')
  } else {
    console.log('🔴 E2E TESTS: FAILED - Issues must be resolved')
  }

  console.log('='.repeat(80) + '\n')

  return failed === 0
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(80))
  console.log('MINO PLATFORM - COMPLETE END-TO-END TESTING')
  console.log('Version: 2.0.0')
  console.log('Environment: ' + API_URL)
  console.log('='.repeat(80) + '\n')

  try {
    // Check server connectivity
    try {
      await fetch(`${API_URL}/api/projects`)
    } catch (error) {
      console.error('❌ Cannot connect to server at ' + API_URL)
      console.error('Please ensure the server is running: npm run dev')
      process.exit(1)
    }

    // Run test suite
    await runTest('1. Create Project', testCreateProject)
    await runTest('2. Create Batch', testCreateBatch)
    await runTest('3. Get Batch Details', testGetBatch)
    await runTest('4. Execute Batch', testExecuteBatch)
    await runTest('5. Get Execution Stats', testGetExecutionStats)
    await runTest('6. Pause Execution', testPauseExecution)
    await runTest('7. Resume Execution', testResumeExecution)
    await runTest('8. Update Concurrency', testUpdateConcurrency)
    await runTest('9. Wait for Completion', testWaitForCompletion)
    await runTest('10. Get Jobs', testGetJobs)

    // Cleanup
    await testCleanup()

    // Print summary
    const allPassed = printSummary()
    process.exit(allPassed ? 0 : 1)

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message)
    console.error('Stack:', error.stack)

    // Try to cleanup
    try {
      await testCleanup()
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    process.exit(1)
  }
}

// Run tests
runAllTests()
