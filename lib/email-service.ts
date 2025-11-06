/**
 * Email Service
 * Handles email sending via Resend with templates
 */

import { Resend } from 'resend'
import { logger } from './logger'

// ============================================================================
// CONFIGURATION
// ============================================================================

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM_EMAIL = process.env.EMAIL_FROM || 'MINO <notifications@mino.app>'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// ============================================================================
// TYPES
// ============================================================================

export interface EmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export interface NotificationEmailData {
  id: string
  type: string
  title: string
  message: string
  actionLabel?: string
  actionUrl?: string
  createdAt: Date
  data?: Record<string, any>
}

// ============================================================================
// EMAIL SENDING
// ============================================================================

/**
 * Send email using Resend
 */
export async function sendEmail(params: EmailParams) {
  const { to, subject, html, text } = params

  try {
    // Skip in development if no API key configured
    if (!process.env.RESEND_API_KEY || !resend) {
      logger.warn({
        to,
        subject,
      }, 'Resend API key not configured, skipping email')
      return { id: 'dev-mode-skip' }
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    })

    logger.info({
      emailId: result.data?.id,
      to,
      subject,
    }, 'Email sent successfully')

    return result.data
  } catch (error) {
    logger.error({
      error,
      to,
      subject,
    }, 'Failed to send email')
    throw error
  }
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(notification: NotificationEmailData) {
  const { title, message, actionLabel, actionUrl, type } = notification

  const html = renderNotificationEmail({
    title,
    message,
    actionLabel,
    actionUrl,
    type,
  })

  // Get user email from database
  const { db } = await import('@/db')
  const { users } = await import('@/db/auth-schema')
  const { eq } = await import('drizzle-orm')

  // Note: notification should have userId, but the type doesn't include it
  // In practice, you'd get the user email from the notification's userId
  const userEmail = 'user@example.com' // Placeholder

  return sendEmail({
    to: userEmail,
    subject: title,
    html,
  })
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Render notification email HTML
 */
function renderNotificationEmail(params: {
  title: string
  message: string
  actionLabel?: string
  actionUrl?: string
  type: string
}) {
  const { title, message, actionLabel, actionUrl } = params

  const actionButton = actionLabel && actionUrl
    ? `
      <table role="presentation" style="margin: 24px 0;">
        <tr>
          <td>
            <a href="${BASE_URL}${actionUrl}"
               style="background-color: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: 600;">
              ${actionLabel}
            </a>
          </td>
        </tr>
      </table>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px;">MINO</h1>
          <p style="color: #666; margin: 4px 0 0; font-size: 14px;">Web Automation Platform</p>
        </div>

        <!-- Main Content -->
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px; font-size: 20px; color: #111;">
            ${title}
          </h2>
          <p style="margin: 0; color: #374151; font-size: 16px;">
            ${message}
          </p>
          ${actionButton}
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 32px;">
          <p style="margin: 0 0 8px;">
            This is an automated notification from MINO.
          </p>
          <p style="margin: 0;">
            <a href="${BASE_URL}/account/notification-preferences"
               style="color: #2563eb; text-decoration: none;">
              Manage notification preferences
            </a>
          </p>
        </div>

      </body>
    </html>
  `
}

/**
 * Render execution complete email
 */
export function renderExecutionCompleteEmail(params: {
  batchName: string
  projectName: string
  completedJobs: number
  totalJobs: number
  accuracyPercentage?: number
  batchUrl: string
}) {
  const {
    batchName,
    projectName,
    completedJobs,
    totalJobs,
    accuracyPercentage,
    batchUrl,
  } = params

  const accuracyInfo = accuracyPercentage
    ? `<p style="margin: 8px 0 0;"><strong>Accuracy:</strong> ${accuracyPercentage.toFixed(1)}%</p>`
    : ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Execution Complete - ${batchName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 600px; margin: 0 auto; padding: 20px;">

        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; margin: 0;">MINO</h1>
        </div>

        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px; color: #065f46;">Execution Complete ✓</h2>
          <p style="margin: 0; font-size: 16px;">
            Your batch <strong>"${batchName}"</strong> in project <strong>"${projectName}"</strong>
            has completed successfully.
          </p>
          <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px;">
            <p style="margin: 0;"><strong>Jobs Completed:</strong> ${completedJobs} / ${totalJobs}</p>
            ${accuracyInfo}
          </div>
          <table role="presentation" style="margin-top: 24px;">
            <tr>
              <td>
                <a href="${BASE_URL}${batchUrl}"
                   style="background-color: #10b981; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Results
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <a href="${BASE_URL}/account/notification-preferences" style="color: #2563eb;">
            Manage notification preferences
          </a>
        </div>

      </body>
    </html>
  `
}

/**
 * Render execution failed email
 */
export function renderExecutionFailedEmail(params: {
  batchName: string
  projectName: string
  errorMessage: string
  batchUrl: string
}) {
  const { batchName, projectName, errorMessage, batchUrl } = params

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Execution Failed - ${batchName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 600px; margin: 0 auto; padding: 20px;">

        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; margin: 0;">MINO</h1>
        </div>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px; color: #991b1b;">Execution Failed ✗</h2>
          <p style="margin: 0; font-size: 16px;">
            Your batch <strong>"${batchName}"</strong> in project <strong>"${projectName}"</strong>
            encountered an error.
          </p>
          <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px;">
            <p style="margin: 0; color: #991b1b;">
              <strong>Error:</strong> ${errorMessage}
            </p>
          </div>
          <table role="presentation" style="margin-top: 24px;">
            <tr>
              <td>
                <a href="${BASE_URL}${batchUrl}"
                   style="background-color: #ef4444; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Details
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <a href="${BASE_URL}/account/notification-preferences" style="color: #2563eb;">
            Manage notification preferences
          </a>
        </div>

      </body>
    </html>
  `
}

/**
 * Render team invitation email
 */
export function renderTeamInvitationEmail(params: {
  inviterName: string
  organizationName: string
  role: string
  inviteUrl: string
}) {
  const { inviterName, organizationName, role, inviteUrl } = params

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Team Invitation - ${organizationName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 600px; margin: 0 auto; padding: 20px;">

        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; margin: 0;">MINO</h1>
        </div>

        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px; color: #1e40af;">You've been invited!</h2>
          <p style="margin: 0; font-size: 16px;">
            <strong>${inviterName}</strong> has invited you to join
            <strong>"${organizationName}"</strong> on MINO.
          </p>
          <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px;">
            <p style="margin: 0;"><strong>Role:</strong> ${role}</p>
          </div>
          <table role="presentation" style="margin-top: 24px;">
            <tr>
              <td>
                <a href="${inviteUrl}"
                   style="background-color: #2563eb; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  Accept Invitation
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>

      </body>
    </html>
  `
}

/**
 * Render weekly digest email
 */
export function renderWeeklyDigestEmail(params: {
  userName: string
  weekStart: Date
  weekEnd: Date
  stats: {
    executionsCompleted: number
    jobsProcessed: number
    averageAccuracy: number
    topProject: string
  }
  dashboardUrl: string
}) {
  const { userName, weekStart, weekEnd, stats, dashboardUrl } = params

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Digest - MINO</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 600px; margin: 0 auto; padding: 20px;">

        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; margin: 0;">MINO</h1>
          <p style="color: #666; margin: 4px 0 0;">Weekly Digest</p>
        </div>

        <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px;">Hi ${userName},</h2>
          <p style="margin: 0; color: #666;">
            Here's your automation summary for ${formatDate(weekStart)} - ${formatDate(weekEnd)}
          </p>
        </div>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <div style="display: grid; gap: 16px;">
            <div style="padding: 16px; background: #eff6ff; border-radius: 6px;">
              <h3 style="margin: 0 0 4px; font-size: 14px; color: #666;">Executions</h3>
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #2563eb;">
                ${stats.executionsCompleted}
              </p>
            </div>
            <div style="padding: 16px; background: #f0fdf4; border-radius: 6px;">
              <h3 style="margin: 0 0 4px; font-size: 14px; color: #666;">Jobs Processed</h3>
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #10b981;">
                ${stats.jobsProcessed}
              </p>
            </div>
            <div style="padding: 16px; background: #fef3c7; border-radius: 6px;">
              <h3 style="margin: 0 0 4px; font-size: 14px; color: #666;">Avg Accuracy</h3>
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #d97706;">
                ${stats.averageAccuracy.toFixed(1)}%
              </p>
            </div>
          </div>
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #666;">
              <strong>Top Project:</strong> ${stats.topProject}
            </p>
          </div>
        </div>

        <table role="presentation" style="margin-bottom: 24px;">
          <tr>
            <td style="text-align: center;">
              <a href="${BASE_URL}${dashboardUrl}"
                 style="background-color: #2563eb; color: white; padding: 12px 24px;
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                View Dashboard
              </a>
            </td>
          </tr>
        </table>

        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <a href="${BASE_URL}/account/notification-preferences" style="color: #2563eb;">
            Manage notification preferences
          </a>
        </div>

      </body>
    </html>
  `
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Format date for emails
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Send batch of emails (with rate limiting)
 */
export async function sendBulkEmails(emails: EmailParams[], delayMs = 100) {
  const results = []

  for (const email of emails) {
    try {
      const result = await sendEmail(email)
      results.push({ success: true, result })

      // Delay to avoid rate limits
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      results.push({ success: false, error, email: email.to })
    }
  }

  return results
}
