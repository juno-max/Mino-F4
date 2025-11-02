'use server'

import { db, batches } from '@/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import Papa from 'papaparse'

interface ColumnSchema {
  name: string
  type: 'text' | 'number' | 'url'
  isGroundTruth: boolean
  isUrl: boolean
}

function detectGroundTruthColumns(headers: string[]): string[] {
  const gtPatterns = [
    /^gt_/i,
    /_gt$/i,
    /_ground_truth$/i,
    /_expected$/i,
    /^expected_/i,
  ]

  return headers.filter(header =>
    gtPatterns.some(pattern => pattern.test(header))
  )
}

function detectUrlColumn(headers: string[]): string | undefined {
  const urlPatterns = ['url', 'website', 'site', 'link', 'homepage']
  return headers.find(header =>
    urlPatterns.some(pattern => header.toLowerCase().includes(pattern))
  )
}

function inferColumnType(values: any[]): 'text' | 'number' | 'url' {
  const sampleValues = values.filter(v => v != null && v !== '').slice(0, 10)

  if (sampleValues.length === 0) return 'text'

  // Check if URL
  const urlPattern = /^https?:\/\//i
  if (sampleValues.every(v => urlPattern.test(String(v)))) {
    return 'url'
  }

  // Check if number
  if (sampleValues.every(v => !isNaN(Number(v)))) {
    return 'number'
  }

  return 'text'
}

export async function createBatchFromCSV(
  projectId: string,
  csvContent: string,
  batchName: string,
  batchDescription?: string
) {
  // Parse CSV
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (parsed.errors.length > 0) {
    throw new Error('CSV parsing error: ' + parsed.errors[0].message)
  }

  const data = parsed.data as Record<string, any>[]
  const headers = parsed.meta.fields || []

  if (headers.length === 0 || data.length === 0) {
    throw new Error('CSV file is empty or has no headers')
  }

  // Detect ground truth columns
  const gtColumns = detectGroundTruthColumns(headers)
  const urlColumn = detectUrlColumn(headers)

  // Build column schema
  const columnSchema: ColumnSchema[] = headers.map(header => {
    const columnValues = data.map(row => row[header])
    const isGT = gtColumns.includes(header)
    const isUrl = header === urlColumn

    return {
      name: header,
      type: inferColumnType(columnValues),
      isGroundTruth: isGT,
      isUrl: isUrl,
    }
  })

  // Validate that we have at least one URL column
  if (!urlColumn) {
    throw new Error('CSV must contain a URL column (e.g., "url", "website", "site")')
  }

  // Count total sites
  const totalSites = data.length

  // Create batch
  const [batch] = await db.insert(batches).values({
    projectId,
    name: batchName,
    description: batchDescription,
    columnSchema,
    csvData: data,
    hasGroundTruth: gtColumns.length > 0,
    groundTruthColumns: gtColumns,
    totalSites,
  }).returning()

  revalidatePath(`/projects/${projectId}`)

  return batch
}

export async function deleteBatch(batchId: string, projectId: string) {
  await db.delete(batches).where(eq(batches.id, batchId))
  revalidatePath(`/projects/${projectId}`)
}
