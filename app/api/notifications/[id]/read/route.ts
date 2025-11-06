/**
 * Mark Notification as Read API
 * POST: Mark a specific notification as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import { markAsRead } from '@/lib/notifications'
import { handleApiError, validateParams } from '@/lib/api-helpers'
import { withAPM } from '@/lib/apm-middleware'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().uuid(),
})

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserWithOrganization()

    // Validate params
    const validation = await validateParams(params, paramsSchema)
    if (!validation.success) {
      return validation.response
    }

    const { id } = validation.data

    // Mark as read
    await markAsRead(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withAPM(postHandler)
