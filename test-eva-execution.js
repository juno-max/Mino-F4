const EVA_URL = 'https://eva.sandbox.tinyfish.io'

async function testEVAExecution() {
  console.log('🤖 Testing EVA Agent Execution\n')
  console.log('============================================================\n')

  // Test data
  const testJob = {
    url: 'https://www.mississippicountyar.org/',
    goal: 'Find the sheriff name, coroner name, sheriff phone, and coroner phone on this county government website'
  }

  console.log('Test Job:')
  console.log('  URL:', testJob.url)
  console.log('  Goal:', testJob.goal)
  console.log()

  try {
    // Create a test run
    console.log('1. Creating EVA run...')

    const createResponse = await fetch(`${EVA_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testJob.url,
        goal: testJob.goal,
      })
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('   ❌ Failed to create run:', createResponse.status, errorText)
      return
    }

    const runData = await createResponse.json()
    console.log('   ✅ Run created:', runData.id || runData.run_id)
    console.log('   ℹ️  Response:', JSON.stringify(runData, null, 2).substring(0, 200))

    // If there's a run ID, try to get status
    const runId = runData.id || runData.run_id
    if (runId) {
      console.log('\n2. Checking run status...')

      await new Promise(resolve => setTimeout(resolve, 2000))

      const statusResponse = await fetch(`${EVA_URL}/run/${runId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log('   ✅ Status:', statusData.status)
        console.log('   ℹ️  Response:', JSON.stringify(statusData, null, 2).substring(0, 300))
      } else {
        console.log('   ⚠️  Status check returned:', statusResponse.status)
      }
    }

    console.log('\n============================================================')
    console.log('\n✅ EVA Agent is accessible and accepting requests!\n')

  } catch (error) {
    console.error('\n❌ EVA connection error:', error.message)
    console.log('\nℹ️  Make sure:')
    console.log('   1. EVA_AGENT_API_URL is set correctly in .env.local')
    console.log('   2. EVA service is running at:', EVA_URL)
    console.log('   3. Network connectivity is working\n')
  }
}

testEVAExecution()
