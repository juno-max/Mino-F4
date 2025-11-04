const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function checkColumn() {
  try {
    console.log('Checking sessions table schema...')
    const result = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      ORDER BY ordinal_position
    `
    console.log('\nSessions table columns:')
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    const hasStreamingUrl = result.some(col => col.column_name === 'streaming_url')
    console.log('\n✓ streaming_url column exists:', hasStreamingUrl)

    await sql.end()
  } catch (error) {
    console.error('Error:', error)
    await sql.end()
    process.exit(1)
  }
}

checkColumn()
