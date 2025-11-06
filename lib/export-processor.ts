import ExcelJS from 'exceljs'
import Papa from 'papaparse'
import { Job, Session } from '@/db/schema'

interface ExportConfig {
  columns: string[]
  includeGroundTruth: boolean
  includeComparison: boolean
}

interface ExportJob extends Job {
  sessions: Session[]
}

/**
 * Generate CSV export
 */
export async function generateCSV(
  jobs: ExportJob[],
  config: ExportConfig
): Promise<Buffer> {
  const rows: any[] = []

  for (const job of jobs) {
    const row: any = {}

    const latestSession = job.sessions[0]
    const extractedData = (latestSession?.extractedData as Record<string, any>) || {}
    const groundTruthData = (job.groundTruthData as Record<string, any>) || {}

    // Add selected columns
    for (const columnName of config.columns) {
      row[columnName] = extractedData[columnName] || ''

      if (config.includeGroundTruth && groundTruthData[columnName]) {
        row[`${columnName}_expected`] = groundTruthData[columnName]
      }

      if (config.includeComparison && groundTruthData[columnName]) {
        const isMatch =
          normalizeValue(extractedData[columnName]) === normalizeValue(groundTruthData[columnName])
        row[`${columnName}_match`] = isMatch ? 'PASS' : 'FAIL'
      }
    }

    // Add metadata
    row['job_id'] = job.id
    row['status'] = job.status
    row['url'] = job.siteUrl
    row['created_at'] = job.createdAt.toISOString()

    rows.push(row)
  }

  const csv = Papa.unparse(rows)
  return Buffer.from(csv, 'utf-8')
}

/**
 * Generate JSON export
 */
export async function generateJSON(
  jobs: ExportJob[],
  config: ExportConfig
): Promise<Buffer> {
  const data = jobs.map(job => {
    const latestSession = job.sessions[0]
    const extractedData = (latestSession?.extractedData as Record<string, any>) || {}
    const groundTruthData = (job.groundTruthData as Record<string, any>) || {}

    const result: any = {
      job_id: job.id,
      url: job.siteUrl,
      status: job.status,
      created_at: job.createdAt.toISOString(),
      extracted: {},
    }

    // Add selected columns
    for (const columnName of config.columns) {
      result.extracted[columnName] = extractedData[columnName] || null
    }

    if (config.includeGroundTruth) {
      result.ground_truth = {}
      for (const columnName of config.columns) {
        if (groundTruthData[columnName]) {
          result.ground_truth[columnName] = groundTruthData[columnName]
        }
      }
    }

    if (config.includeComparison) {
      result.comparison = {}
      for (const columnName of config.columns) {
        if (groundTruthData[columnName]) {
          const isMatch =
            normalizeValue(extractedData[columnName]) === normalizeValue(groundTruthData[columnName])
          result.comparison[columnName] = {
            expected: groundTruthData[columnName],
            actual: extractedData[columnName],
            match: isMatch,
          }
        }
      }
    }

    return result
  })

  const json = JSON.stringify(data, null, 2)
  return Buffer.from(json, 'utf-8')
}

/**
 * Generate Excel export with multiple sheets
 */
export async function generateExcel(
  jobs: ExportJob[],
  config: ExportConfig
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  // Sheet 1: Data
  const dataSheet = workbook.addWorksheet('Results')

  // Define columns
  const columns: any[] = [
    { header: 'Job ID', key: 'job_id', width: 30 },
    { header: 'URL', key: 'url', width: 50 },
    { header: 'Status', key: 'status', width: 15 },
  ]

  for (const columnName of config.columns) {
    columns.push({
      header: columnName,
      key: columnName,
      width: 20,
    })

    if (config.includeGroundTruth) {
      columns.push({
        header: `${columnName} (Expected)`,
        key: `${columnName}_expected`,
        width: 20,
      })
    }

    if (config.includeComparison) {
      columns.push({
        header: `${columnName} (Match)`,
        key: `${columnName}_match`,
        width: 15,
      })
    }
  }

  dataSheet.columns = columns

  // Add data
  for (const job of jobs) {
    const latestSession = job.sessions[0]
    const extractedData = (latestSession?.extractedData as Record<string, any>) || {}
    const groundTruthData = (job.groundTruthData as Record<string, any>) || {}

    const rowData: any = {
      job_id: job.id,
      url: job.siteUrl,
      status: job.status,
    }

    for (const columnName of config.columns) {
      rowData[columnName] = extractedData[columnName] || ''

      if (config.includeGroundTruth && groundTruthData[columnName]) {
        rowData[`${columnName}_expected`] = groundTruthData[columnName]
      }

      if (config.includeComparison && groundTruthData[columnName]) {
        const isMatch =
          normalizeValue(extractedData[columnName]) === normalizeValue(groundTruthData[columnName])
        rowData[`${columnName}_match`] = isMatch ? 'PASS' : 'FAIL'
      }
    }

    const row = dataSheet.addRow(rowData)

    // Color code comparison cells
    if (config.includeComparison) {
      for (let i = 0; i < config.columns.length; i++) {
        const columnName = config.columns[i]
        if (groundTruthData[columnName]) {
          const matchColIndex = columns.findIndex(c => c.key === `${columnName}_match`)
          if (matchColIndex >= 0) {
            const cell = row.getCell(matchColIndex + 1)
            if (cell.value === 'PASS') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF10B981' },
              }
              cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
            } else {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEF4444' },
              }
              cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
            }
          }
        }
      }
    }
  }

  // Style header row
  dataSheet.getRow(1).font = { bold: true }
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF59E0B' },
  }

  // Sheet 2: Summary
  const summarySheet = workbook.addWorksheet('Summary')
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ]

  const totalJobs = jobs.length
  const jobsWithGT = jobs.filter(j => j.hasGroundTruth).length
  const passedJobs = jobs.filter(j => j.evaluationResult === 'pass').length
  const failedJobs = jobs.filter(j => j.evaluationResult === 'fail').length

  summarySheet.addRow({ metric: 'Total Jobs', value: totalJobs })
  summarySheet.addRow({ metric: 'Jobs with Ground Truth', value: jobsWithGT })
  summarySheet.addRow({ metric: 'Passed Jobs', value: passedJobs })
  summarySheet.addRow({ metric: 'Failed Jobs', value: failedJobs })
  if (jobsWithGT > 0) {
    summarySheet.addRow({
      metric: 'Pass Rate',
      value: `${((passedJobs / jobsWithGT) * 100).toFixed(1)}%`,
    })
  }

  summarySheet.getRow(1).font = { bold: true }

  // Return buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Normalize value for comparison
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined) return ''
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ')
}
