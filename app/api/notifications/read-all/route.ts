/**
 * Mark All Notifications as Read API
 * POST: Mark all notifications as read for current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import { markAllAsRead } from '@/lib/notifications'
import { handleApiError } from '@/lib/api-helpers'
import { withAPM } from '@/lib/apm-middleware'

async function postHandler(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserWithOrganization()

    // Mark all as read
    await markAllAsRead(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withAPM(postHandler)
