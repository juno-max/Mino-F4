const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function fixStuckJobs() {
  try {
    console.log('🔧 Fixing stuck jobs...\n')

    // Find jobs stuck in "running" for more than 10 minutes
    const stuckJobs = await sql`
      SELECT id, site_url, status, created_at
      FROM jobs
      WHERE status = 'running'
        AND created_at < NOW() - INTERVAL '10 minutes'
    `

    console.log(`Found ${stuckJobs.length} stuck jobs\n`)

    if (stuckJobs.length === 0) {
      console.log('✅ No stuck jobs found!')
      await sql.end()
      return
    }

    // Reset them to queued
    const result = await sql`
      UPDATE jobs
      SET status = 'queued',
          updated_at = NOW()
      WHERE status = 'running'
        AND created_at < NOW() - INTERVAL '10 minutes'
      RETURNING id, site_url
    `

    console.log(`✅ Reset ${result.length} jobs to 'queued' status:\n`)
    result.forEach(job => {
      console.log(`   - ${job.site_url}`)
    })

    await sql.end()
  } catch (error) {
    console.error('Error:', error)
    await sql.end()
    process.exit(1)
  }
}

fixStuckJobs()
