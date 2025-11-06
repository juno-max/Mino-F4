/**
 * Migration: Add execution_events table for WebSocket event persistence
 *
 * Run with: npx tsx scripts/add-execution-events-table.ts
 */

import { db } from '../db'
import { sql } from 'drizzle-orm'

async function migrate() {
  console.log('🚀 Starting migration: Add execution_events table...')

  try {
    // Create execution_events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS execution_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        data JSONB NOT NULL,
        execution_id TEXT,
        batch_id TEXT,
        job_id TEXT,
        organization_id UUID,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    console.log('✅ Created execution_events table')

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_type ON execution_events(type)`)
    console.log('✅ Created index: idx_events_type')

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON execution_events(timestamp)`)
    console.log('✅ Created index: idx_events_timestamp')

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_execution ON execution_events(execution_id)`)
    console.log('✅ Created index: idx_events_execution')

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_batch ON execution_events(batch_id)`)
    console.log('✅ Created index: idx_events_batch')

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_job ON execution_events(job_id)`)
    console.log('✅ Created index: idx_events_job')

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_org ON execution_events(organization_id)`)
    console.log('✅ Created index: idx_events_org')

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_expires ON execution_events(expires_at)`)
    console.log('✅ Created index: idx_events_expires')

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_execution_timestamp ON execution_events(execution_id, timestamp)`)
    console.log('✅ Created index: idx_events_execution_timestamp')

    console.log('\n🎉 Migration completed successfully!')
    console.log('\n📊 Table stats:')

    // Get table stats
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM execution_events
    `)
    console.log(`   Events in table: ${result.rows[0]?.count || 0}`)

    console.log('\n✅ All done! WebSocket event persistence is now active.')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

migrate()
