/**
 * CSV Analyzer - Auto-detect column types, URLs, emails, etc.
 */

export interface ColumnAnalysis {
  name: string
  detectedType: 'url' | 'email' | 'price' | 'date' | 'phone' | 'number' | 'boolean' | 'string'
  isGroundTruth: boolean
  isRequired: boolean
  sampleValues: string[]
  confidence: number
  validation: {
    hasNulls: boolean
    hasDuplicates: boolean
    urlStatus?: '200' | '404' | 'error'
  }
}

export interface CSVAnalysis {
  totalRows: number
  columns: ColumnAnalysis[]
  suggestedBatchName: string
  dataQuality: {
    score: number
    issues: string[]
    warnings: string[]
  }
}

/**
 * Analyze CSV data and detect column types
 */
export function analyzeCSV(
  filename: string,
  headers: string[],
  rows: Record<string, any>[]
): CSVAnalysis {
  const columns: ColumnAnalysis[] = headers.map(header => {
    const values = rows.map(row => String(row[header] || ''))
    const nonEmptyValues = values.filter(v => v.trim())

    return {
      name: header,
      detectedType: detectColumnType(header, nonEmptyValues),
      isGroundTruth: isGroundTruthColumn(header),
      isRequired: !values.some(v => !v.trim()),
      sampleValues: nonEmptyValues.slice(0, 3),
      confidence: calculateConfidence(header, nonEmptyValues),
      validation: {
        hasNulls: values.length !== nonEmptyValues.length,
        hasDuplicates: new Set(nonEmptyValues).size !== nonEmptyValues.length,
      },
    }
  })

  const suggestedBatchName = generateBatchName(filename)
  const dataQuality = assessDataQuality(columns, rows)

  return {
    totalRows: rows.length,
    columns,
    suggestedBatchName,
    dataQuality,
  }
}

/**
 * Detect column type based on name and sample values
 */
function detectColumnType(
  columnName: string,
  values: string[]
): ColumnAnalysis['detectedType'] {
  const name = columnName.toLowerCase()
  const sample = values.slice(0, 10)

  // URL detection
  if (
    name.includes('url') ||
    name.includes('website') ||
    name.includes('link') ||
    sample.some(v => /^https?:\/\//.test(v))
  ) {
    return 'url'
  }

  // Email detection
  if (
    name.includes('email') ||
    name.includes('e-mail') ||
    sample.some(v => /@/.test(v) && /\./.test(v))
  ) {
    return 'email'
  }

  // Phone detection
  if (
    name.includes('phone') ||
    name.includes('tel') ||
    sample.some(v => /[\d\s\-\(\)]{7,}/.test(v))
  ) {
    return 'phone'
  }

  // Price detection
  if (
    name.includes('price') ||
    name.includes('cost') ||
    name.includes('amount') ||
    sample.some(v => /^\$?[\d,]+\.?\d*$/.test(v))
  ) {
    return 'price'
  }

  // Date detection
  if (
    name.includes('date') ||
    name.includes('time') ||
    sample.some(v => /\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/.test(v))
  ) {
    return 'date'
  }

  // Number detection
  if (
    name.includes('count') ||
    name.includes('num') ||
    name.includes('rating') ||
    sample.every(v => !isNaN(Number(v)))
  ) {
    return 'number'
  }

  // Boolean detection
  if (
    name.includes('is_') ||
    name.includes('has_') ||
    sample.every(v => ['true', 'false', 'yes', 'no', '0', '1'].includes(v.toLowerCase()))
  ) {
    return 'boolean'
  }

  return 'string'
}

/**
 * Check if column is ground truth
 */
function isGroundTruthColumn(columnName: string): boolean {
  const name = columnName.toLowerCase()
  return (
    name.startsWith('gt_') ||
    name.endsWith('_gt') ||
    name.includes('expected') ||
    name.includes('ground_truth') ||
    name.includes('truth')
  )
}

/**
 * Calculate confidence score for type detection
 */
function calculateConfidence(columnName: string, values: string[]): number {
  const detectedType = detectColumnType(columnName, values)
  const sample = values.slice(0, 20)

  let matchCount = 0

  sample.forEach(value => {
    const matches =
      (detectedType === 'url' && /^https?:\/\//.test(value)) ||
      (detectedType === 'email' && /@/.test(value)) ||
      (detectedType === 'price' && /^\$?[\d,]+\.?\d*$/.test(value)) ||
      (detectedType === 'number' && !isNaN(Number(value))) ||
      (detectedType === 'boolean' && ['true', 'false', 'yes', 'no', '0', '1'].includes(value.toLowerCase()))

    if (matches) matchCount++
  })

  return Math.min(100, Math.round((matchCount / sample.length) * 100))
}

/**
 * Generate batch name from filename
 */
function generateBatchName(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.csv$/i, '')

  // Remove common prefixes/suffixes
  const cleaned = nameWithoutExt
    .replace(/^batch_/i, '')
    .replace(/^data_/i, '')
    .replace(/_\d{4}-\d{2}-\d{2}$/i, '')

  // Capitalize words
  return cleaned
    .split(/[_\-\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Assess overall data quality
 */
function assessDataQuality(
  columns: ColumnAnalysis[],
  rows: Record<string, any>[]
): CSVAnalysis['dataQuality'] {
  const issues: string[] = []
  const warnings: string[] = []

  // Check for required columns
  const hasUrlColumn = columns.some(c => c.detectedType === 'url')
  if (!hasUrlColumn) {
    warnings.push('No URL column detected - agents may not know what websites to visit')
  }

  // Check for ground truth
  const hasGroundTruth = columns.some(c => c.isGroundTruth)
  if (!hasGroundTruth) {
    warnings.push('No ground truth columns detected - accuracy cannot be measured')
  }

  // Check for nulls
  columns.forEach(col => {
    if (col.validation.hasNulls && col.isRequired) {
      issues.push(`Column "${col.name}" has missing values`)
    }
  })

  // Check row count
  if (rows.length < 5) {
    warnings.push('Very small dataset - consider adding more rows for better results')
  }

  if (rows.length > 1000) {
    warnings.push('Large dataset - consider running a test batch first')
  }

  // Calculate score
  const score = Math.max(
    0,
    100 -
      issues.length * 20 -
      warnings.length * 5
  )

  return { score, issues, warnings }
}
