const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function findJobs() {
  try {
    // Find ALL jobs across projects
    const jobs = await sql`
      SELECT j.id, j.site_url, j.status, j.project_id, j.batch_id,
             p.name as project_name,
             b.name as batch_name,
             (SELECT COUNT(*) FROM sessions WHERE job_id = j.id) as session_count
      FROM jobs j
      LEFT JOIN projects p ON p.id = j.project_id
      LEFT JOIN batches b ON b.id = j.batch_id
      ORDER BY j.created_at DESC
      LIMIT 20
    `

    console.log(`Found ${jobs.length} jobs:\n`)

    jobs.forEach((j, idx) => {
      console.log(`${idx + 1}. Job ${j.id}`)
      console.log(`   Project: ${j.project_name} (${j.project_id})`)
      console.log(`   Batch: ${j.batch_name || 'N/A'} (${j.batch_id})`)
      console.log(`   URL: ${j.site_url}`)
      console.log(`   Status: ${j.status}`)
      console.log(`   Sessions: ${j.session_count}`)
      console.log('')
    })

    // Show job with most sessions
    const jobWithMostSessions = jobs.reduce((prev, current) =>
      (current.session_count > prev.session_count) ? current : prev
    , jobs[0])

    if (jobWithMostSessions) {
      console.log(`\n📊 Job with most sessions:`)
      console.log(`   Job ID: ${jobWithMostSessions.id}`)
      console.log(`   Sessions: ${jobWithMostSessions.session_count}`)
      console.log(`   Project: ${jobWithMostSessions.project_id}`)
      console.log(`   Batch: ${jobWithMostSessions.batch_id}`)
    }

    await sql.end()
  } catch (error) {
    console.error('Error:', error)
    await sql.end()
    process.exit(1)
  }
}

findJobs()
