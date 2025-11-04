const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function testCompleteFlow() {
  try {
    console.log('🧪 COMPLETE EXECUTION FLOW TEST\n')
    console.log('=' .repeat(60))

    // Step 1: Find a batch with queued jobs
    console.log('\n📋 Step 1: Finding batch with queued jobs...\n')

    const queuedJobs = await sql`
      SELECT j.id, j.site_url, j.batch_id, j.project_id,
             b.name as batch_name,
             p.name as project_name,
             p.instructions
      FROM jobs j
      JOIN batches b ON b.id = j.batch_id
      JOIN projects p ON p.id = j.project_id
      WHERE j.status = 'queued'
      LIMIT 1
    `

    if (queuedJobs.length === 0) {
      console.log('❌ No queued jobs found')
      console.log('\nPlease create a new batch or reset stuck jobs first.')
      await sql.end()
      return
    }

    const job = queuedJobs[0]
    console.log('✅ Found queued job:')
    console.log(`   Job ID: ${job.id}`)
    console.log(`   Project: ${job.project_name}`)
    console.log(`   Batch: ${job.batch_name}`)
    console.log(`   URL: ${job.site_url}`)
    console.log(`   Instructions: ${job.instructions.substring(0, 100)}...`)

    // Step 2: Execute the batch via API
    console.log('\n📋 Step 2: Executing batch via API...\n')

    const executeResponse = await fetch(
      `http://localhost:3000/api/projects/${job.project_id}/batches/${job.batch_id}/execute`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionType: 'test',
          sampleSize: 1,
          useAgentQL: true, // Use real EVA agent
        }),
      }
    )

    if (!executeResponse.ok) {
      const error = await executeResponse.text()
      console.log('❌ Execution failed:', error)
      await sql.end()
      return
    }

    const execution = await executeResponse.json()
    console.log('✅ Execution started:')
    console.log(`   Execution ID: ${execution.execution.id}`)
    console.log(`   Total jobs: ${execution.execution.totalJobs}`)

    // Step 3: Poll for updates
    console.log('\n📋 Step 3: Monitoring execution...\n')

    let attempts = 0
    const maxAttempts = 60 // 5 minutes max
    let foundStreamingUrl = false
    let executionComplete = false

    while (attempts < maxAttempts && !executionComplete) {
      attempts++

      // Check job status
      const jobStatus = await sql`
        SELECT id, status, last_run_at
        FROM jobs
        WHERE id = ${job.id}
      `

      // Check sessions
      const sessions = await sql`
        SELECT id, status, streaming_url, screenshot_url,
               LENGTH(raw_output) as log_length,
               error_message
        FROM sessions
        WHERE job_id = ${job.id}
        ORDER BY session_number DESC
        LIMIT 1
      `

      const currentStatus = jobStatus[0]?.status || 'unknown'
      const session = sessions[0]

      console.log(`[${attempts}] Job: ${currentStatus}`, session ? `| Session: ${session.status}` : '')

      if (session) {
        if (session.streaming_url && !foundStreamingUrl) {
          console.log(`\n✅ STREAMING URL FOUND: ${session.streaming_url}`)
          console.log('   This is a SUCCESS! The callback worked!\n')
          foundStreamingUrl = true
        }

        if (session.log_length > 0) {
          console.log(`   Logs: ${session.log_length} chars`)
        }

        if (session.error_message) {
          console.log(`   Error: ${session.error_message}`)
        }

        if (session.screenshot_url) {
          console.log(`   Screenshot: ${session.screenshot_url}`)
        }
      }

      // Check if complete
      if (currentStatus === 'completed' || currentStatus === 'error') {
        executionComplete = true
        console.log(`\n✅ Execution completed with status: ${currentStatus}`)
        break
      }

      // Wait 5 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    // Step 4: Final verification
    console.log('\n📋 Step 4: Final verification...\n')

    const finalSessions = await sql`
      SELECT id, status, streaming_url, screenshot_url,
             extracted_data, raw_output,
             error_message, execution_time_ms
      FROM sessions
      WHERE job_id = ${job.id}
      ORDER BY session_number DESC
      LIMIT 1
    `

    if (finalSessions.length === 0) {
      console.log('❌ No sessions found')
      await sql.end()
      return
    }

    const finalSession = finalSessions[0]

    console.log('📊 Final Results:')
    console.log(`   Session ID: ${finalSession.id}`)
    console.log(`   Status: ${finalSession.status}`)
    console.log(`   Streaming URL: ${finalSession.streaming_url ? '✅ YES' : '❌ NO'}`)
    console.log(`   Screenshot URL: ${finalSession.screenshot_url ? '✅ YES' : '❌ NO'}`)
    console.log(`   Execution time: ${finalSession.execution_time_ms || 'N/A'}ms`)
    console.log(`   Log length: ${finalSession.raw_output?.length || 0} chars`)
    console.log(`   Extracted data: ${finalSession.extracted_data ? '✅ YES' : '❌ NO'}`)

    if (finalSession.error_message) {
      console.log(`   Error: ${finalSession.error_message}`)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎯 TEST SUMMARY\n')

    if (foundStreamingUrl) {
      console.log('✅ Streaming URL callback: WORKING')
    } else {
      console.log('❌ Streaming URL callback: NOT WORKING')
    }

    if (finalSession.status === 'completed') {
      console.log('✅ Job completion: SUCCESS')
    } else {
      console.log('❌ Job completion: FAILED')
    }

    if (finalSession.extracted_data) {
      console.log('✅ Data extraction: SUCCESS')
      console.log(`   Data: ${JSON.stringify(finalSession.extracted_data).substring(0, 100)}...`)
    } else {
      console.log('❌ Data extraction: NO DATA')
    }

    console.log('\n' + '='.repeat(60))

    await sql.end()
  } catch (error) {
    console.error('Error:', error)
    await sql.end()
    process.exit(1)
  }
}

testCompleteFlow()
