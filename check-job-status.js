import postgres from 'postgres';

const client = postgres('postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres');

async function checkJobs() {
  try {
    console.log('Checking job status for Sheriff & Coroner project...\n');

    const jobs = await client`
      SELECT id, site_url, status, last_run_at, created_at
      FROM jobs
      WHERE project_id = 'e65b1aae-34b3-42ef-8adf-363cbcd73742'
      ORDER BY created_at DESC
      LIMIT 15
    `;

    console.log(`Found ${jobs.length} jobs:\n`);

    for (const job of jobs) {
      const createdAt = new Date(job.created_at).toLocaleString();
      const lastRunAt = job.last_run_at ? new Date(job.last_run_at).toLocaleString() : 'Never';
      console.log(`Job ID: ${job.id}`);
      console.log(`  URL: ${job.site_url}`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Created: ${createdAt}`);
      console.log(`  Last Run: ${lastRunAt}`);
      console.log(`  Detail URL: http://localhost:3000/projects/e65b1aae-34b3-42ef-8adf-363cbcd73742/jobs/${job.id}`);
      console.log('');
    }

    // Count by status
    const statusCount = {};
    for (const job of jobs) {
      statusCount[job.status] = (statusCount[job.status] || 0) + 1;
    }

    console.log('Status Summary:');
    for (const [status, count] of Object.entries(statusCount)) {
      console.log(`  ${status}: ${count}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkJobs();
