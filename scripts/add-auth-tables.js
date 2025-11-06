/**
 * Add Authentication Tables Migration
 * Adds NextAuth.js tables and multi-tenancy support
 */

const { drizzle } = require('drizzle-orm/postgres-js')
const postgres = require('postgres')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.jyoxngcfkyjykalweosd:kyb!FHG9ckw9aqt1xnf@aws-1-us-east-1.pooler.supabase.com:6543/postgres'

async function main() {
  console.log('🔐 Adding authentication tables...\n')

  const sql = postgres(DATABASE_URL, { max: 1 })

  const migrations = [
    // Users table
    {
      name: 'users',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT,
          email TEXT NOT NULL UNIQUE,
          email_verified TIMESTAMP,
          image TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
    },

    // Accounts table
    {
      name: 'accounts',
      sql: `
        CREATE TABLE IF NOT EXISTS accounts (
          id UUID DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          provider TEXT NOT NULL,
          provider_account_id TEXT NOT NULL,
          refresh_token TEXT,
          access_token TEXT,
          expires_at INTEGER,
          token_type TEXT,
          scope TEXT,
          id_token TEXT,
          session_state TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          PRIMARY KEY (provider, provider_account_id)
        )
      `
    },

    // Sessions table (rename to avoid conflict)
    {
      name: 'auth_sessions',
      sql: `
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_token TEXT NOT NULL UNIQUE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
    },

    // Verification tokens
    {
      name: 'verification_tokens',
      sql: `
        CREATE TABLE IF NOT EXISTS verification_tokens (
          identifier TEXT NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires TIMESTAMP NOT NULL,
          PRIMARY KEY (identifier, token)
        )
      `
    },

    // Organizations
    {
      name: 'organizations',
      sql: `
        CREATE TABLE IF NOT EXISTS organizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          image TEXT,
          plan TEXT NOT NULL DEFAULT 'free',
          max_projects INTEGER DEFAULT 5,
          max_jobs_per_month INTEGER DEFAULT 1000,
          settings TEXT,
          owner_id UUID NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
    },

    // Organization members
    {
      name: 'organization_members',
      sql: `
        CREATE TABLE IF NOT EXISTS organization_members (
          id UUID DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'member',
          can_create_projects BOOLEAN DEFAULT TRUE,
          can_execute_jobs BOOLEAN DEFAULT TRUE,
          can_manage_members BOOLEAN DEFAULT FALSE,
          can_manage_billing BOOLEAN DEFAULT FALSE,
          invited_by UUID REFERENCES users(id),
          invited_at TIMESTAMP,
          joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          PRIMARY KEY (organization_id, user_id)
        )
      `
    },

    // Organization invitations
    {
      name: 'organization_invitations',
      sql: `
        CREATE TABLE IF NOT EXISTS organization_invitations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'member',
          token TEXT NOT NULL UNIQUE,
          invited_by UUID NOT NULL REFERENCES users(id),
          expires_at TIMESTAMP NOT NULL,
          accepted_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
    },

    // API keys
    {
      name: 'api_keys',
      sql: `
        CREATE TABLE IF NOT EXISTS api_keys (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          key_prefix TEXT NOT NULL,
          key_hash TEXT NOT NULL UNIQUE,
          scopes TEXT[] NOT NULL,
          last_used_at TIMESTAMP,
          usage_count INTEGER DEFAULT 0,
          created_by UUID NOT NULL REFERENCES users(id),
          revoked_at TIMESTAMP,
          revoked_by UUID REFERENCES users(id),
          expires_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
    },

    // Add organization_id to existing tables
    {
      name: 'add_org_to_projects',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='projects' AND column_name='organization_id'
          ) THEN
            ALTER TABLE projects ADD COLUMN organization_id UUID REFERENCES organizations(id);
            CREATE INDEX idx_projects_organization ON projects(organization_id);
          END IF;
        END $$;
      `
    },

    {
      name: 'add_org_to_batches',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='batches' AND column_name='organization_id'
          ) THEN
            ALTER TABLE batches ADD COLUMN organization_id UUID REFERENCES organizations(id);
            CREATE INDEX idx_batches_organization ON batches(organization_id);
          END IF;
        END $$;
      `
    },

    {
      name: 'add_org_to_jobs',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='jobs' AND column_name='organization_id'
          ) THEN
            ALTER TABLE jobs ADD COLUMN organization_id UUID REFERENCES organizations(id);
            CREATE INDEX idx_jobs_organization ON jobs(organization_id);
          END IF;
        END $$;
      `
    },

    {
      name: 'add_org_to_executions',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='executions' AND column_name='organization_id'
          ) THEN
            ALTER TABLE executions ADD COLUMN organization_id UUID REFERENCES organizations(id);
            CREATE INDEX idx_executions_organization ON executions(organization_id);
          END IF;
        END $$;
      `
    },
  ]

  let successCount = 0
  let errorCount = 0

  for (const migration of migrations) {
    try {
      await sql.unsafe(migration.sql)
      console.log(`✅ ${migration.name}`)
      successCount++
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⏭️  ${migration.name} (already exists)`)
        successCount++
      } else {
        console.error(`❌ ${migration.name}: ${error.message}`)
        errorCount++
      }
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)

  await sql.end()
  console.log('\n✨ Done!')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
