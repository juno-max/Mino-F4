import { chromium } from 'playwright'
import { wrap, configure } from 'agentql'

interface ColumnSchema {
  name: string
  type: 'text' | 'number' | 'url'
  isGroundTruth: boolean
  isUrl: boolean
}

interface ExecutionResult {
  siteUrl: string
  siteName: string | null
  extractedData: Record<string, any>
  groundTruthData: Record<string, any> | null
  isAccurate: boolean | null
  matchPercentage: number | null
  failureReason: string | null
  failureCategory: string | null
  executionTimeMs: number
  screenshots?: Array<{
    timestamp: string
    title: string
    description: string
    screenshotUrl: string
  }>
}

interface ToolCallUpdate {
  id: string
  action: string
  timestamp: string
  description: string
  status: 'pending' | 'completed' | 'failed'
  screenshot?: string
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain.split('.')[0]
  } catch {
    return 'unknown'
  }
}

function compareValues(extracted: any, groundTruth: any): boolean {
  if (extracted == null && groundTruth == null) return true
  if (extracted == null || groundTruth == null) return false

  const extractedStr = String(extracted).toLowerCase().trim()
  const gtStr = String(groundTruth).toLowerCase().trim()

  // Exact match
  if (extractedStr === gtStr) return true

  // Fuzzy match - contains or partial
  if (extractedStr.includes(gtStr) || gtStr.includes(extractedStr)) return true

  return false
}

/**
 * Execute a workflow using AgentQL to extract data from a website
 */
export async function executeAgentQLWorkflow(
  siteUrl: string,
  goal: string,
  columnSchema: ColumnSchema[],
  groundTruthData: Record<string, any> | null,
  onToolCall?: (toolCall: ToolCallUpdate) => void,
  onScreenshot?: (screenshot: string, description: string) => void
): Promise<ExecutionResult> {
  const startTime = Date.now()
  const siteName = extractDomain(siteUrl)
  const screenshots: Array<{
    timestamp: string
    title: string
    description: string
    screenshotUrl: string
  }> = []

  let browser
  let page

  try {
    // Check for API key
    if (!process.env.AGENTQL_API_KEY) {
      throw new Error('AGENTQL_API_KEY environment variable is not set')
    }

    // Configure AgentQL with API key
    configure({ apiKey: process.env.AGENTQL_API_KEY })

    // Launch browser
    onToolCall?.({
      id: '1',
      action: 'Browser Launch',
      timestamp: formatTimestamp(Date.now() - startTime),
      description: 'Launching browser...',
      status: 'pending',
    })

    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext()
    page = await wrap(await context.newPage())

    onToolCall?.({
      id: '1',
      action: 'Browser Launch',
      timestamp: formatTimestamp(Date.now() - startTime),
      description: 'Browser launched successfully',
      status: 'completed',
    })

    // Navigate to the site
    onToolCall?.({
      id: '2',
      action: 'Navigation',
      timestamp: formatTimestamp(Date.now() - startTime),
      description: `Navigating to ${siteUrl}...`,
      status: 'pending',
    })

    await page.goto(siteUrl, { timeout: 30000, waitUntil: 'domcontentloaded' })

    // Capture screenshot
    const navScreenshot = await page.screenshot({ type: 'png', fullPage: false })
    const navScreenshotBase64 = `data:image/png;base64,${navScreenshot.toString('base64')}`
    screenshots.push({
      timestamp: formatTimestamp(Date.now() - startTime),
      title: 'Navigation',
      description: 'Navigated to homepage',
      screenshotUrl: navScreenshotBase64,
    })

    onToolCall?.({
      id: '2',
      action: 'Navigation',
      timestamp: formatTimestamp(Date.now() - startTime),
      description: `Navigated to ${siteUrl}`,
      status: 'completed',
      screenshot: navScreenshotBase64,
    })

    // Build AgentQL query based on column schema
    onToolCall?.({
      id: '3',
      action: 'Data Extraction',
      timestamp: formatTimestamp(Date.now() - startTime),
      description: 'Extracting data using AgentQL...',
      status: 'pending',
    })

    const dataColumns = columnSchema.filter(col => !col.isGroundTruth && !col.isUrl)
    const extractedData: Record<string, any> = {}

    // Build AgentQL query for data extraction
    // Format: { fieldName1 fieldName2 fieldName3 }
    const queryFields = dataColumns.map(col => {
      // Add type hints for better extraction
      if (col.type === 'number') {
        return `${col.name}(number)`
      }
      return col.name
    }).join('\n      ')

    const query = `
{
  ${queryFields}
}
`.trim()

    try {
      // Use AgentQL's queryData for structured data extraction
      console.log('AgentQL Query:', query)
      console.log('Goal:', goal)

      const result = await page.queryData(query)
      console.log('AgentQL Result:', result)

      // Extract data from the result
      for (const column of dataColumns) {
        if (result && result[column.name] !== undefined) {
          extractedData[column.name] = result[column.name]
        } else {
          extractedData[column.name] = null
        }
      }

      // Capture extraction screenshot
      const extractionScreenshot = await page.screenshot({ type: 'png', fullPage: false })
      const extractionScreenshotBase64 = `data:image/png;base64,${extractionScreenshot.toString('base64')}`
      screenshots.push({
        timestamp: formatTimestamp(Date.now() - startTime),
        title: 'Data Extraction',
        description: 'Extracted pricing data',
        screenshotUrl: extractionScreenshotBase64,
      })

      onToolCall?.({
        id: '3',
        action: 'Data Extraction',
        timestamp: formatTimestamp(Date.now() - startTime),
        description: 'Data extracted successfully',
        status: 'completed',
        screenshot: extractionScreenshotBase64,
      })

      // Verification step
      onToolCall?.({
        id: '4',
        action: 'Verification',
        timestamp: formatTimestamp(Date.now() - startTime),
        description: 'Verifying extracted data...',
        status: 'completed',
      })

      // Calculate accuracy if we have ground truth
      let isAccurate: boolean | null = null
      let matchPercentage: number | null = null

      if (groundTruthData) {
        const gtFields = Object.keys(groundTruthData).filter(key =>
          columnSchema.some(col => col.name === key && !col.isUrl)
        )

        if (gtFields.length > 0) {
          let matches = 0
          for (const field of gtFields) {
            if (compareValues(extractedData[field], groundTruthData[field])) {
              matches++
            }
          }

          matchPercentage = Math.round((matches / gtFields.length) * 100)
          isAccurate = matchPercentage >= 90
        }
      }

      // Final output
      onToolCall?.({
        id: '5',
        action: 'Final Output',
        timestamp: formatTimestamp(Date.now() - startTime),
        description: 'Generated final output',
        status: 'completed',
      })

      const executionTime = Date.now() - startTime

      await browser.close()

      return {
        siteUrl,
        siteName,
        extractedData,
        groundTruthData,
        isAccurate,
        matchPercentage,
        failureReason: null,
        failureCategory: null,
        executionTimeMs: executionTime,
        screenshots,
      }
    } catch (error: any) {
      console.error('AgentQL extraction error:', error)

      onToolCall?.({
        id: '3',
        action: 'Data Extraction',
        timestamp: formatTimestamp(Date.now() - startTime),
        description: `Failed: ${error.message}`,
        status: 'failed',
      })

      const executionTime = Date.now() - startTime
      await browser?.close()

      return {
        siteUrl,
        siteName,
        extractedData: {},
        groundTruthData,
        isAccurate: false,
        matchPercentage: 0,
        failureReason: error.message || 'Data extraction failed',
        failureCategory: 'extraction_error',
        executionTimeMs: executionTime,
        screenshots,
      }
    }
  } catch (error: any) {
    console.error('AgentQL workflow error:', error)

    const executionTime = Date.now() - startTime

    if (browser) {
      await browser.close()
    }

    return {
      siteUrl,
      siteName,
      extractedData: {},
      groundTruthData,
      isAccurate: false,
      matchPercentage: 0,
      failureReason: error.message || 'Workflow execution failed',
      failureCategory: determineFailureCategory(error),
      executionTimeMs: executionTime,
      screenshots,
    }
  }
}

/**
 * Execute a batch of workflows using AgentQL
 */
export async function executeAgentQLBatch(
  sites: Array<{ url: string; data: Record<string, any> }>,
  goal: string,
  columnSchema: ColumnSchema[],
  onProgress?: (completed: number, total: number) => void,
  onToolCall?: (siteIndex: number, toolCall: ToolCallUpdate) => void
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = []

  for (let i = 0; i < sites.length; i++) {
    const site = sites[i]
    const urlColumn = columnSchema.find(col => col.isUrl)
    const siteUrl = urlColumn ? site.data[urlColumn.name] : site.url

    // Extract ground truth data
    const gtColumns = columnSchema.filter(col => col.isGroundTruth)
    const groundTruthData: Record<string, any> = {}
    for (const col of gtColumns) {
      const actualColumnName = col.name.replace(/^gt_/i, '').replace(/_gt$/i, '')
      groundTruthData[actualColumnName] = site.data[col.name]
    }

    const result = await executeAgentQLWorkflow(
      siteUrl,
      goal,
      columnSchema,
      Object.keys(groundTruthData).length > 0 ? groundTruthData : null,
      onToolCall ? (toolCall) => onToolCall(i, toolCall) : undefined
    )

    results.push(result)

    if (onProgress) {
      onProgress(i + 1, sites.length)
    }
  }

  return results
}

function formatTimestamp(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

function determineFailureCategory(error: any): string {
  const message = error.message?.toLowerCase() || ''

  if (message.includes('timeout')) return 'timeout'
  if (message.includes('navigation')) return 'navigation_error'
  if (message.includes('not found') || message.includes('404')) return 'page_not_found'
  if (message.includes('element')) return 'element_not_found'

  return 'unknown_error'
}
