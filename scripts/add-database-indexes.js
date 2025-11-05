/**
 * Add Database Indexes for Performance
 * Run with: node scripts/add-database-indexes.js
 */

const { drizzle } = require('drizzle-orm/postgres-js')
const postgres = require('postgres')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres'

async function main() {
  console.log('🔧 Adding database indexes for performance...\n')

  const sql = postgres(DATABASE_URL, { max: 1 })
  const db = drizzle(sql)

  const indexes = [
    // Projects
    { name: 'idx_projects_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC)' },

    // Batches
    { name: 'idx_batches_project_id', sql: 'CREATE INDEX IF NOT EXISTS idx_batches_project_id ON batches(project_id)' },
    { name: 'idx_batches_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_batches_created_at ON batches(created_at DESC)' },
    { name: 'idx_batches_project_created', sql: 'CREATE INDEX IF NOT EXISTS idx_batches_project_created ON batches(project_id, created_at DESC)' },

    // Jobs - Foreign keys
    { name: 'idx_jobs_batch_id', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_batch_id ON jobs(batch_id)' },
    { name: 'idx_jobs_project_id', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id)' },

    // Jobs - Status filtering
    { name: 'idx_jobs_status', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)' },
    { name: 'idx_jobs_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC)' },

    // Jobs - Composite indexes
    { name: 'idx_jobs_batch_status', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_batch_status ON jobs(batch_id, status)' },
    { name: 'idx_jobs_batch_gt', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_batch_gt ON jobs(batch_id, has_ground_truth)' },
    { name: 'idx_jobs_batch_evaluated', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_batch_evaluated ON jobs(batch_id, is_evaluated, evaluation_result) WHERE is_evaluated = true' },

    // Jobs - Partial indexes
    { name: 'idx_jobs_running', sql: `CREATE INDEX IF NOT EXISTS idx_jobs_running ON jobs(batch_id, created_at DESC) WHERE status = 'running'` },
    { name: 'idx_jobs_queued', sql: `CREATE INDEX IF NOT EXISTS idx_jobs_queued ON jobs(batch_id, created_at DESC) WHERE status = 'queued'` },
    { name: 'idx_jobs_with_gt', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_with_gt ON jobs(batch_id, created_at DESC) WHERE has_ground_truth = true' },

    // Jobs - Search
    { name: 'idx_jobs_input_id', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_input_id ON jobs(input_id)' },
    { name: 'idx_jobs_site_url_gin', sql: `CREATE INDEX IF NOT EXISTS idx_jobs_site_url_gin ON jobs USING gin(to_tsvector('english', site_url))` },

    // Sessions
    { name: 'idx_sessions_job_id', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_job_id ON sessions(job_id)' },
    { name: 'idx_sessions_status', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)' },
    { name: 'idx_sessions_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC)' },
    { name: 'idx_sessions_job_created', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_job_created ON sessions(job_id, created_at DESC)' },

    // Executions
    { name: 'idx_executions_batch_id', sql: 'CREATE INDEX IF NOT EXISTS idx_executions_batch_id ON executions(batch_id)' },
    { name: 'idx_executions_project_id', sql: 'CREATE INDEX IF NOT EXISTS idx_executions_project_id ON executions(project_id)' },
    { name: 'idx_executions_status', sql: 'CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status)' },
    { name: 'idx_executions_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_executions_created_at ON executions(created_at DESC)' },
    { name: 'idx_executions_batch_status', sql: 'CREATE INDEX IF NOT EXISTS idx_executions_batch_status ON executions(batch_id, status)' },
    { name: 'idx_executions_batch_created', sql: 'CREATE INDEX IF NOT EXISTS idx_executions_batch_created ON executions(batch_id, created_at DESC)' },

    // Ground Truth
    { name: 'idx_gt_column_metrics_batch', sql: 'CREATE INDEX IF NOT EXISTS idx_gt_column_metrics_batch ON ground_truth_column_metrics(batch_id)' },
    { name: 'idx_gt_column_metrics_batch_column', sql: 'CREATE INDEX IF NOT EXISTS idx_gt_column_metrics_batch_column ON ground_truth_column_metrics(batch_id, column_name)' },
    { name: 'idx_gt_metrics_history_batch_time', sql: 'CREATE INDEX IF NOT EXISTS idx_gt_metrics_history_batch_time ON ground_truth_metrics_history(batch_id, created_at DESC)' },
    { name: 'idx_gt_metrics_history_execution', sql: 'CREATE INDEX IF NOT EXISTS idx_gt_metrics_history_execution ON ground_truth_metrics_history(execution_id) WHERE execution_id IS NOT NULL' },

    // Instruction Versions
    { name: 'idx_instruction_versions_project', sql: 'CREATE INDEX IF NOT EXISTS idx_instruction_versions_project ON instruction_versions(project_id)' },
    { name: 'idx_instruction_versions_project_version', sql: 'CREATE INDEX IF NOT EXISTS idx_instruction_versions_project_version ON instruction_versions(project_id, version_number DESC)' },
  ]

  let successCount = 0
  let errorCount = 0

  for (const index of indexes) {
    try {
      await sql.unsafe(index.sql)
      console.log(`✅ ${index.name}`)
      successCount++
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⏭️  ${index.name} (already exists)`)
        successCount++
      } else {
        console.error(`❌ ${index.name}: ${error.message}`)
        errorCount++
      }
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)

  // Update table statistics
  console.log('\n📈 Updating table statistics...')
  try {
    await sql.unsafe('ANALYZE projects')
    await sql.unsafe('ANALYZE batches')
    await sql.unsafe('ANALYZE jobs')
    await sql.unsafe('ANALYZE sessions')
    await sql.unsafe('ANALYZE executions')
    await sql.unsafe('ANALYZE ground_truth_column_metrics')
    await sql.unsafe('ANALYZE ground_truth_metrics_history')
    await sql.unsafe('ANALYZE instruction_versions')
    console.log('✅ Table statistics updated')
  } catch (error) {
    console.error('❌ Failed to update statistics:', error.message)
  }

  await sql.end()
  console.log('\n✨ Done!')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
