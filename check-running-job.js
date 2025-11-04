const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function checkRunningJob() {
  try {
    const jobId = '54a1cdb6-3f03-4937-b4b7-6d6427dcd1e1'

    console.log(`🔍 Checking running job: ${jobId}\n`)

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

    console.log('Job Details:')
    console.log(`  URL: ${job[0].site_url}`)
    console.log(`  Status: ${job[0].status}`)
    console.log(`  Goal: ${job[0].goal?.substring(0, 100)}...`)
    console.log('')

    const sessions = await sql`
      SELECT id, status, streaming_url,
             LENGTH(raw_output) as log_length,
             started_at, completed_at
      FROM sessions
      WHERE job_id = ${jobId}
      ORDER BY session_number DESC
    `

    console.log(`Sessions: ${sessions.length}\n`)

    sessions.forEach((s, idx) => {
      console.log(`Session ${idx + 1}: ${s.id}`)
      console.log(`  Status: ${s.status}`)
      console.log(`  Streaming URL: ${s.streaming_url || 'NULL'}`)
      console.log(`  Log length: ${s.log_length || 0} chars`)
      console.log(`  Started: ${s.started_at}`)
      console.log(`  Completed: ${s.completed_at || 'N/A'}`)
      console.log('')
    })

    if (sessions.length > 0 && sessions[0].streaming_url) {
      console.log(`✅ STREAMING URL FOUND: ${sessions[0].streaming_url}`)
    } else {
      console.log(`❌ No streaming URL found`)
      console.log(`\nThis means either:`)
      console.log(`  1. EVA agent is not providing streaming URLs`)
      console.log(`  2. The callback is not being called`)
      console.log(`  3. The database update is failing silently`)
    }

    await sql.end()
  } catch (error) {
    console.error('Error:', error)
    await sql.end()
    process.exit(1)
  }
}

checkRunningJob()
