/**
 * EVA Connection Test - Using Correct API Endpoints
 */

require('dotenv').config({ path: '.env.local' })

const EVA_API_URL = process.env.EVA_AGENT_API_URL
const EVA_USER_ID = process.env.EVA_USER_ID || 'test-user'
const AGENT_NAME = 'eva_agent'

console.log('\n🔍 EVA API Test (Correct Endpoints)\n')
console.log('━'.repeat(60))
console.log('Configuration:')
console.log('━'.repeat(60))
console.log(`EVA_AGENT_API_URL: ${EVA_API_URL || '❌ NOT SET'}`)
console.log(`EVA_USER_ID: ${EVA_USER_ID}`)
console.log(`AGENT_NAME: ${AGENT_NAME}`)
console.log('━'.repeat(60))

async function testCorrectEndpoints() {
  if (!EVA_API_URL) {
    console.error('\n❌ ERROR: EVA_AGENT_API_URL is not configured')
    process.exit(1)
  }

  console.log('\n📡 Testing EVA API with correct endpoints...\n')

  const runId = `test_run_${Date.now()}`

  try {
    // Test 1: Create session
    console.log('Test 1: Create EVA Session')
    const sessionUrl = `${EVA_API_URL}/apps/${AGENT_NAME}/users/${EVA_USER_ID}/sessions/${runId}`
    console.log(`   URL: ${sessionUrl}`)

    const createResponse = await fetch(sessionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_instruction: 'Test instruction for session creation'
      }),
      signal: AbortSignal.timeout(15000),
    })

    console.log(`   Status: ${createResponse.status}`)

    if (createResponse.ok) {
      console.log(`   ✅ Session created successfully`)
      const sessionData = await createResponse.json()
      console.log(`   Response:`, JSON.stringify(sessionData, null, 2))
    } else {
      const errorText = await createResponse.text()
      console.log(`   ⚠️  Failed: ${errorText}`)
    }

    // Test 2: Get session
    console.log('\nTest 2: Get EVA Session')
    const getResponse = await fetch(sessionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    })

    console.log(`   Status: ${getResponse.status}`)

    if (getResponse.ok) {
      const sessionData = await getResponse.json()
      console.log(`   ✅ Session retrieved`)
      console.log(`   Response:`, JSON.stringify(sessionData, null, 2))
    } else {
      const errorText = await getResponse.text()
      console.log(`   ⚠️  Failed: ${errorText}`)
    }

    // Test 3: Execute run with SSE stream
    console.log('\nTest 3: Execute Run (SSE Stream)')
    const streamUrl = `${EVA_API_URL}/run_sse`
    console.log(`   URL: ${streamUrl}`)

    const streamPayload = {
      app_name: AGENT_NAME,
      user_id: EVA_USER_ID,
      session_id: runId,
      new_message: {
        role: 'user',
        parts: [{ text: 'Visit https://example.com and tell me the page title' }],
      },
    }

    console.log(`   Payload:`, JSON.stringify(streamPayload, null, 2))

    const streamResponse = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(streamPayload),
      signal: AbortSignal.timeout(30000),
    })

    console.log(`   Status: ${streamResponse.status}`)

    if (streamResponse.ok) {
      console.log(`   ✅ Stream started`)
      console.log(`   Content-Type: ${streamResponse.headers.get('content-type')}`)

      // Read first chunk of SSE stream
      const reader = streamResponse.body.getReader()
      const decoder = new TextDecoder()
      let eventCount = 0

      while (eventCount < 5) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        console.log(`   Event ${++eventCount}:`, chunk.substring(0, 200))
      }

      reader.cancel()
      console.log(`   📡 Received ${eventCount} events`)
    } else {
      const errorText = await streamResponse.text()
      console.log(`   ⚠️  Failed: ${errorText}`)
    }

  } catch (error) {
    console.error(`\n❌ Test failed:`)
    console.error(`   Error: ${error.message}`)

    if (error.cause) {
      console.error(`   Cause: ${error.cause.message || error.cause}`)
    }

    if (error.name === 'AbortError') {
      console.log('\n💡 The request timed out. Possible issues:')
      console.log('   1. EVA service is not responding')
      console.log('   2. Network connectivity issues')
      console.log('   3. EVA service is overloaded')
    }

    process.exit(1)
  }

  console.log('\n━'.repeat(60))
  console.log('✅ Connection tests complete!')
  console.log('━'.repeat(60))
}

testCorrectEndpoints()
