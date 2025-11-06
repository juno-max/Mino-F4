const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

const connectionString = 'postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

async function analyzeUsagePatterns() {
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log('📊 MINO USAGE PATTERN ANALYSIS\n');
  console.log('=' . repeat(80));

  try {
    // Get projects overview
    const projectsResult = await client`
      SELECT
        id,
        name,
        description,
        LEFT(instructions, 100) as instructions_preview,
        created_at
      FROM projects
      ORDER BY created_at DESC
      LIMIT 10
    `;

    console.log('\n🎯 PROJECTS (' + projectsResult.length + ' total):');
    console.log('-'.repeat(80));
    projectsResult.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      if (p.description) console.log(`   Description: ${p.description}`);
      console.log(`   Instructions preview: ${p.instructions_preview}...`);
      console.log(`   Created: ${new Date(p.created_at).toLocaleDateString()}`);
    });

    // Get batches overview
    const batchesResult = await client`
      SELECT
        b.id,
        b.name,
        b.description,
        b.total_sites,
        b.has_ground_truth,
        b.column_schema,
        p.name as project_name,
        b.created_at,
        COUNT(DISTINCT j.id) as job_count
      FROM batches b
      JOIN projects p ON b.project_id = p.id
      LEFT JOIN jobs j ON j.batch_id = b.id
      GROUP BY b.id, p.name
      ORDER BY b.created_at DESC
      LIMIT 10
    `;

    console.log('\n\n📦 BATCHES (' + batchesResult.length + ' total):');
    console.log('-'.repeat(80));
    batchesResult.forEach((b, i) => {
      console.log(`\n${i + 1}. ${b.name} (Project: ${b.project_name})`);
      if (b.description) console.log(`   Description: ${b.description}`);
      console.log(`   Total Sites: ${b.total_sites} | Jobs Created: ${b.job_count}`);
      console.log(`   Has Ground Truth: ${b.has_ground_truth ? 'Yes' : 'No'}`);
      if (b.column_schema) {
        const cols = typeof b.column_schema === 'string' ? JSON.parse(b.column_schema) : b.column_schema;
        const gtCols = cols.filter(c => c.isGroundTruth);
        console.log(`   Columns: ${cols.length} total${gtCols.length > 0 ? `, ${gtCols.length} GT` : ''}`);
        console.log(`   Column names: ${cols.map(c => c.name).join(', ')}`);
      }
      console.log(`   Created: ${new Date(b.created_at).toLocaleDateString()}`);
    });

    // Get executions overview
    const executionsResult = await client`
      SELECT
        e.id,
        e.status,
        e.execution_type,
        e.total_jobs,
        e.completed_jobs,
        e.error_jobs,
        e.passed_jobs,
        e.failed_jobs,
        e.pass_rate,
        e.concurrency,
        b.name as batch_name,
        p.name as project_name,
        e.created_at,
        e.started_at,
        e.completed_at
      FROM executions e
      JOIN batches b ON e.batch_id = b.id
      JOIN projects p ON e.project_id = p.id
      ORDER BY e.created_at DESC
      LIMIT 10
    `;

    console.log('\n\n🚀 EXECUTIONS (' + executionsResult.length + ' total):');
    console.log('-'.repeat(80));
    executionsResult.forEach((e, i) => {
      console.log(`\n${i + 1}. ${e.project_name} → ${e.batch_name}`);
      console.log(`   Status: ${e.status} | Type: ${e.execution_type} | Concurrency: ${e.concurrency}`);
      console.log(`   Jobs: ${e.completed_jobs}/${e.total_jobs} completed | ${e.error_jobs} errors`);
      if (e.passed_jobs !== null) {
        console.log(`   Results: ${e.passed_jobs} passed | ${e.failed_jobs} failed | Pass Rate: ${e.pass_rate}%`);
      }
      if (e.started_at && e.completed_at) {
        const duration = (new Date(e.completed_at) - new Date(e.started_at)) / 1000;
        console.log(`   Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`);
      }
      console.log(`   Created: ${new Date(e.created_at).toLocaleString()}`);
    });

    // Get jobs status breakdown
    const jobsResult = await client`
      SELECT
        status,
        detailed_status,
        COUNT(*) as count
      FROM jobs
      GROUP BY status, detailed_status
      ORDER BY count DESC
    `;

    console.log('\n\n📋 JOBS STATUS BREAKDOWN:');
    console.log('-'.repeat(80));
    jobsResult.forEach((j) => {
      console.log(`${j.status}${j.detailed_status ? ` (${j.detailed_status})` : ''}: ${j.count}`);
    });

    // Get common failure patterns
    const failuresResult = await client`
      SELECT
        blocked_reason,
        failure_category,
        COUNT(*) as count
      FROM jobs
      WHERE status = 'error'
      GROUP BY blocked_reason, failure_category
      ORDER BY count DESC
      LIMIT 10
    `;

    if (failuresResult.length > 0) {
      console.log('\n\n⚠️  COMMON FAILURE PATTERNS:');
      console.log('-'.repeat(80));
      failuresResult.forEach((f, i) => {
        console.log(`${i + 1}. ${f.failure_category || 'Unknown'} ${f.blocked_reason ? `(${f.blocked_reason})` : ''}: ${f.count} occurrences`);
      });
    }

    // Get session statistics
    const sessionsResult = await client`
      SELECT
        s.status,
        s.detailed_status,
        COUNT(*) as count,
        AVG(s.execution_time_ms) as avg_execution_time
      FROM sessions s
      GROUP BY s.status, s.detailed_status
      ORDER BY count DESC
    `;

    console.log('\n\n🎬 SESSIONS (Execution Attempts) BREAKDOWN:');
    console.log('-'.repeat(80));
    sessionsResult.forEach((s) => {
      const avgTime = s.avg_execution_time ? Math.round(s.avg_execution_time / 1000) : 0;
      console.log(`${s.status}${s.detailed_status ? ` (${s.detailed_status})` : ''}: ${s.count} (avg ${avgTime}s)`);
    });

    // Ground truth usage
    const gtResult = await client`
      SELECT
        COUNT(*) FILTER (WHERE has_ground_truth = true) as batches_with_gt,
        COUNT(*) FILTER (WHERE has_ground_truth = false) as batches_without_gt,
        COUNT(*) as total_batches
      FROM batches
    `;

    console.log('\n\n✅ GROUND TRUTH USAGE:');
    console.log('-'.repeat(80));
    const gt = gtResult[0];
    console.log(`Batches with GT: ${gt.batches_with_gt}/${gt.total_batches} (${Math.round(gt.batches_with_gt / gt.total_batches * 100)}%)`);
    console.log(`Batches without GT: ${gt.batches_without_gt}/${gt.total_batches}`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ Analysis complete!\n');

  } catch (error) {
    console.error('Error analyzing usage patterns:', error);
  } finally {
    await client.end();
  }
}

analyzeUsagePatterns();
