/**
 * Debug Job Data - Check what's actually stored in completed jobs
 */

require('dotenv').config({ path: '.env.local' })
const { drizzle } = require('drizzle-orm/postgres-js')
const postgres = require('postgres')
const { jobs, sessions } = require('../db/schema')
const { eq, desc } = require('drizzle-orm')

const connectionString = process.env.DATABASE_URL

async function debugJobData() {
  console.log('\n🔍 Debugging Job Data\n')
  console.log('━'.repeat(80))

  const client = postgres(connectionString)
  const db = drizzle(client)

  try {
    // Get the most recent completed job
    const completedJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, 'completed'))
      .orderBy(desc(jobs.completedAt))
      .limit(5)

    console.log(`Found ${completedJobs.length} completed jobs\n`)

    for (const job of completedJobs) {
      console.log('━'.repeat(80))
      console.log(`Job ID: ${job.id}`)
      console.log(`Status: ${job.status}`)
      console.log(`Site URL: ${job.siteUrl}`)
      console.log(`Completed At: ${job.completedAt}`)
      console.log(`\n📊 Extracted Data:`)

      if (job.extractedData) {
        console.log(JSON.stringify(job.extractedData, null, 2))
      } else {
        console.log('   ❌ NO EXTRACTED DATA!')
      }

      console.log(`\n📋 Ground Truth Data:`)
      if (job.groundTruthData) {
        console.log(JSON.stringify(job.groundTruthData, null, 2))
      } else {
        console.log('   ⚠️  No ground truth data')
      }

      // Get associated sessions
      const jobSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.jobId, job.id))
        .orderBy(desc(sessions.createdAt))

      console.log(`\n🔄 Sessions (${jobSessions.length}):`)
      for (const session of jobSessions) {
        console.log(`\n   Session ${session.sessionNumber}:`)
        console.log(`   Status: ${session.status}`)
        console.log(`   Error: ${session.errorMessage || 'None'}`)

        if (session.extractedData) {
          console.log(`   Extracted Data:`)
          console.log(JSON.stringify(session.extractedData, null, 2))
        } else {
          console.log(`   ❌ Session has no extracted data!`)
        }

        if (session.rawOutput) {
          console.log(`\n   Raw Output Preview:`)
          console.log(session.rawOutput.substring(0, 500))
        }
      }

      console.log('\n')
    }

    console.log('━'.repeat(80))
    console.log('\n💡 Analysis:\n')

    const jobsWithData = completedJobs.filter(j => j.extractedData && Object.keys(j.extractedData).length > 0)
    const jobsWithoutData = completedJobs.filter(j => !j.extractedData || Object.keys(j.extractedData).length === 0)

    console.log(`✅ Jobs with extracted data: ${jobsWithData.length}`)
    console.log(`❌ Jobs without extracted data: ${jobsWithoutData.length}`)

    if (jobsWithoutData.length > 0) {
      console.log('\n⚠️  PROBLEM: Jobs marked "completed" but have no extracted data!')
      console.log('   This is why the table shows empty cells.')
      console.log('\n   Possible causes:')
      console.log('   1. EVA execution is failing to extract data')
      console.log('   2. Data extraction is not being saved to job record')
      console.log('   3. Session data is not being copied to job record')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
  }
}

debugJobData()
