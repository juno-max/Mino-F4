const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function resetStuckJobs() {
  try {
    console.log('🔍 Finding stuck running jobs...\n')

    // Find all running jobs
    const runningJobs = await sql`
      SELECT id, site_url, status, created_at, last_run_at
      FROM jobs
      WHERE status = 'running'
      ORDER BY created_at DESC
    `

    console.log(`Found ${runningJobs.length} running jobs\n`)

    if (runningJobs.length === 0) {
      console.log('✅ No stuck jobs to reset')
      await sql.end()
      return
    }

    // Show jobs that will be reset
    runningJobs.forEach((job, idx) => {
      console.log(`${idx + 1}. Job ${job.id}`)
      console.log(`   URL: ${job.site_url}`)
      console.log(`   Created: ${job.created_at}`)
      console.log(`   Last run: ${job.last_run_at || 'Never'}`)
      console.log('')
    })

    // Reset all running jobs to queued
    console.log('🔄 Resetting all running jobs to queued...\n')

    const result = await sql`
      UPDATE jobs
      SET status = 'queued', last_run_at = NULL
      WHERE status = 'running'
    `

    console.log(`✅ Reset ${result.count} jobs to queued status`)

    // Also reset any running sessions
    console.log('\n🔍 Finding running sessions...\n')

    const runningSessions = await sql`
      SELECT id, job_id, status, started_at
      FROM sessions
      WHERE status = 'running'
    `

    console.log(`Found ${runningSessions.length} running sessions\n`)

    if (runningSessions.length > 0) {
      console.log('🔄 Resetting running sessions to failed...\n')

      const sessionResult = await sql`
        UPDATE sessions
        SET status = 'failed',
            error_message = 'Job was stuck in running state and has been reset',
            failure_reason = 'Reset due to stuck state',
            completed_at = NOW()
        WHERE status = 'running'
      `

      console.log(`✅ Reset ${sessionResult.count} sessions to failed status`)
    }

    // Also reset any running executions
    console.log('\n🔍 Finding running executions...\n')

    const runningExecutions = await sql`
      SELECT id, batch_id, status, started_at
      FROM executions
      WHERE status = 'running'
    `

    console.log(`Found ${runningExecutions.length} running executions\n`)

    if (runningExecutions.length > 0) {
      console.log('🔄 Resetting running executions to failed...\n')

      const executionResult = await sql`
        UPDATE executions
        SET status = 'failed',
            completed_at = NOW()
        WHERE status = 'running'
      `

      console.log(`✅ Reset ${executionResult.count} executions to failed status`)
    }

    console.log('\n✅ All stuck jobs have been reset!')
    console.log('\nYou can now re-execute the batch from the dashboard.')

    await sql.end()
  } catch (error) {
    console.error('Error:', error)
    await sql.end()
    process.exit(1)
  }
}

resetStuckJobs()
