/**
 * Authentication Helper Functions
 * Utilities for protecting API routes and checking permissions
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import { db } from '@/db'
import { users, organizations, organizationMembers } from '@/db/auth-schema'
import { eq, and } from 'drizzle-orm'
import { ApiError, ErrorCodes } from './error-codes'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string | null
  image: string | null
}

export interface UserWithOrganization extends AuthenticatedUser {
  organizationId: string
  organizationRole: string
  permissions: {
    canCreateProjects: boolean
    canExecuteJobs: boolean
    canManageMembers: boolean
    canManageBilling: boolean
  }
}

/**
 * Get the current authenticated user from the session
 * Throws error if not authenticated
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !session.user.email) {
    throw new ApiError(
      'Not authenticated',
      ErrorCodes.UNAUTHORIZED,
      401
    )
  }

  return {
    id: session.user.id as string,
    email: session.user.email,
    name: session.user.name || null,
    image: session.user.image || null,
  }
}

/**
 * Get user with their default organization and permissions
 */
export async function getUserWithOrganization(): Promise<UserWithOrganization> {
  const user = await getAuthenticatedUser()

  // Get user's primary organization (first one they're a member of)
  const membership = await db.query.organizationMembers.findFirst({
    where: eq(organizationMembers.userId, user.id),
    with: {
      organization: true,
    },
    orderBy: (members, { asc }) => [asc(members.joinedAt)],
  })

  if (!membership) {
    throw new ApiError(
      'User is not a member of any organization',
      ErrorCodes.FORBIDDEN,
      403,
      { hint: 'Organization may have been deleted or user was removed' }
    )
  }

  return {
    ...user,
    organizationId: membership.organizationId,
    organizationRole: membership.role,
    permissions: {
      canCreateProjects: membership.canCreateProjects,
      canExecuteJobs: membership.canExecuteJobs,
      canManageMembers: membership.canManageMembers,
      canManageBilling: membership.canManageBilling,
    },
  }
}

/**
 * Require specific permission
 */
export async function requirePermission(permission: keyof UserWithOrganization['permissions']): Promise<UserWithOrganization> {
  const user = await getUserWithOrganization()

  if (!user.permissions[permission]) {
    throw new ApiError(
      `Missing required permission: ${permission}`,
      ErrorCodes.FORBIDDEN,
      403
    )
  }

  return user
}

/**
 * Require organization owner or admin role
 */
export async function requireAdminRole(): Promise<UserWithOrganization> {
  const user = await getUserWithOrganization()

  if (user.organizationRole !== 'owner' && user.organizationRole !== 'admin') {
    throw new ApiError(
      'Admin or owner role required',
      ErrorCodes.FORBIDDEN,
      403
    )
  }

  return user
}

/**
 * Require organization owner role
 */
export async function requireOwnerRole(): Promise<UserWithOrganization> {
  const user = await getUserWithOrganization()

  if (user.organizationRole !== 'owner') {
    throw new ApiError(
      'Owner role required',
      ErrorCodes.FORBIDDEN,
      403
    )
  }

  return user
}

/**
 * Check if user has access to a resource in an organization
 */
export async function checkOrganizationAccess(organizationId: string): Promise<UserWithOrganization> {
  const user = await getUserWithOrganization()

  if (user.organizationId !== organizationId) {
    // Check if user is a member of this org
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationId, organizationId)
      ),
    })

    if (!membership) {
      throw new ApiError(
        'Access denied to this organization',
        ErrorCodes.FORBIDDEN,
        403
      )
    }
  }

  return user
}

/**
 * Get all organizations user is a member of
 */
export async function getUserOrganizations(userId: string) {
  const memberships = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, userId),
    with: {
      organization: true,
    },
    orderBy: (members, { asc }) => [asc(members.joinedAt)],
  })

  return memberships.map(m => ({
    ...m.organization,
    role: m.role,
    permissions: {
      canCreateProjects: m.canCreateProjects,
      canExecuteJobs: m.canExecuteJobs,
      canManageMembers: m.canManageMembers,
      canManageBilling: m.canManageBilling,
    },
  }))
}

/**
 * Validate API key (for programmatic access)
 */
export async function validateApiKey(apiKey: string): Promise<{ organizationId: string; scopes: string[] }> {
  // Hash the provided API key
  const crypto = require('crypto')
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

  const { apiKeys } = await import('@/db/auth-schema')

  const key = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.keyHash, keyHash),
      eq(apiKeys.revokedAt, null)
    ),
  })

  if (!key) {
    throw new ApiError(
      'Invalid API key',
      ErrorCodes.UNAUTHORIZED,
      401
    )
  }

  // Check expiration
  if (key.expiresAt && new Date() > key.expiresAt) {
    throw new ApiError(
      'API key expired',
      ErrorCodes.UNAUTHORIZED,
      401
    )
  }

  // Update usage
  await db.update(apiKeys)
    .set({
      lastUsedAt: new Date(),
      usageCount: (key.usageCount || 0) + 1,
    })
    .where(eq(apiKeys.id, key.id))

  return {
    organizationId: key.organizationId,
    scopes: key.scopes || [],
  }
}

/**
 * Authenticate request (supports both session and API key)
 */
export async function authenticateRequest(request: Request): Promise<UserWithOrganization> {
  // Check for API key first
  const apiKey = request.headers.get('X-API-Key')
  if (apiKey) {
    const { organizationId, scopes } = await validateApiKey(apiKey)

    // Return a synthetic user object for API key auth
    return {
      id: 'api-key',
      email: 'api-key@mino.app',
      name: 'API Key',
      image: null,
      organizationId,
      organizationRole: 'member',
      permissions: {
        canCreateProjects: scopes.includes('projects:write'),
        canExecuteJobs: scopes.includes('jobs:write'),
        canManageMembers: false,
        canManageBilling: false,
      },
    }
  }

  // Fall back to session auth
  return await getUserWithOrganization()
}
