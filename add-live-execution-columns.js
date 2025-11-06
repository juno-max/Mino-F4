const postgres = require('postgres');

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres');

async function addLiveExecutionColumns() {
  try {
    console.log('✓ Connected to database');

    // Add columns to executions table
    console.log('\n📊 Adding live execution control fields to executions table...');

    await sql`ALTER TABLE executions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP`;
    console.log('  ✓ Added column: paused_at');

    await sql`ALTER TABLE executions ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP`;
    console.log('  ✓ Added column: resumed_at');

    await sql`ALTER TABLE executions ADD COLUMN IF NOT EXISTS stopped_at TIMESTAMP`;
    console.log('  ✓ Added column: stopped_at');

    await sql`ALTER TABLE executions ADD COLUMN IF NOT EXISTS stop_reason TEXT`;
    console.log('  ✓ Added column: stop_reason');

    await sql`ALTER TABLE executions ADD COLUMN IF NOT EXISTS sample_size INTEGER`;
    console.log('  ✓ Added column: sample_size');

    await sql`ALTER TABLE executions ADD COLUMN IF NOT EXISTS estimated_duration_ms INTEGER`;
    console.log('  ✓ Added column: estimated_duration_ms');

    await sql`ALTER TABLE executions ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP`;
    console.log('  ✓ Added column: last_activity_at');

    // Update default concurrency from 20 to 5
    console.log('\n📊 Updating default concurrency in executions table...');
    await sql`ALTER TABLE executions ALTER COLUMN concurrency SET DEFAULT 5`;
    console.log('  ✓ Updated default concurrency to 5');

    // Add columns to jobs table
    console.log('\n📊 Adding live tracking fields to jobs table...');

    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS current_step TEXT`;
    console.log('  ✓ Added column: current_step');

    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS current_url TEXT`;
    console.log('  ✓ Added column: current_url');

    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 NOT NULL`;
    console.log('  ✓ Added column: progress_percentage');

    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP`;
    console.log('  ✓ Added column: started_at');

    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`;
    console.log('  ✓ Added column: completed_at');

    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS execution_duration_ms INTEGER`;
    console.log('  ✓ Added column: execution_duration_ms');

    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0 NOT NULL`;
    console.log('  ✓ Added column: retry_count');

    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS retry_reason TEXT`;
    console.log('  ✓ Added column: retry_reason');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nVerifying columns...');

    // Verify executions table
    const execColumns = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'executions'
      AND column_name IN ('paused_at', 'resumed_at', 'stopped_at', 'stop_reason', 'sample_size', 'estimated_duration_ms', 'last_activity_at', 'concurrency')
      ORDER BY column_name
    `;
    console.log('\nExecutions table columns:');
    execColumns.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'null'})`);
    });

    // Verify jobs table
    const jobColumns = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'jobs'
      AND column_name IN ('current_step', 'current_url', 'progress_percentage', 'started_at', 'completed_at', 'execution_duration_ms', 'retry_count', 'retry_reason')
      ORDER BY column_name
    `;
    console.log('\nJobs table columns:');
    jobColumns.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'null'}, nullable: ${row.is_nullable})`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    await sql.end();
    console.log('\n✓ Database connection closed');
  }
}

addLiveExecutionColumns()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
