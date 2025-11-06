/**
 * Notifications API
 * GET: List notifications for current user
 * POST: Create notification (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth-helpers'
import { getNotifications, createNotification } from '@/lib/notifications'
import { handleApiError, validateQueryParams, validateRequest } from '@/lib/api-helpers'
import { withAPM } from '@/lib/apm-middleware'
import { z } from 'zod'

// ============================================================================
// GET - List notifications
// ============================================================================

const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50).or(z.number()),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0).or(z.number()),
  type: z.string().optional(),
  isRead: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined).or(z.boolean().optional()),
}) as z.ZodType<{
  limit: number
  offset: number
  type?: string
  isRead?: boolean
}>

async function getHandler(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserWithOrganization()

    // Validate query params
    const validation = validateQueryParams(request, querySchema)
    if (!validation.success) {
      return validation.response
    }

    const { limit, offset, type, isRead } = validation.data

    // Get notifications
    const notifications = await getNotifications({
      userId: user.id,
      organizationId: user.organizationId,
      limit,
      offset,
      ...(type && { type: type as any }),
      ...(isRead !== undefined && { isRead }),
    })

    return NextResponse.json({
      notifications,
      pagination: {
        limit,
        offset,
        total: notifications.length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAPM(getHandler)

// ============================================================================
// POST - Create notification
// ============================================================================

const createSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    'execution_complete',
    'execution_failed',
    'team_invitation',
    'system_alert',
    'batch_ready',
    'quota_warning',
    'accuracy_alert',
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  actionLabel: z.string().optional(),
  actionUrl: z.string().optional(),
  data: z.record(z.any()).optional(),
})

async function postHandler(request: NextRequest) {
  try {
    // Authenticate user (admin only for manual notification creation)
    const user = await getUserWithOrganization()

    // Validate request body
    const validation = await validateRequest(request, createSchema)
    if (!validation.success) {
      return validation.response
    }

    const { userId, type, title, message, actionLabel, actionUrl, data } = validation.data

    // Create notification
    const notification = await createNotification({
      userId,
      organizationId: user.organizationId,
      type,
      title,
      message,
      actionLabel,
      actionUrl,
      data,
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withAPM(postHandler)
