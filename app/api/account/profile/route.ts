import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/auth-schema'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import { handleApiError, ApiError } from '@/lib/api-helpers'
import { ErrorCodes } from '@/lib/error-codes'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
})

/**
 * GET /api/account/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()

    const [profile] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, user.id))

    if (!profile) {
      throw new ApiError('Profile not found', ErrorCodes.NOT_FOUND, 404)
    }

    return NextResponse.json({
      profile,
      organization: {
        id: user.organizationId,
        role: user.organizationRole,
        permissions: user.permissions,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/account/profile
 * Update current user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()
    const body = await request.json()
    const validated = updateProfileSchema.parse(body)

    // Check if email is being changed to an existing email
    if (validated.email && validated.email !== user.email) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, validated.email))

      if (existingUser) {
        throw new ApiError(
          'Email already in use',
          ErrorCodes.CONFLICT,
          409
        )
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning()

    return NextResponse.json({
      profile: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
