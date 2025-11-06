/**
 * Notification Service
 * Handles creation and management of in-app notifications
 */

import { db } from '@/db'
import { notifications, notificationPreferences } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { sendNotificationEmail } from './email-service'
import { sendSlackNotification } from './slack-service'
import { logger } from './logger'

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType =
  | 'execution_complete'
  | 'execution_failed'
  | 'team_invitation'
  | 'system_alert'
  | 'batch_ready'
  | 'quota_warning'
  | 'accuracy_alert'

export interface NotificationData {
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  actionLabel?: string
  actionUrl?: string
}

export interface CreateNotificationParams extends NotificationData {
  userId: string
  organizationId: string
}

export interface NotificationFilters {
  userId?: string
  organizationId?: string
  type?: NotificationType
  isRead?: boolean
  limit?: number
  offset?: number
}

// ============================================================================
// NOTIFICATION CREATION
// ============================================================================

/**
 * Create a new notification for a user
 * Automatically delivers via email/Slack based on user preferences
 */
export async function createNotification(params: CreateNotificationParams) {
  const {
    userId,
    organizationId,
    type,
    title,
    message,
    data,
    actionLabel,
    actionUrl,
  } = params

  try {
    // Create notification in database
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        organizationId,
        type,
        title,
        message,
        data,
        actionLabel,
        actionUrl,
        isRead: false,
      })
      .returning()

    logger.info({
      notificationId: notification.id,
      userId,
      type,
    }, 'Notification created')

    // Get user notification preferences
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    })

    // Deliver via configured channels
    await deliverNotification(notification, prefs)

    return notification
  } catch (error) {
    logger.error({
      error,
      userId,
      type,
    }, 'Failed to create notification')
    throw error
  }
}

/**
 * Create notifications for multiple users (batch operation)
 */
export async function createBulkNotifications(
  notificationParams: CreateNotificationParams[]
) {
  try {
    const notifs = await db
      .insert(notifications)
      .values(
        notificationParams.map((p) => ({
          userId: p.userId,
          organizationId: p.organizationId,
          type: p.type,
          title: p.title,
          message: p.message,
          data: p.data,
          actionLabel: p.actionLabel,
          actionUrl: p.actionUrl,
          isRead: false,
        }))
      )
      .returning()

    logger.info({
      count: notifs.length,
    }, 'Bulk notifications created')

    // Deliver in parallel
    await Promise.allSettled(
      notifs.map(async (notif) => {
        const prefs = await db.query.notificationPreferences.findFirst({
          where: eq(notificationPreferences.userId, notif.userId),
        })
        return deliverNotification(notif, prefs || null)
      })
    )

    return notifs
  } catch (error) {
    logger.error({ error }, 'Failed to create bulk notifications')
    throw error
  }
}

/**
 * Deliver notification via configured channels
 */
async function deliverNotification(
  notification: any,
  prefs: any | null
) {
  const deliveryPromises: Promise<any>[] = []

  // Default preferences if none exist
  const emailEnabled = prefs?.emailEnabled ?? true
  const slackEnabled = prefs?.slackEnabled ?? false

  // Email delivery
  if (emailEnabled && shouldSendEmail(notification.type, prefs)) {
    deliveryPromises.push(
      sendNotificationEmail(notification)
        .then(() => {
          return db
            .update(notifications)
            .set({ deliveredViaEmail: true })
            .where(eq(notifications.id, notification.id))
        })
        .catch((error) => {
          logger.error({
            notificationId: notification.id,
            error,
          }, 'Failed to send notification email')
        })
    )
  }

  // Slack delivery
  if (slackEnabled && prefs?.slackWebhookUrl) {
    deliveryPromises.push(
      sendSlackNotification({
        webhookUrl: prefs.slackWebhookUrl,
        channel: prefs.slackChannel,
        notification,
      })
        .then(() => {
          return db
            .update(notifications)
            .set({ deliveredViaSlack: true })
            .where(eq(notifications.id, notification.id))
        })
        .catch((error) => {
          logger.error({
            notificationId: notification.id,
            error,
          }, 'Failed to send Slack notification')
        })
    )
  }

  await Promise.allSettled(deliveryPromises)
}

/**
 * Check if email should be sent based on type and preferences
 */
function shouldSendEmail(
  type: NotificationType,
  prefs: any | null
): boolean {
  if (!prefs) return true // Default to sending if no preferences

  switch (type) {
    case 'execution_complete':
      return prefs.emailExecutionComplete ?? true
    case 'execution_failed':
      return prefs.emailExecutionFailed ?? true
    case 'team_invitation':
      return prefs.emailTeamInvites ?? true
    case 'system_alert':
    case 'batch_ready':
    case 'quota_warning':
    case 'accuracy_alert':
      return true // Always send critical notifications
    default:
      return true
  }
}

// ============================================================================
// NOTIFICATION RETRIEVAL
// ============================================================================

/**
 * Get notifications for a user with filters
 */
export async function getNotifications(filters: NotificationFilters) {
  const {
    userId,
    organizationId,
    type,
    isRead,
    limit = 50,
    offset = 0,
  } = filters

  const conditions = []

  if (userId) {
    conditions.push(eq(notifications.userId, userId))
  }

  if (organizationId) {
    conditions.push(eq(notifications.organizationId, organizationId))
  }

  if (type) {
    conditions.push(eq(notifications.type, type))
  }

  if (isRead !== undefined) {
    conditions.push(eq(notifications.isRead, isRead))
  }

  const results = await db.query.notifications.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(notifications.createdAt)],
    limit,
    offset,
  })

  return results
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    )

  return result[0]?.count || 0
}

/**
 * Get recent notifications for a user (last 30 days)
 */
export async function getRecentNotifications(
  userId: string,
  limit: number = 20
) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, userId),
      sql`${notifications.createdAt} >= ${thirtyDaysAgo}`
    ),
    orderBy: [desc(notifications.createdAt)],
    limit,
  })
}

// ============================================================================
// NOTIFICATION UPDATES
// ============================================================================

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  try {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )

    logger.info({ notificationId, userId }, 'Notification marked as read')
  } catch (error) {
    logger.error({
      error,
      notificationId,
      userId,
    }, 'Failed to mark notification as read')
    throw error
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  try {
    const result = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )

    logger.info({ userId }, 'All notifications marked as read')
    return result
  } catch (error) {
    logger.error({
      error,
      userId,
    }, 'Failed to mark all notifications as read')
    throw error
  }
}

/**
 * Delete old notifications (cleanup)
 */
export async function deleteOldNotifications(daysOld: number = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  try {
    const result = await db
      .delete(notifications)
      .where(sql`${notifications.createdAt} < ${cutoffDate}`)

    logger.info({
      daysOld,
      deletedCount: result.length,
    }, 'Old notifications deleted')

    return result
  } catch (error) {
    logger.error({ error, daysOld }, 'Failed to delete old notifications')
    throw error
  }
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(userId: string) {
  return db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId),
  })
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  organizationId: string,
  updates: Partial<typeof notificationPreferences.$inferInsert>
) {
  try {
    // Check if preferences exist
    const existing = await getNotificationPreferences(userId)

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(notificationPreferences)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, userId))
        .returning()

      logger.info({ userId }, 'Notification preferences updated')
      return updated
    } else {
      // Create new
      const [created] = await db
        .insert(notificationPreferences)
        .values({
          userId,
          organizationId,
          ...updates,
        })
        .returning()

      logger.info({ userId }, 'Notification preferences created')
      return created
    }
  } catch (error) {
    logger.error({
      error,
      userId,
    }, 'Failed to update notification preferences')
    throw error
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create execution complete notification
 */
export async function notifyExecutionComplete(params: {
  userId: string
  organizationId: string
  batchName: string
  batchId: string
  projectId: string
  completedJobs: number
  totalJobs: number
  accuracyPercentage?: number
}) {
  const {
    userId,
    organizationId,
    batchName,
    batchId,
    projectId,
    completedJobs,
    totalJobs,
    accuracyPercentage,
  } = params

  return createNotification({
    userId,
    organizationId,
    type: 'execution_complete',
    title: 'Execution Complete',
    message: `Batch "${batchName}" completed successfully. ${completedJobs}/${totalJobs} jobs finished${
      accuracyPercentage ? ` with ${accuracyPercentage.toFixed(1)}% accuracy` : ''
    }.`,
    data: {
      batchId,
      projectId,
      completedJobs,
      totalJobs,
      accuracyPercentage,
    },
    actionLabel: 'View Results',
    actionUrl: `/projects/${projectId}/batches/${batchId}`,
  })
}

/**
 * Create execution failed notification
 */
export async function notifyExecutionFailed(params: {
  userId: string
  organizationId: string
  batchName: string
  batchId: string
  projectId: string
  errorMessage: string
}) {
  const {
    userId,
    organizationId,
    batchName,
    batchId,
    projectId,
    errorMessage,
  } = params

  return createNotification({
    userId,
    organizationId,
    type: 'execution_failed',
    title: 'Execution Failed',
    message: `Batch "${batchName}" failed: ${errorMessage}`,
    data: {
      batchId,
      projectId,
      errorMessage,
    },
    actionLabel: 'View Details',
    actionUrl: `/projects/${projectId}/batches/${batchId}`,
  })
}

/**
 * Create accuracy alert notification
 */
export async function notifyAccuracyAlert(params: {
  userId: string
  organizationId: string
  batchName: string
  batchId: string
  projectId: string
  currentAccuracy: number
  threshold: number
}) {
  const {
    userId,
    organizationId,
    batchName,
    batchId,
    projectId,
    currentAccuracy,
    threshold,
  } = params

  return createNotification({
    userId,
    organizationId,
    type: 'accuracy_alert',
    title: 'Low Accuracy Alert',
    message: `Batch "${batchName}" accuracy (${currentAccuracy.toFixed(
      1
    )}%) is below threshold (${threshold}%)`,
    data: {
      batchId,
      projectId,
      currentAccuracy,
      threshold,
    },
    actionLabel: 'Review Batch',
    actionUrl: `/projects/${projectId}/batches/${batchId}`,
  })
}
