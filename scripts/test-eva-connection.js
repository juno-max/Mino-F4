/**
 * EVA Connection Diagnostic Script
 * Tests EVA API connectivity and configuration
 */

require('dotenv').config({ path: '.env.local' })

const EVA_API_URL = process.env.EVA_AGENT_API_URL
const EVA_USER_ID = process.env.EVA_USER_ID || 'test-user'

console.log('\n🔍 EVA Connection Diagnostics\n')
console.log('━'.repeat(60))
console.log('Configuration:')
console.log('━'.repeat(60))
console.log(`EVA_AGENT_API_URL: ${EVA_API_URL || '❌ NOT SET'}`)
console.log(`EVA_USER_ID: ${EVA_USER_ID}`)
console.log('━'.repeat(60))

async function testConnection() {
  if (!EVA_API_URL) {
    console.error('\n❌ ERROR: EVA_AGENT_API_URL is not configured')
    console.log('\nPlease set EVA_AGENT_API_URL in your .env.local file')
    console.log('Example: EVA_AGENT_API_URL=https://eva.sandbox.tinyfish.io')
    process.exit(1)
  }

  console.log('\n📡 Testing EVA API connectivity...\n')

  try {
    // Test 1: Basic connectivity
    console.log('Test 1: Basic HTTP connectivity')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`${EVA_API_URL}/health`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    }).catch(err => {
      clearTimeout(timeout)
      if (err.name === 'AbortError') {
        throw new Error('Connection timeout after 10 seconds')
      }
      throw err
    })

    clearTimeout(timeout)

    console.log(`   Status: ${response.status}`)
    console.log(`   ✅ Connection successful\n`)

    // Test 2: Create a simple EVA session
    console.log('Test 2: Creating EVA session')
    const sessionResponse = await fetch(`${EVA_API_URL}/api/eva/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: EVA_USER_ID,
        agentName: 'eva_agent',
      })
    })

    const sessionData = await sessionResponse.json()
    console.log(`   Status: ${sessionResponse.status}`)
    console.log(`   Session ID: ${sessionData.sessionId || 'N/A'}`)

    if (sessionResponse.ok) {
      console.log(`   ✅ Session creation successful\n`)
    } else {
      console.log(`   ⚠️  Session creation failed: ${JSON.stringify(sessionData)}\n`)
    }

    // Test 3: Check if we can execute a simple run
    console.log('Test 3: Testing simple execution')
    const runId = `test_run_${Date.now()}`
    const executeResponse = await fetch(`${EVA_API_URL}/api/eva/execute-run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        runId,
        userId: EVA_USER_ID,
        taskInstruction: 'Visit https://example.com and extract the page title',
        goal: 'Test goal'
      })
    })

    console.log(`   Status: ${executeResponse.status}`)

    if (executeResponse.ok) {
      console.log(`   ✅ Execution endpoint accessible\n`)
    } else {
      const errorData = await executeResponse.text()
      console.log(`   ⚠️  Execution failed: ${errorData}\n`)
    }

  } catch (error) {
    console.error(`\n❌ Connection test failed:`)
    console.error(`   Error: ${error.message}`)

    if (error.cause) {
      console.error(`   Cause: ${error.cause.message || error.cause}`)
    }

    console.log('\n💡 Troubleshooting:')
    console.log('   1. Check if EVA API URL is correct')
    console.log('   2. Verify network connectivity')
    console.log('   3. Check if EVA service is running')
    console.log('   4. Verify firewall/proxy settings')
    console.log('   5. Try accessing the URL in a browser')

    process.exit(1)
  }

  console.log('━'.repeat(60))
  console.log('✅ All tests passed!')
  console.log('━'.repeat(60))
}

testConnection()
