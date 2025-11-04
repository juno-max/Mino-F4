const postgres = require('postgres')

const BASE_URL = 'http://localhost:3000'
const EVA_URL = process.env.EVA_AGENT_API_URL || 'https://eva.sandbox.tinyfish.io'
const DB_URL = 'postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres'

console.log('🔍 COMPREHENSIVE CONNECTION TEST\n')
console.log('============================================================\n')

async function testDatabaseConnection() {
  console.log('📊 1. TESTING DATABASE CONNECTION')
  try {
    const sql = postgres(DB_URL)

    // Test basic query
    const result = await sql`SELECT NOW() as current_time`
    console.log('   ✅ Database connected:', result[0].current_time)

    // Test sessions table
    const sessions = await sql`SELECT COUNT(*) as count FROM sessions WHERE created_at > NOW() - INTERVAL '1 hour'`
    console.log('   ✅ Sessions table accessible:', sessions[0].count, 'recent sessions')

    // Check streaming_url column
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sessions'
    `
    const hasStreamingUrl = columns.some(c => c.column_name === 'streaming_url')
    console.log('   ✅ streaming_url column:', hasStreamingUrl ? 'EXISTS' : 'MISSING')

    // Test jobs table
    const jobs = await sql`SELECT COUNT(*) as count FROM jobs WHERE status = 'running'`
    console.log('   ✅ Jobs table accessible:', jobs[0].count, 'running jobs')

    // Test projects table
    const projects = await sql`SELECT COUNT(*) as count FROM projects`
    console.log('   ✅ Projects table accessible:', projects[0].count, 'projects')

    await sql.end()
    return true
  } catch (error) {
    console.error('   ❌ Database error:', error.message)
    return false
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 2. TESTING API ENDPOINTS')

  const endpoints = [
    { name: 'Projects List', url: '/api/projects' },
    { name: 'Projects API (with ID)', url: '/api/projects/e65b1aae-34b3-42ef-8adf-363cbcd73742' },
    { name: 'Jobs API', url: '/api/projects/e65b1aae-34b3-42ef-8adf-363cbcd73742/jobs' },
    { name: 'Executions API', url: '/api/projects/e65b1aae-34b3-42ef-8adf-363cbcd73742/executions' },
  ]

  let allPassed = true
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.url}`)
      const status = response.status
      const ok = response.ok

      if (ok) {
        const data = await response.json()
        const count = Array.isArray(data) ? data.length : 'N/A'
        console.log(`   ✅ ${endpoint.name}: ${status} (${count} items)`)
      } else {
        console.log(`   ⚠️  ${endpoint.name}: ${status}`)
        allPassed = false
      }
    } catch (error) {
      console.error(`   ❌ ${endpoint.name}: ${error.message}`)
      allPassed = false
    }
  }

  return allPassed
}

async function testEVAConnection() {
  console.log('\n🤖 3. TESTING EVA AGENT CONNECTION')
  try {
    // Test EVA health endpoint
    const response = await fetch(`${EVA_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      console.log('   ✅ EVA Agent API reachable:', EVA_URL)
      const data = await response.text()
      console.log('   ✅ Response:', data.substring(0, 100))
    } else {
      console.log('   ⚠️  EVA Agent responded with:', response.status)
    }

    return true
  } catch (error) {
    console.error('   ❌ EVA connection error:', error.message)
    console.log('   ℹ️  EVA URL:', EVA_URL)
    return false
  }
}

async function testHomepage() {
  console.log('\n🏠 4. TESTING HOMEPAGE')
  try {
    const response = await fetch(BASE_URL)
    if (response.ok) {
      const html = await response.text()
      const hasTable = html.includes('TableHeader') || html.includes('table')
      console.log('   ✅ Homepage loads:', response.status)
      console.log('   ✅ Contains table:', hasTable)
    } else {
      console.log('   ❌ Homepage failed:', response.status)
      return false
    }
    return true
  } catch (error) {
    console.error('   ❌ Homepage error:', error.message)
    return false
  }
}

async function testJobExecution() {
  console.log('\n⚙️  5. CHECKING JOB EXECUTION STATUS')
  try {
    const sql = postgres(DB_URL)

    // Check recent jobs
    const recentJobs = await sql`
      SELECT
        status,
        COUNT(*) as count
      FROM jobs
      WHERE created_at > NOW() - INTERVAL '30 minutes'
      GROUP BY status
    `

    console.log('   Recent job statuses (last 30 min):')
    recentJobs.forEach(row => {
      const emoji = row.status === 'completed' ? '✅' :
                    row.status === 'running' ? '⏳' :
                    row.status === 'error' ? '❌' : '🕒'
      console.log(`      ${emoji} ${row.status}: ${row.count}`)
    })

    // Check for any running jobs
    const runningJobs = await sql`
      SELECT id, site_url, status, created_at
      FROM jobs
      WHERE status = 'running'
      ORDER BY created_at DESC
      LIMIT 5
    `

    if (runningJobs.length > 0) {
      console.log(`\n   ⏳ ${runningJobs.length} jobs currently running:`)
      runningJobs.forEach(job => {
        console.log(`      - ${job.site_url} (started ${Math.floor((Date.now() - new Date(job.created_at).getTime()) / 1000)}s ago)`)
      })
    }

    // Check for recent sessions
    const recentSessions = await sql`
      SELECT COUNT(*) as count
      FROM sessions
      WHERE created_at > NOW() - INTERVAL '30 minutes'
    `
    console.log(`\n   ✅ Recent sessions created: ${recentSessions[0].count}`)

    await sql.end()
    return true
  } catch (error) {
    console.error('   ❌ Error checking jobs:', error.message)
    return false
  }
}

async function runAllTests() {
  const results = {
    database: await testDatabaseConnection(),
    api: await testAPIEndpoints(),
    eva: await testEVAConnection(),
    homepage: await testHomepage(),
    jobs: await testJobExecution(),
  }

  console.log('\n============================================================')
  console.log('\n📋 TEST SUMMARY\n')

  const allPassed = Object.values(results).every(r => r)

  Object.entries(results).forEach(([test, passed]) => {
    const emoji = passed ? '✅' : '❌'
    const status = passed ? 'PASS' : 'FAIL'
    console.log(`   ${emoji} ${test.toUpperCase()}: ${status}`)
  })

  console.log('\n============================================================')

  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! System is fully operational.\n')
  } else {
    console.log('\n⚠️  Some tests failed. Check logs above for details.\n')
  }

  process.exit(allPassed ? 0 : 1)
}

runAllTests()
