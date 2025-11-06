/**
 * Notification Preferences API
 * GET: Get user notification preferences
 * PUT: Update user notification preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/notifications'
import { handleApiError, validateRequest } from '@/lib/api-helpers'
import { withAPM } from '@/lib/apm-middleware'
import { z } from 'zod'

// ============================================================================
// GET - Get preferences
// ============================================================================

async function getHandler(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserWithOrganization()

    // Get preferences
    const preferences = await getNotificationPreferences(user.id)

    // Return default preferences if none exist
    if (!preferences) {
      return NextResponse.json({
        preferences: {
          emailEnabled: true,
          emailExecutionComplete: true,
          emailExecutionFailed: true,
          emailWeeklyDigest: true,
          emailTeamInvites: true,
          slackEnabled: false,
          slackWebhookUrl: null,
          slackChannel: null,
          inAppEnabled: true,
          smsEnabled: false,
          smsPhoneNumber: null,
          pushEnabled: false,
        },
      })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAPM(getHandler)

// ============================================================================
// PUT - Update preferences
// ============================================================================

const updateSchema = z.object({
  // Email preferences
  emailEnabled: z.boolean().optional(),
  emailExecutionComplete: z.boolean().optional(),
  emailExecutionFailed: z.boolean().optional(),
  emailWeeklyDigest: z.boolean().optional(),
  emailTeamInvites: z.boolean().optional(),

  // Slack preferences
  slackEnabled: z.boolean().optional(),
  slackWebhookUrl: z.string().url().nullable().optional(),
  slackChannel: z.string().nullable().optional(),

  // In-app preferences
  inAppEnabled: z.boolean().optional(),

  // SMS preferences (future)
  smsEnabled: z.boolean().optional(),
  smsPhoneNumber: z.string().nullable().optional(),

  // Push preferences (future)
  pushEnabled: z.boolean().optional(),
})

async function putHandler(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserWithOrganization()

    // Validate request body
    const validation = await validateRequest(request, updateSchema)
    if (!validation.success) {
      return validation.response
    }

    const updates = validation.data

    // Update preferences
    const preferences = await updateNotificationPreferences(
      user.id,
      user.organizationId,
      updates
    )

    return NextResponse.json({ preferences })
  } catch (error) {
    return handleApiError(error)
  }
}

export const PUT = withAPM(putHandler)
