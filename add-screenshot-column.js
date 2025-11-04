const postgres = require('postgres')

const sql = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres')

async function addScreenshotColumn() {
  try {
    console.log('🔍 Checking if screenshot_url column exists...\n')

    // Check if column already exists
    const columnExists = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      AND column_name = 'screenshot_url'
    `

    if (columnExists.length > 0) {
      console.log('✅ screenshot_url column already exists')
      await sql.end()
      return
    }

    console.log('📝 Adding screenshot_url column to sessions table...\n')

    // Add the column
    await sql`
      ALTER TABLE sessions
      ADD COLUMN screenshot_url TEXT
    `

    console.log('✅ Successfully added screenshot_url column')

    // Verify it was added
    const verify = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      AND column_name IN ('streaming_url', 'screenshot_url')
    `

    console.log('\n📋 Session URL columns:')
    verify.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    await sql.end()
  } catch (error) {
    console.error('Error:', error)
    await sql.end()
    process.exit(1)
  }
}

addScreenshotColumn()
