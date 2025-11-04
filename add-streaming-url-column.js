const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function addColumn() {
  try {
    console.log('Adding streaming_url column to sessions table...')
    await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS streaming_url TEXT`
    console.log('✓ Column added successfully!')
    await sql.end()
  } catch (error) {
    console.error('Error:', error)
    await sql.end()
    process.exit(1)
  }
}

addColumn()
