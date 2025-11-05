/**
 * NextAuth.js Database Schema with Multi-Tenancy
 *
 * This schema adds authentication and organization support to MINO.
 * Based on NextAuth.js adapter schema with additional organization tables.
 */

import { pgTable, text, uuid, timestamp, integer, boolean, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { projects, batches, jobs, executions } from './schema'

// ============================================================================
// AUTHENTICATION TABLES (NextAuth.js)
// ============================================================================

/**
 * Users table - stores user profile information
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Accounts table - stores OAuth provider information
 */
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'oauth' | 'email' | 'credentials'
  provider: text('provider').notNull(), // 'google' | 'github' | etc.
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Composite unique key for provider + providerAccountId
  providerProviderAccountId: primaryKey({
    columns: [table.provider, table.providerAccountId],
    name: 'provider_provider_account_id_pk'
  }),
}))

/**
 * Sessions table - stores active user sessions
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * Verification tokens - for email verification
 */
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(), // Email or phone
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  identifierToken: primaryKey({
    columns: [table.identifier, table.token],
    name: 'identifier_token_pk'
  }),
}))

// ============================================================================
// MULTI-TENANCY TABLES
// ============================================================================

/**
 * Organizations table - for multi-tenancy support
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),

  // Subscription & limits
  plan: text('plan').notNull().default('free'), // 'free' | 'pro' | 'enterprise'
  maxProjects: integer('max_projects').default(5),
  maxJobsPerMonth: integer('max_jobs_per_month').default(1000),

  // Settings
  settings: text('settings'), // JSON string for flexible settings

  // Ownership
  ownerId: uuid('owner_id').references(() => users.id).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Organization members - user membership in organizations
 */
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Role-based access control
  role: text('role').notNull().default('member'), // 'owner' | 'admin' | 'member' | 'viewer'

  // Permissions
  canCreateProjects: boolean('can_create_projects').default(true),
  canExecuteJobs: boolean('can_execute_jobs').default(true),
  canManageMembers: boolean('can_manage_members').default(false),
  canManageBilling: boolean('can_manage_billing').default(false),

  invitedBy: uuid('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: user can only be a member once per org
  orgUser: primaryKey({
    columns: [table.organizationId, table.userId],
    name: 'org_user_pk'
  }),
}))

/**
 * Organization invitations - pending invites
 */
export const organizationInvitations = pgTable('organization_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  token: text('token').notNull().unique(),
  invitedBy: uuid('invited_by').references(() => users.id).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * API Keys - for programmatic access
 */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for display
  keyHash: text('key_hash').notNull().unique(), // SHA-256 hash of full key

  // Permissions
  scopes: text('scopes').array().notNull(), // ['projects:read', 'jobs:write', etc.]

  // Usage tracking
  lastUsedAt: timestamp('last_used_at'),
  usageCount: integer('usage_count').default(0),

  // Lifecycle
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  revokedAt: timestamp('revoked_at'),
  revokedBy: uuid('revoked_by').references(() => users.id),
  expiresAt: timestamp('expires_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  ownedOrganizations: many(organizations),
  memberships: many(organizationMembers),
  invitations: many(organizationInvitations),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
  }),
  members: many(organizationMembers),
  invitations: many(organizationInvitations),
  apiKeys: many(apiKeys),
  projects: many(projects),
  batches: many(batches),
  jobs: many(jobs),
  executions: many(executions),
}))

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [organizationMembers.invitedBy],
    references: [users.id],
  }),
}))

export const organizationInvitationsRelations = relations(organizationInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvitations.organizationId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [organizationInvitations.invitedBy],
    references: [users.id],
  }),
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
  revoker: one(users, {
    fields: [apiKeys.revokedBy],
    references: [users.id],
  }),
}))
