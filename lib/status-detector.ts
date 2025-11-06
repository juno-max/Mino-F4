/**
 * Smart Status Detection
 * Analyzes job execution to determine granular status and failure reasons
 */

export type DetailedStatus =
  | 'completed'          // All fields extracted successfully
  | 'partial'            // Some fields extracted, some missing
  | 'blocked'            // Blocked by CAPTCHA, login, etc.
  | 'timeout'            // Execution timed out
  | 'failed'             // Technical error (network, crash)
  | 'validation_failed'  // Data extracted but doesn't match validation
  | 'not_found'          // Page not found / 404

export type BlockedReason =
  | 'captcha'
  | 'login_required'
  | 'paywall'
  | 'geo_blocked'
  | 'rate_limited'
  | 'cloudflare'
  | 'bot_detection'

export type FailureCategory =
  | 'extraction_failed'
  | 'page_error'
  | 'network_error'
  | 'timeout'
  | 'blocked'

export interface StatusDetectionResult {
  detailedStatus: DetailedStatus
  blockedReason?: BlockedReason
  failureCategory?: FailureCategory
  fieldsExtracted: string[]
  fieldsMissing: string[]
  completionPercentage: number
  message: string
}

interface DetectionInput {
  rawOutput?: string | null
  errorMessage?: string | null
  extractedData?: Record<string, any> | null
  expectedFields?: string[]
  screenshots?: Array<{ screenshotUrl: string }> | null
  executionTimeMs?: number | null
  status: string // pending, running, completed, failed
}

/**
 * Detects CAPTCHA presence in logs or screenshots
 */
function detectCAPTCHA(input: DetectionInput): boolean {
  const captchaKeywords = [
    'CAPTCHA',
    'captcha',
    'reCAPTCHA',
    'recaptcha',
    'hCaptcha',
    'hcaptcha',
    'verify you are human',
    'verify you\'re human',
    'I\'m not a robot',
    'prove you are human',
    'security check',
    'cloudflare challenge',
    'cf-challenge',
  ]

  // Check logs
  if (input.rawOutput) {
    for (const keyword of captchaKeywords) {
      if (input.rawOutput.toLowerCase().includes(keyword.toLowerCase())) {
        return true
      }
    }
  }

  // Check error message
  if (input.errorMessage) {
    for (const keyword of captchaKeywords) {
      if (input.errorMessage.toLowerCase().includes(keyword.toLowerCase())) {
        return true
      }
    }
  }

  // TODO: Add image detection for CAPTCHA in screenshots
  // This would require OCR or image classification

  return false
}

/**
 * Detects login/authentication requirement
 */
function detectLoginRequired(input: DetectionInput): boolean {
  const loginKeywords = [
    'login required',
    'sign in required',
    'please log in',
    'please sign in',
    'authentication required',
    'you must be logged in',
    'unauthorized',
    '401',
    'forbidden',
    '403',
    'access denied',
  ]

  const text = `${input.rawOutput || ''} ${input.errorMessage || ''}`.toLowerCase()

  return loginKeywords.some(keyword => text.includes(keyword))
}

/**
 * Detects paywall or premium content
 */
function detectPaywall(input: DetectionInput): boolean {
  const paywallKeywords = [
    'paywall',
    'subscription required',
    'premium content',
    'subscriber only',
    'subscribe to read',
    'become a member',
  ]

  const text = `${input.rawOutput || ''} ${input.errorMessage || ''}`.toLowerCase()

  return paywallKeywords.some(keyword => text.includes(keyword))
}

/**
 * Detects geo-blocking
 */
function detectGeoBlocked(input: DetectionInput): boolean {
  const geoKeywords = [
    'not available in your region',
    'not available in your country',
    'geo-blocked',
    'geoblocked',
    'geographic restriction',
    'content not available',
  ]

  const text = `${input.rawOutput || ''} ${input.errorMessage || ''}`.toLowerCase()

  return geoKeywords.some(keyword => text.includes(keyword))
}

/**
 * Detects rate limiting
 */
function detectRateLimited(input: DetectionInput): boolean {
  const rateKeywords = [
    'rate limit',
    'too many requests',
    '429',
    'slow down',
    'try again later',
  ]

  const text = `${input.rawOutput || ''} ${input.errorMessage || ''}`.toLowerCase()

  return rateKeywords.some(keyword => text.includes(keyword))
}

/**
 * Detects Cloudflare or bot detection
 */
function detectCloudflare(input: DetectionInput): boolean {
  const cloudflareKeywords = [
    'cloudflare',
    'cf-ray',
    'checking your browser',
    'please wait while we check',
    'ddos protection',
    'bot detection',
  ]

  const text = `${input.rawOutput || ''} ${input.errorMessage || ''}`.toLowerCase()

  return cloudflareKeywords.some(keyword => text.includes(keyword))
}

/**
 * Detects timeout
 */
function detectTimeout(input: DetectionInput): boolean {
  const timeoutKeywords = [
    'timeout',
    'timed out',
    'execution timeout',
    'navigation timeout',
  ]

  const text = `${input.rawOutput || ''} ${input.errorMessage || ''}`.toLowerCase()

  if (timeoutKeywords.some(keyword => text.includes(keyword))) {
    return true
  }

  // Check if execution took longer than 5 minutes (likely timeout)
  if (input.executionTimeMs && input.executionTimeMs > 300000) {
    return true
  }

  return false
}

/**
 * Detects 404 or page not found
 */
function detectNotFound(input: DetectionInput): boolean {
  const notFoundKeywords = [
    '404',
    'not found',
    'page not found',
    'page does not exist',
    'page doesn\'t exist',
  ]

  const text = `${input.rawOutput || ''} ${input.errorMessage || ''}`.toLowerCase()

  return notFoundKeywords.some(keyword => text.includes(keyword))
}

/**
 * Main status detection function
 */
export function detectJobStatus(input: DetectionInput): StatusDetectionResult {
  const expectedFields = input.expectedFields || []
  const extractedData = input.extractedData || {}
  const extractedFields = Object.keys(extractedData).filter(
    key => extractedData[key] !== null && extractedData[key] !== undefined && extractedData[key] !== ''
  )
  const missingFields = expectedFields.filter(field => !extractedFields.includes(field))
  const completionPercentage = expectedFields.length > 0
    ? Math.round((extractedFields.length / expectedFields.length) * 100)
    : 0

  // Check for blocking issues first
  if (detectCAPTCHA(input)) {
    return {
      detailedStatus: 'blocked',
      blockedReason: 'captcha',
      failureCategory: 'blocked',
      fieldsExtracted: extractedFields,
      fieldsMissing: missingFields,
      completionPercentage,
      message: 'Extraction blocked by CAPTCHA challenge',
    }
  }

  if (detectLoginRequired(input)) {
    return {
      detailedStatus: 'blocked',
      blockedReason: 'login_required',
      failureCategory: 'blocked',
      fieldsExtracted: extractedFields,
      fieldsMissing: missingFields,
      completionPercentage,
      message: 'Site requires authentication',
    }
  }

  if (detectPaywall(input)) {
    return {
      detailedStatus: 'blocked',
      blockedReason: 'paywall',
      failureCategory: 'blocked',
      fieldsExtracted: extractedFields,
      fieldsMissing: missingFields,
      completionPercentage,
      message: 'Content is behind paywall',
    }
  }

  if (detectGeoBlocked(input)) {
    return {
      detailedStatus: 'blocked',
      blockedReason: 'geo_blocked',
      failureCategory: 'blocked',
      fieldsExtracted: extractedFields,
      fieldsMissing: missingFields,
      completionPercentage,
      message: 'Content not available in this region',
    }
  }

  if (detectRateLimited(input)) {
    return {
      detailedStatus: 'blocked',
      blockedReason: 'rate_limited',
      failureCategory: 'blocked',
      fieldsExtracted: extractedFields,
      fieldsMissing: missingFields,
      completionPercentage,
      message: 'Rate limit exceeded',
    }
  }

  if (detectCloudflare(input)) {
    return {
      detailedStatus: 'blocked',
      blockedReason: 'cloudflare',
      failureCategory: 'blocked',
      fieldsExtracted: extractedFields,
      fieldsMissing: missingFields,
      completionPercentage,
      message: 'Blocked by Cloudflare or bot detection',
    }
  }

  // Check for timeouts
  if (detectTimeout(input)) {
    return {
      detailedStatus: 'timeout',
      failureCategory: 'timeout',
      fieldsExtracted: extractedFields,
      fieldsMissing: missingFields,
      completionPercentage,
      message: 'Execution timed out',
    }
  }

  // Check for 404
  if (detectNotFound(input)) {
    return {
      detailedStatus: 'not_found',
      failureCategory: 'page_error',
      fieldsExtracted: extractedFields,
      fieldsMissing: missingFields,
      completionPercentage,
      message: 'Page not found (404)',
    }
  }

  // Check extraction completeness
  if (expectedFields.length > 0) {
    if (extractedFields.length === 0) {
      // No data extracted
      return {
        detailedStatus: 'failed',
        failureCategory: 'extraction_failed',
        fieldsExtracted: [],
        fieldsMissing: expectedFields,
        completionPercentage: 0,
        message: 'No data was extracted',
      }
    } else if (missingFields.length > 0) {
      // Partial extraction
      return {
        detailedStatus: 'partial',
        fieldsExtracted: extractedFields,
        fieldsMissing: missingFields,
        completionPercentage,
        message: `Extracted ${extractedFields.length} of ${expectedFields.length} fields`,
      }
    } else {
      // Complete extraction
      return {
        detailedStatus: 'completed',
        fieldsExtracted: extractedFields,
        fieldsMissing: [],
        completionPercentage: 100,
        message: 'All fields extracted successfully',
      }
    }
  }

  // No expected fields defined - check if any data was extracted
  if (extractedFields.length > 0) {
    return {
      detailedStatus: 'completed',
      fieldsExtracted: extractedFields,
      fieldsMissing: [],
      completionPercentage: 100,
      message: `Extracted ${extractedFields.length} fields`,
    }
  }

  // Failed - no data and no specific reason
  if (input.status === 'failed' || input.errorMessage) {
    return {
      detailedStatus: 'failed',
      failureCategory: 'extraction_failed',
      fieldsExtracted: [],
      fieldsMissing: expectedFields,
      completionPercentage: 0,
      message: input.errorMessage || 'Extraction failed',
    }
  }

  // Default
  return {
    detailedStatus: 'failed',
    fieldsExtracted: [],
    fieldsMissing: expectedFields,
    completionPercentage: 0,
    message: 'Unknown error',
  }
}

/**
 * Get expected fields from batch column schema
 */
export function getExpectedFieldsFromSchema(columnSchema: Array<{ name: string; isGroundTruth?: boolean }>): string[] {
  return columnSchema
    .filter(col => col.isGroundTruth === true || col.isGroundTruth === undefined)
    .map(col => col.name)
}
