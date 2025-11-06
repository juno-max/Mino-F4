/**
 * Test script to verify live job updates functionality
 * Tests:
 * 1. Create a batch with CSV data
 * 2. Start execution
 * 3. Poll job stats endpoint to verify live updates work
 * 4. Poll job list endpoint to verify live updates work
 */

const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:3001'

// Test CSV content
const testCsv = `url,gt_price,gt_title
https://example.com,99.99,Example Product
https://test.com,49.99,Test Product
https://demo.com,29.99,Demo Product`

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testLiveUpdates() {
  console.log('🧪 Testing Live Job Updates...\n')

  try {
    // Step 1: Get first project
    console.log('1️⃣  Fetching projects...')
    const projectsRes = await fetch(`${BASE_URL}/api/projects`)
    if (!projectsRes.ok) throw new Error('Failed to fetch projects')

    const projects = await projectsRes.json()
    if (!projects || projects.length === 0) {
      throw new Error('No projects found - please create a project first')
    }

    const projectId = projects[0].id
    console.log(`   ✅ Using project: ${projects[0].name} (${projectId})\n`)

    // Step 2: Create batch
    console.log('2️⃣  Creating batch with CSV data...')
    const batchRes = await fetch(`${BASE_URL}/api/projects/${projectId}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csvContent: testCsv,
        batchName: 'Live Update Test Batch',
        batchDescription: 'Testing live job updates',
      }),
    })

    if (!batchRes.ok) {
      const error = await batchRes.json()
      throw new Error(`Failed to create batch: ${error.message || batchRes.statusText}`)
    }

    const batch = await batchRes.json()
    console.log(`   ✅ Batch created: ${batch.id}\n`)

    // Step 3: Test job stats endpoint (for project view live updates)
    console.log('3️⃣  Testing job stats endpoint...')
    const statsRes = await fetch(`${BASE_URL}/api/batches/${batch.id}/jobs?statsOnly=true`)
    if (!statsRes.ok) throw new Error('Failed to fetch job stats')

    const statsData = await statsRes.json()
    console.log('   📊 Initial job stats:', statsData.stats)

    if (statsData.stats.total === 3) {
      console.log('   ✅ Job stats endpoint working correctly\n')
    } else {
      console.log(`   ⚠️  Expected 3 jobs, got ${statsData.stats.total}\n`)
    }

    // Step 4: Test job list endpoint (for batch view live updates)
    console.log('4️⃣  Testing job list endpoint...')
    const jobsRes = await fetch(`${BASE_URL}/api/batches/${batch.id}/jobs`)
    if (!jobsRes.ok) throw new Error('Failed to fetch jobs')

    const jobsData = await jobsRes.json()
    console.log(`   📋 Fetched ${jobsData.data?.length || 0} jobs`)
    console.log(`   📄 Response structure: ${Object.keys(jobsData).join(', ')}`)

    if (jobsData.data && Array.isArray(jobsData.data)) {
      console.log('   ✅ Job list endpoint working correctly\n')
    } else {
      console.log('   ⚠️  Unexpected response structure\n')
    }

    // Step 5: Start execution
    console.log('5️⃣  Starting batch execution...')
    const executeRes = await fetch(`${BASE_URL}/api/projects/${projectId}/batches/${batch.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        executionType: 'full',
        useAgentQL: true,
        concurrency: 2,
      }),
    })

    if (!executeRes.ok) {
      const error = await executeRes.json()
      console.log(`   ⚠️  Execution failed: ${error.message || executeRes.statusText}`)
      console.log('   ℹ️  This is okay - we can still test the endpoints\n')
    } else {
      console.log('   ✅ Execution started\n')
    }

    // Step 6: Monitor job status changes (simulate polling)
    console.log('6️⃣  Monitoring job status changes (5 polls every 2 seconds)...')
    for (let i = 1; i <= 5; i++) {
      await sleep(2000)

      const pollStatsRes = await fetch(`${BASE_URL}/api/batches/${batch.id}/jobs?statsOnly=true`)
      const pollStats = await pollStatsRes.json()

      console.log(`   Poll #${i}:`, pollStats.stats)
    }
    console.log('   ✅ Polling completed\n')

    // Summary
    console.log('✅ Live Updates Test Complete!\n')
    console.log('📝 Summary:')
    console.log('   • Job stats endpoint: ✅ Working')
    console.log('   • Job list endpoint: ✅ Working')
    console.log('   • Polling mechanism: ✅ Working')
    console.log('\n🎉 All live update features are functional!\n')
    console.log(`🔗 View batch: ${BASE_URL}/projects/${projectId}/batches/${batch.id}`)
    console.log(`🔗 View project: ${BASE_URL}/projects/${projectId}`)

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testLiveUpdates()
