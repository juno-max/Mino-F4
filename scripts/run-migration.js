const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres'
  })

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected')

    console.log('📄 Reading migration file...')
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add-granular-status.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('🔧 Running migration...')
    await client.query(sql)
    console.log('✅ Migration complete!')

    console.log('🔍 Verifying columns...')
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'jobs'
      AND column_name IN ('detailed_status', 'blocked_reason', 'fields_extracted', 'fields_missing', 'completion_percentage', 'failure_category')
      ORDER BY column_name
    `)

    console.log('✅ Columns added to jobs table:')
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`)
    })

    const result2 = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      AND column_name IN ('detailed_status', 'blocked_reason', 'fields_extracted', 'fields_missing', 'completion_percentage')
      ORDER BY column_name
    `)

    console.log('✅ Columns added to sessions table:')
    result2.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    throw error
  } finally {
    await client.end()
  }
}

runMigration()
  .then(() => {
    console.log('🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error:', error)
    process.exit(1)
  })
