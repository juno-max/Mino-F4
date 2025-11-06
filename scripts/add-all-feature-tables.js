const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting migration: Adding all feature tables...\n');

    // 1. Ground Truth Metrics History
    console.log('1. Creating ground_truth_metrics_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ground_truth_metrics_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,

        overall_accuracy REAL NOT NULL,
        total_jobs INTEGER NOT NULL,
        jobs_evaluated INTEGER NOT NULL,
        exact_matches INTEGER NOT NULL,
        partial_matches INTEGER NOT NULL,

        column_metrics JSONB,
        instruction_version_id UUID REFERENCES instruction_versions(id),
        notes TEXT,

        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('   ✓ Created ground_truth_metrics_history\n');

    // 2. Create indexes for metrics history
    console.log('2. Creating indexes for metrics history...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gt_metrics_history_batch_time
      ON ground_truth_metrics_history(batch_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_gt_metrics_history_execution
      ON ground_truth_metrics_history(execution_id);
    `);
    console.log('   ✓ Created indexes\n');

    // 3. Exports table
    console.log('3. Creating exports table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS exports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        execution_id UUID REFERENCES executions(id),

        export_type TEXT NOT NULL,
        format TEXT NOT NULL,

        config JSONB,
        file_url TEXT,
        file_size INTEGER,
        row_count INTEGER,

        status TEXT NOT NULL,
        error_message TEXT,

        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);
    console.log('   ✓ Created exports table\n');

    // 4. Filter presets table
    console.log('4. Creating filter_presets table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS filter_presets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        filters JSONB NOT NULL,
        is_default BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('   ✓ Created filter_presets table\n');

    // 5. Add instruction_version_id to executions if not exists
    console.log('5. Adding instruction_version_id to executions...');
    await client.query(`
      ALTER TABLE executions
      ADD COLUMN IF NOT EXISTS instruction_version_id UUID REFERENCES instruction_versions(id);
    `);
    console.log('   ✓ Added instruction_version_id\n');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
