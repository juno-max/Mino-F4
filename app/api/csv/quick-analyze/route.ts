import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

/**
 * POST /api/csv/quick-analyze
 * Instantly analyzes CSV file and returns column detection results
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()

    // Parse CSV
    let records: any[]
    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse CSV. Please check file format.' },
        { status: 400 }
      )
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      )
    }

    // Analyze columns
    const columnNames = Object.keys(records[0])
    const columns = columnNames.map((name) => {
      const sampleValues = records.slice(0, 3).map((r) => String(r[name] || ''))

      return {
        name,
        type: detectColumnType(name, sampleValues),
        isUrl: isUrlColumn(name),
        isGroundTruth: isGroundTruthColumn(name),
        sampleValues,
      }
    })

    // Find URL column
    const urlColumn = columns.find((c) => c.isUrl)?.name || null

    if (!urlColumn) {
      return NextResponse.json(
        {
          error: 'No URL column detected. Please include a column named "url", "website", "site", or "link"'
        },
        { status: 400 }
      )
    }

    // Find ground truth columns
    const groundTruthColumns = columns
      .filter((c) => c.isGroundTruth)
      .map((c) => c.name)

    // Calculate estimates
    const rowCount = records.length
    const testCount = Math.min(10, rowCount)
    const estimatedDuration = estimateDuration(testCount)
    const estimatedCost = estimateCost(testCount)

    return NextResponse.json({
      filename: file.name,
      rowCount,
      columns,
      urlColumn,
      groundTruthColumns,
      estimatedDuration,
      estimatedCost,
    })
  } catch (error: any) {
    console.error('CSV analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze CSV: ' + error.message },
      { status: 500 }
    )
  }
}

// Helper functions
function isUrlColumn(name: string): boolean {
  const urlPatterns = ['url', 'website', 'site', 'link', 'web', 'domain', 'page']
  const lowerName = name.toLowerCase()
  return urlPatterns.some((pattern) => lowerName.includes(pattern))
}

function isGroundTruthColumn(name: string): boolean {
  const gtPatterns = [
    'gt_',
    '_gt',
    'expected_',
    '_expected',
    'ground_truth_',
    '_ground_truth',
    'groundtruth_',
    '_groundtruth',
    'truth_',
    '_truth',
  ]
  const lowerName = name.toLowerCase()

  // Don't mark URL columns as ground truth
  if (isUrlColumn(name)) return false

  return gtPatterns.some((pattern) => lowerName.includes(pattern))
}

function detectColumnType(name: string, samples: string[]): 'text' | 'number' | 'url' | 'email' | 'phone' {
  const lowerName = name.toLowerCase()

  // Check name patterns first
  if (lowerName.includes('email') || lowerName.includes('e-mail')) {
    return 'email'
  }
  if (lowerName.includes('phone') || lowerName.includes('tel') || lowerName.includes('mobile')) {
    return 'phone'
  }
  if (isUrlColumn(name)) {
    return 'url'
  }

  // Check sample values
  const firstSample = samples[0] || ''

  // URL pattern
  if (firstSample.startsWith('http://') || firstSample.startsWith('https://') || firstSample.includes('www.')) {
    return 'url'
  }

  // Email pattern
  if (firstSample.includes('@') && firstSample.includes('.')) {
    return 'email'
  }

  // Phone pattern
  if (/[\d\s\-\(\)]+/.test(firstSample) && firstSample.replace(/\D/g, '').length >= 10) {
    return 'phone'
  }

  // Number pattern
  if (samples.every((s) => !isNaN(Number(s)) && s.trim() !== '')) {
    return 'number'
  }

  return 'text'
}

function estimateDuration(jobCount: number): string {
  // Assume ~15 seconds per job on average
  const seconds = jobCount * 15
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

function estimateCost(jobCount: number): string {
  // Assume ~$0.05 per job (rough estimate)
  const cost = jobCount * 0.05
  if (cost < 1) {
    return `$${cost.toFixed(2)}`
  }
  return `$${cost.toFixed(0)}`
}
