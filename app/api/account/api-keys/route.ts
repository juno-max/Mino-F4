import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { apiKeys } from '@/db/auth-schema'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import { handleApiError, ApiError } from '@/lib/api-helpers'
import { ErrorCodes } from '@/lib/error-codes'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import crypto from 'crypto'

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
})

/**
 * Generate a secure API key with prefix
 */
function generateApiKey(): { key: string; hash: string } {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  const key = `mino_sk_${randomBytes}`
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  return { key, hash }
}

/**
 * GET /api/account/api-keys
 * List all API keys for current user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPreview: apiKeys.keyPreview,
        scopes: apiKeys.scopes,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.organizationId, user.organizationId),
          eq(apiKeys.isRevoked, false)
        )
      )
      .orderBy(apiKeys.createdAt)

    return NextResponse.json({ keys })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/account/api-keys
 * Generate a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()
    const body = await request.json()
    const validated = createApiKeySchema.parse(body)

    // Generate secure API key
    const { key, hash } = generateApiKey()
    const keyPreview = `${key.substring(0, 12)}...${key.substring(key.length - 4)}`

    // Store hashed key in database
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        organizationId: user.organizationId,
        name: validated.name,
        keyHash: hash,
        keyPreview,
        scopes: validated.scopes || [],
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
      })
      .returning()

    // Return the actual key ONLY on creation (never stored or shown again)
    return NextResponse.json({
      key, // Full key - user must save this!
      apiKey: {
        id: newKey.id,
        name: newKey.name,
        keyPreview: newKey.keyPreview,
        scopes: newKey.scopes,
        expiresAt: newKey.expiresAt,
        createdAt: newKey.createdAt,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/account/api-keys/:id
 * Revoke an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()
    const url = new URL(request.url)
    const keyId = url.pathname.split('/').pop()

    if (!keyId) {
      throw new ApiError('API key ID required', ErrorCodes.VALIDATION_ERROR, 400)
    }

    // Verify ownership
    const [existingKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.organizationId, user.organizationId)
        )
      )

    if (!existingKey) {
      throw new ApiError('API key not found', ErrorCodes.NOT_FOUND, 404)
    }

    // Mark as revoked
    await db
      .update(apiKeys)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId))

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
