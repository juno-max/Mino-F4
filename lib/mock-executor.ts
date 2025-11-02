// Mock execution engine - simulates 60-75% baseline accuracy

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
}

const FAILURE_CATEGORIES = [
  'element_not_found',
  'timeout',
  'incorrect_format',
  'missing_data',
  'navigation_error',
]

const FAILURE_REASONS = [
  'Could not find pricing element on page',
  'Page load timeout after 30 seconds',
  'Price format not recognized',
  'Field missing from page',
  'Navigation failed - 404 error',
  'Element selector changed',
  'Data extraction returned empty',
]

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain.split('.')[0]
  } catch {
    return 'unknown'
  }
}

function generateMockValue(column: ColumnSchema): any {
  if (column.type === 'number') {
    return randomBetween(10, 999)
  }
  if (column.type === 'url') {
    return 'https://example.com/pricing'
  }
  // text
  const samples = ['$99/mo', 'Standard Plan', 'Available', 'Yes', 'Contact Sales']
  return randomChoice(samples)
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

export async function executeMockWorkflow(
  siteUrl: string,
  columnSchema: ColumnSchema[],
  groundTruthData: Record<string, any> | null
): Promise<ExecutionResult> {
  // Simulate 1-3 second execution time
  const executionTime = randomBetween(1000, 3000)
  await sleep(executionTime)

  const siteName = extractDomain(siteUrl)

  // 60-75% baseline accuracy
  const accuracyRoll = Math.random()

  // 15-25% chance of complete failure
  if (accuracyRoll > 0.85) {
    return {
      siteUrl,
      siteName,
      extractedData: {},
      groundTruthData,
      isAccurate: false,
      matchPercentage: 0,
      failureReason: randomChoice(FAILURE_REASONS),
      failureCategory: randomChoice(FAILURE_CATEGORIES),
      executionTimeMs: executionTime,
    }
  }

  // Extract data
  const extractedData: Record<string, any> = {}
  const dataColumns = columnSchema.filter(col => !col.isGroundTruth && !col.isUrl)

  for (const column of dataColumns) {
    // 70% chance to extract this field
    if (Math.random() < 0.7) {
      // If we have ground truth, sometimes match it, sometimes don't
      if (groundTruthData && column.name in groundTruthData) {
        // 65% chance to match ground truth exactly
        if (Math.random() < 0.65) {
          extractedData[column.name] = groundTruthData[column.name]
        } else {
          // Extract something different (partial match or wrong value)
          if (Math.random() < 0.5) {
            // Partial match
            const gtValue = String(groundTruthData[column.name])
            extractedData[column.name] = gtValue.substring(0, Math.floor(gtValue.length / 2))
          } else {
            // Wrong value
            extractedData[column.name] = generateMockValue(column)
          }
        }
      } else {
        // No ground truth, generate mock value
        extractedData[column.name] = generateMockValue(column)
      }
    }
    // 30% chance field is missing/not extracted
  }

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
      isAccurate = matchPercentage >= 90 // Consider 90%+ as accurate
    }
  }

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
  }
}

export async function executeBatchMock(
  sites: Array<{ url: string; data: Record<string, any> }>,
  columnSchema: ColumnSchema[],
  onProgress?: (completed: number, total: number) => void
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
      // Map GT column to actual column (remove gt_ prefix)
      const actualColumnName = col.name.replace(/^gt_/i, '').replace(/_gt$/i, '')
      groundTruthData[actualColumnName] = site.data[col.name]
    }

    const result = await executeMockWorkflow(
      siteUrl,
      columnSchema,
      Object.keys(groundTruthData).length > 0 ? groundTruthData : null
    )

    results.push(result)

    if (onProgress) {
      onProgress(i + 1, sites.length)
    }
  }

  return results
}
