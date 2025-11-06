/**
 * Unread Notifications Count API
 * GET: Get unread notification count for current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import { getUnreadCount } from '@/lib/notifications'
import { handleApiError } from '@/lib/api-helpers'
import { withAPM } from '@/lib/apm-middleware'

async function getHandler(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserWithOrganization()

    // Get unread count
    const count = await getUnreadCount(user.id)

    return NextResponse.json({ count })
  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAPM(getHandler)
