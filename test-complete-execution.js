const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function testCompleteExecution() {
  try {
    console.log('🚀 Starting Complete Execution Test\n')

    // Find a project with batches
    const projects = await sql`
      SELECT id, name
      FROM projects
      LIMIT 5
    `

    if (projects.length === 0) {
      console.log('❌ No projects found')
      await sql.end()
      return
    }

    console.log(`Found ${projects.length} projects:`)
    projects.forEach(p => console.log(`  - ${p.name} (${p.id})`))

    const projectId = projects[0].id
    console.log(`\nUsing project: ${projectId}\n`)

    // Find a batch for this project
    const batches = await sql`
      SELECT id, name, (
        SELECT COUNT(*) FROM jobs WHERE batch_id = batches.id
      ) as job_count
      FROM batches
      WHERE project_id = ${projectId}
      LIMIT 5
    `

    if (batches.length === 0) {
      console.log('❌ No batches found for this project')
      await sql.end()
      return
    }

    console.log(`Found ${batches.length} batches:`)
    batches.forEach(b => console.log(`  - ${b.name}: ${b.job_count} jobs`))

    const batch = batches[0]
    console.log(`\nUsing batch: ${batch.id}\n`)

    // Get jobs for this batch
    const jobs = await sql`
      SELECT id, site_url, status,
             (SELECT COUNT(*) FROM sessions WHERE job_id = jobs.id) as session_count
      FROM jobs
      WHERE batch_id = ${batch.id}
      LIMIT 5
    `

    if (jobs.length === 0) {
      console.log('❌ No jobs found for this batch')
      await sql.end()
      return
    }

    console.log(`Found ${jobs.length} jobs:`)
    jobs.forEach(j => console.log(`  - Job ${j.id}: ${j.status}, ${j.session_count} sessions`))
    console.log('')

    // Test API call to execute batch
    console.log('📡 Testing batch execution API...\n')

    const executeUrl = `http://localhost:3000/api/projects/${projectId}/batches/${batch.id}/execute`
    console.log(`POST ${executeUrl}`)

    const response = await fetch(executeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        executionType: 'test',
        sampleSize: 1,  // Just run 1 job
        useAgentQL: true,  // Use EVA agent
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.log('❌ API Error:', result.message)
      await sql.end()
      return
    }

    console.log('✅ Execution started successfully!')
    console.log(`Execution ID: ${result.execution?.id}`)
    console.log(`Jobs created/reused: ${result.jobs?.length || 0}`)
    console.log('')

    if (result.message && result.message.includes('already exist')) {
      console.log('ℹ️  Jobs already exist, monitoring existing jobs...\n')
    }

    // Monitor the job for streaming URL
    const monitorJobId = jobs[0].id
    console.log(`🔍 Monitoring job ${monitorJobId} for 30 seconds...\n`)

    let foundStreamingUrl = false
    const startTime = Date.now()
    const maxWaitTime = 30000 // 30 seconds

    while (Date.now() - startTime < maxWaitTime && !foundStreamingUrl) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

      const sessions = await sql`
        SELECT id, status, streaming_url, LEFT(raw_output, 150) as logs
        FROM sessions
        WHERE job_id = ${monitorJobId}
        ORDER BY created_at DESC
        LIMIT 1
      `

      if (sessions.length > 0) {
        const session = sessions[0]
        const elapsed = Math.round((Date.now() - startTime) / 1000)

        console.log(`[${elapsed}s] Session ${session.id.substring(0, 8)}... : ${session.status}`)

        if (session.streaming_url) {
          console.log(`\n🎉 STREAMING URL FOUND!`)
          console.log(`URL: ${session.streaming_url}`)
          foundStreamingUrl = true
          break
        }

        if (session.logs) {
          console.log(`  Logs: ${session.logs}...`)
        }

        if (session.status === 'completed' || session.status === 'failed') {
          console.log(`\n⚠️  Session completed without streaming URL`)
          console.log(`  Status: ${session.status}`)
          break
        }
      } else {
        console.log(`[${Math.round((Date.now() - startTime) / 1000)}s] No sessions yet...`)
      }
    }

    if (!foundStreamingUrl) {
      console.log('\n❌ No streaming URL found after monitoring')
      console.log('This suggests the EVA agent is not providing streaming URLs')
      console.log('or the callback is not being triggered properly.')
    }

    await sql.end()
  } catch (error) {
    console.error('❌ Error:', error)
    await sql.end()
    process.exit(1)
  }
}

testCompleteExecution()
