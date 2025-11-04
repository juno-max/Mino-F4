const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function testStreamingUrls() {
  try {
    console.log('🔍 Checking sessions for streaming URLs...\n')

    // Check for any sessions with streaming URLs
    const sessionsWithStreaming = await sql`
      SELECT id, job_id, status, streaming_url,
             LEFT(raw_output, 100) as logs_preview,
             created_at
      FROM sessions
      WHERE streaming_url IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `

    console.log('Sessions with streaming URLs:', sessionsWithStreaming.length)
    if (sessionsWithStreaming.length > 0) {
      console.log('✅ Found sessions with streaming URLs:')
      sessionsWithStreaming.forEach(s => {
        console.log(`  - Session ${s.id}`)
        console.log(`    Status: ${s.status}`)
        console.log(`    Streaming URL: ${s.streaming_url}`)
        console.log(`    Created: ${s.created_at}`)
        console.log('')
      })
    } else {
      console.log('❌ No sessions with streaming URLs found\n')
    }

    // Check for running sessions
    const runningSessions = await sql`
      SELECT id, job_id, status, streaming_url
      FROM sessions
      WHERE status = 'running'
      ORDER BY created_at DESC
      LIMIT 5
    `

    console.log('\nRunning sessions:', runningSessions.length)
    if (runningSessions.length > 0) {
      console.log('Sessions currently running:')
      runningSessions.forEach(s => {
        console.log(`  - Session ${s.id}: streaming_url = ${s.streaming_url || 'NULL'}`)
      })
    } else {
      console.log('No currently running sessions')
    }

    // Check recent sessions (last 10)
    const recentSessions = await sql`
      SELECT id, job_id, status, streaming_url IS NOT NULL as has_url,
             LENGTH(raw_output) as log_length
      FROM sessions
      ORDER BY created_at DESC
      LIMIT 10
    `

    console.log('\n📊 Recent sessions summary:')
    recentSessions.forEach(s => {
      console.log(`  - Session ${s.id}: ${s.status}, streaming_url=${s.has_url}, logs=${s.log_length} chars`)
    })

    await sql.end()
  } catch (error) {
    console.error('❌ Error:', error)
    await sql.end()
    process.exit(1)
  }
}

testStreamingUrls()
