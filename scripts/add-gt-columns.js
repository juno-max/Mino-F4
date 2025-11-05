const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting migration: Adding ground truth columns...\n');

    // 1. Add columns to batches table
    console.log('1. Adding columns to batches table...');
    await client.query(`
      ALTER TABLE batches
      ADD COLUMN IF NOT EXISTS last_gt_metrics_calculation TIMESTAMP,
      ADD COLUMN IF NOT EXISTS overall_accuracy REAL;
    `);
    console.log('   ✓ Added last_gt_metrics_calculation and overall_accuracy to batches\n');

    // 2. Add column to jobs table
    console.log('2. Adding ground_truth_metadata column to jobs table...');
    await client.query(`
      ALTER TABLE jobs
      ADD COLUMN IF NOT EXISTS ground_truth_metadata JSONB;
    `);
    console.log('   ✓ Added ground_truth_metadata to jobs\n');

    // 3. Create ground_truth_column_metrics table
    console.log('3. Creating ground_truth_column_metrics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ground_truth_column_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        column_name TEXT NOT NULL,

        -- Accuracy metrics
        total_jobs INTEGER NOT NULL,
        jobs_with_ground_truth INTEGER NOT NULL,
        exact_matches INTEGER NOT NULL,
        partial_matches INTEGER NOT NULL,
        mismatches INTEGER NOT NULL,
        missing_extractions INTEGER NOT NULL,

        -- Aggregated statistics
        accuracy_percentage REAL,
        avg_confidence_score REAL,

        -- Failure patterns
        common_errors JSONB,

        -- Timestamps
        calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('   ✓ Created ground_truth_column_metrics table\n');

    // 4. Create indexes
    console.log('4. Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gt_column_metrics_batch
      ON ground_truth_column_metrics(batch_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gt_column_metrics_batch_column
      ON ground_truth_column_metrics(batch_id, column_name);
    `);
    console.log('   ✓ Created indexes\n');

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
