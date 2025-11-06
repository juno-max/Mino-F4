import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { apiKeys } from '@/db/auth-schema'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/api-helpers'
import { ApiError, ErrorCodes } from '@/lib/error-codes'
import { eq, and } from 'drizzle-orm'

/**
 * DELETE /api/account/api-keys/:id
 * Revoke an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserWithOrganization()
    const keyId = params.id

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

    if (existingKey.revokedAt) {
      throw new ApiError('API key already revoked', ErrorCodes.CONFLICT, 409)
    }

    // Mark as revoked
    await db
      .update(apiKeys)
      .set({
        revokedAt: new Date(),
        revokedBy: user.id,
      })
      .where(eq(apiKeys.id, keyId))

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
