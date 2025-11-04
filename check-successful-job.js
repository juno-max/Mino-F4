const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function checkSuccessfulJob() {
  try {
    const jobId = '66a1fa28-2219-4fb4-a72c-60e046fad160'

    console.log(`🔍 Checking successful job: ${jobId}\n`)

    const job = await sql`
      SELECT id, site_url, status, goal
      FROM jobs
      WHERE id = ${jobId}
    `

    if (job.length === 0) {
      console.log('❌ Job not found')
      await sql.end()
      return
    }

    console.log('✅ Job Details:')
    console.log(`   URL: ${job[0].site_url}`)
    console.log(`   Status: ${job[0].status}`)
    console.log('')

    const sessions = await sql`
      SELECT id, status, streaming_url, screenshot_url,
             LENGTH(raw_output) as log_length,
             extracted_data,
             started_at, completed_at,
             execution_time_ms
      FROM sessions
      WHERE job_id = ${jobId}
      ORDER BY session_number DESC
      LIMIT 1
    `

    if (sessions.length === 0) {
      console.log('❌ No sessions found')
      await sql.end()
      return
    }

    const session = sessions[0]

    console.log('📊 Session Details:')
    console.log(`   Session ID: ${session.id}`)
    console.log(`   Status: ${session.status}`)
    console.log(`   Streaming URL: ${session.streaming_url || 'NULL'}`)
    console.log(`   Screenshot URL: ${session.screenshot_url || 'NULL'}`)
    console.log(`   Log length: ${session.log_length || 0} chars`)
    console.log(`   Execution time: ${session.execution_time_ms || 'N/A'}ms`)
    console.log(`   Started: ${session.started_at}`)
    console.log(`   Completed: ${session.completed_at}`)
    console.log('')

    if (session.streaming_url) {
      console.log('✅ STREAMING URL FOUND!')
      console.log(`   URL: ${session.streaming_url}`)
      console.log('')
      console.log('🎉 SUCCESS! The streaming URL callback is working correctly!')
    } else {
      console.log('❌ No streaming URL found')
    }

    if (session.extracted_data) {
      console.log('')
      console.log('📄 Extracted Data:')
      console.log(JSON.stringify(session.extracted_data, null, 2))
    }

    await sql.end()
  } catch (error) {
    console.error('Error:', error)
    await sql.end()
    process.exit(1)
  }
}

checkSuccessfulJob()
