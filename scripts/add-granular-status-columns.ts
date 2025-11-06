/**
 * Migration: Add granular status tracking columns
 * Adds detailed status fields to jobs and sessions tables for better UX
 */

import { db } from '../db'
import { sql } from 'drizzle-orm'

async function addGranularStatusColumns() {
  console.log('🔧 Adding granular status columns to jobs table...')

  try {
    // Add columns to jobs table
    await db.execute(sql`
      ALTER TABLE jobs
      ADD COLUMN IF NOT EXISTS detailed_status TEXT,
      ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
      ADD COLUMN IF NOT EXISTS fields_extracted TEXT[],
      ADD COLUMN IF NOT EXISTS fields_missing TEXT[],
      ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS failure_category TEXT;
    `)
    console.log('✅ Jobs table columns added')

    // Add columns to sessions table
    await db.execute(sql`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS detailed_status TEXT,
      ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
      ADD COLUMN IF NOT EXISTS fields_extracted TEXT[],
      ADD COLUMN IF NOT EXISTS fields_missing TEXT[],
      ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;
    `)
    console.log('✅ Sessions table columns added')

    console.log('✅ Migration complete!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run migration
addGranularStatusColumns()
  .then(() => {
    console.log('✅ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
