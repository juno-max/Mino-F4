/**
 * Slack Integration Service
 * Send notifications and alerts to Slack webhooks
 */

import { logger } from './logger'

// ============================================================================
// TYPES
// ============================================================================

export interface SlackMessage {
  text: string
  blocks?: SlackBlock[]
  attachments?: SlackAttachment[]
}

export interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
    emoji?: boolean
  }
  elements?: any[]
  fields?: Array<{
    type: string
    text: string
  }>
}

export interface SlackAttachment {
  color?: string
  blocks?: SlackBlock[]
  footer?: string
  ts?: number
}

export interface SlackNotificationParams {
  webhookUrl: string
  channel?: string
  notification: {
    type: string
    title: string
    message: string
    actionUrl?: string
    data?: Record<string, any>
  }
}

// ============================================================================
// SLACK MESSAGING
// ============================================================================

/**
 * Send message to Slack webhook
 */
export async function sendSlackMessage(
  webhookUrl: string,
  message: SlackMessage
) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Slack API error: ${response.status} - ${errorText}`)
    }

    logger.info({
      webhookUrl: webhookUrl.substring(0, 50) + '...',
    }, 'Slack message sent successfully')

    return { success: true }
  } catch (error) {
    logger.error({
      error,
      webhookUrl: webhookUrl.substring(0, 50) + '...',
    }, 'Failed to send Slack message')
    throw error
  }
}

/**
 * Send notification to Slack
 */
export async function sendSlackNotification(params: SlackNotificationParams) {
  const { webhookUrl, channel, notification } = params
  const { type, title, message, actionUrl, data } = notification

  const color = getColorForNotificationType(type)
  const emoji = getEmojiForNotificationType(type)

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${title}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    },
  ]

  // Add data fields if present
  if (data && Object.keys(data).length > 0) {
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined && value !== null)
      .slice(0, 4) // Limit to 4 fields
      .map(([key, value]) => ({
        type: 'mrkdwn' as const,
        text: `*${formatFieldName(key)}:*\n${formatFieldValue(value)}`,
      }))

    if (fields.length > 0) {
      blocks.push({
        type: 'section',
        fields,
      })
    }
  }

  // Add action button if URL provided
  if (actionUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Details',
            emoji: true,
          },
          url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${actionUrl}`,
          style: 'primary',
        },
      ],
    })
  }

  const slackMessage: SlackMessage = {
    text: title, // Fallback text
    ...(channel && { channel }),
    blocks,
  }

  return sendSlackMessage(webhookUrl, slackMessage)
}

// ============================================================================
// SPECIALIZED SLACK NOTIFICATIONS
// ============================================================================

/**
 * Send execution complete notification to Slack
 */
export async function sendExecutionCompleteSlack(params: {
  webhookUrl: string
  channel?: string
  batchName: string
  projectName: string
  completedJobs: number
  totalJobs: number
  accuracyPercentage?: number
  executionTimeMs?: number
  batchUrl: string
}) {
  const {
    webhookUrl,
    channel,
    batchName,
    projectName,
    completedJobs,
    totalJobs,
    accuracyPercentage,
    executionTimeMs,
    batchUrl,
  } = params

  const fields: Array<{ type: 'mrkdwn'; text: string }> = [
    {
      type: 'mrkdwn',
      text: `*Project:*\n${projectName}`,
    },
    {
      type: 'mrkdwn',
      text: `*Jobs:*\n${completedJobs}/${totalJobs}`,
    },
  ]

  if (accuracyPercentage !== undefined) {
    fields.push({
      type: 'mrkdwn',
      text: `*Accuracy:*\n${accuracyPercentage.toFixed(1)}%`,
    })
  }

  if (executionTimeMs) {
    const durationMin = Math.round(executionTimeMs / 60000)
    fields.push({
      type: 'mrkdwn',
      text: `*Duration:*\n${durationMin}m`,
    })
  }

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '✅ Execution Complete',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Batch *"${batchName}"* has completed successfully.`,
      },
    },
    {
      type: 'section',
      fields,
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Results',
            emoji: true,
          },
          url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${batchUrl}`,
          style: 'primary',
        },
      ],
    },
  ]

  return sendSlackMessage(webhookUrl, {
    text: `Execution Complete: ${batchName}`,
    ...(channel && { channel }),
    blocks,
  })
}

/**
 * Send execution failed notification to Slack
 */
export async function sendExecutionFailedSlack(params: {
  webhookUrl: string
  channel?: string
  batchName: string
  projectName: string
  errorMessage: string
  jobsFailed?: number
  totalJobs?: number
  batchUrl: string
}) {
  const {
    webhookUrl,
    channel,
    batchName,
    projectName,
    errorMessage,
    jobsFailed,
    totalJobs,
    batchUrl,
  } = params

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '❌ Execution Failed',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Batch *"${batchName}"* in project *"${projectName}"* encountered an error.`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Error:*\n\`\`\`${errorMessage}\`\`\``,
        },
        ...(jobsFailed !== undefined && totalJobs !== undefined
          ? [
              {
                type: 'mrkdwn' as const,
                text: `*Failed Jobs:*\n${jobsFailed}/${totalJobs}`,
              },
            ]
          : []),
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Details',
            emoji: true,
          },
          url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${batchUrl}`,
          style: 'danger',
        },
      ],
    },
  ]

  return sendSlackMessage(webhookUrl, {
    text: `Execution Failed: ${batchName}`,
    ...(channel && { channel }),
    blocks,
  })
}

/**
 * Send accuracy alert to Slack
 */
export async function sendAccuracyAlertSlack(params: {
  webhookUrl: string
  channel?: string
  batchName: string
  projectName: string
  currentAccuracy: number
  threshold: number
  batchUrl: string
}) {
  const {
    webhookUrl,
    channel,
    batchName,
    projectName,
    currentAccuracy,
    threshold,
    batchUrl,
  } = params

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '⚠️ Low Accuracy Alert',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Batch *"${batchName}"* in project *"${projectName}"* has accuracy below threshold.`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Current Accuracy:*\n${currentAccuracy.toFixed(1)}%`,
        },
        {
          type: 'mrkdwn',
          text: `*Threshold:*\n${threshold}%`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Review Batch',
            emoji: true,
          },
          url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${batchUrl}`,
          style: 'danger',
        },
      ],
    },
  ]

  return sendSlackMessage(webhookUrl, {
    text: `Low Accuracy Alert: ${batchName}`,
    ...(channel && { channel }),
    blocks,
  })
}

/**
 * Send system alert to Slack
 */
export async function sendSystemAlertSlack(params: {
  webhookUrl: string
  channel?: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  details?: Record<string, any>
}) {
  const { webhookUrl, channel, title, message, severity, details } = params

  const emoji = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  }[severity]

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${title}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    },
  ]

  if (details && Object.keys(details).length > 0) {
    const fields = Object.entries(details)
      .slice(0, 4)
      .map(([key, value]) => ({
        type: 'mrkdwn' as const,
        text: `*${formatFieldName(key)}:*\n${formatFieldValue(value)}`,
      }))

    blocks.push({
      type: 'section',
      fields,
    })
  }

  return sendSlackMessage(webhookUrl, {
    text: title,
    ...(channel && { channel }),
    blocks,
  })
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get color for notification type
 */
function getColorForNotificationType(type: string): string {
  const colors: Record<string, string> = {
    execution_complete: '#10b981', // green
    execution_failed: '#ef4444', // red
    accuracy_alert: '#f59e0b', // amber
    team_invitation: '#3b82f6', // blue
    system_alert: '#6366f1', // indigo
    batch_ready: '#10b981', // green
    quota_warning: '#f59e0b', // amber
  }

  return colors[type] || '#6b7280' // gray default
}

/**
 * Get emoji for notification type
 */
function getEmojiForNotificationType(type: string): string {
  const emojis: Record<string, string> = {
    execution_complete: '✅',
    execution_failed: '❌',
    accuracy_alert: '⚠️',
    team_invitation: '👋',
    system_alert: '🔔',
    batch_ready: '📋',
    quota_warning: '⚠️',
  }

  return emojis[type] || '📬'
}

/**
 * Format field name for display
 */
function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

/**
 * Format field value for display
 */
function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number') {
    return value.toLocaleString()
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Test Slack webhook connection
 */
export async function testSlackWebhook(webhookUrl: string): Promise<boolean> {
  try {
    await sendSlackMessage(webhookUrl, {
      text: 'Test message from MINO',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ Your Slack integration is working correctly!',
          },
        },
      ],
    })
    return true
  } catch (error) {
    logger.error({ error }, 'Slack webhook test failed')
    return false
  }
}
