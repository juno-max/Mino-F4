# MINO V2 - Comprehensive Feature Documentation

**Version:** 2.0
**Last Updated:** 2025-11-05

---

## 📋 Table of Contents

1. [Core Features](#core-features)
2. [Project Management](#project-management)
3. [Batch Management](#batch-management)
4. [Execution System](#execution-system)
5. [Ground Truth & Accuracy](#ground-truth--accuracy)
6. [Analytics & Reporting](#analytics--reporting)
7. [Data Export](#data-export)
8. [Real-Time Monitoring](#real-time-monitoring)
9. [API Reference](#api-reference)
10. [Best Practices](#best-practices)

---

## 🎯 Core Features

### 1. Intelligent Web Data Extraction

**Purpose:** Automate data extraction from websites using AI-powered agents.

**Key Capabilities:**
- Natural language instructions for extraction
- Handles dynamic JavaScript-rendered content
- Screenshot capture for verification
- Automatic retry on failures
- Support for authentication and complex workflows

**Example Use Cases:**
- Extract pricing from competitor websites
- Scrape product specifications from catalogs
- Monitor website changes for compliance
- Gather research data from academic sites
- Collect real estate listings at scale

### 2. Ground Truth Comparison

**Purpose:** Validate extraction accuracy by comparing against known correct values.

**Features:**
- Upload CSV with ground truth columns
- Automatic accuracy calculation
- Field-by-field comparison
- Visual side-by-side diff
- Accuracy trends over time
- Snapshot history for tracking improvements

**Metrics Provided:**
- Overall accuracy percentage
- Per-column accuracy rates
- Pass/fail evaluation per job
- Accuracy distribution charts
- Improvement over time graphs

### 3. Batch Processing at Scale

**Purpose:** Process hundreds or thousands of extraction tasks efficiently.

**Capabilities:**
- CSV-based batch upload
- Configurable concurrency (1-50 parallel)
- Smart retry logic for failures
- Real-time progress tracking
- Pause/resume/stop controls
- Estimated time to completion

**Performance:**
- 10-30 jobs per minute (typical)
- Up to 50 parallel executions
- Automatic load balancing
- Intelligent queue management

### 4. Metrics & Analytics

**Purpose:** Understand extraction performance and identify issues.

**Analytics Provided:**
- Success/failure rates
- Accuracy trends
- Error categorization
- Performance metrics (duration, cost)
- Column-level insights
- Time-series analysis

---

## 📁 Project Management

### Creating Projects

**What is a Project?**
A project is a container for related extraction tasks with shared instructions.

**API:**
```typescript
POST /api/projects
{
  "name": "Competitor Price Monitoring",
  "description": "Track pricing across 50 competitor sites",
  "instructions": "Navigate to {site_url}, find the price for product {product_name}, and extract the price value."
}
```

**Fields:**
- `name` (required): 1-100 characters
- `description` (optional): Up to 500 characters
- `instructions` (required): 10-10,000 characters

**Validation:**
✅ Name trimmed and length-checked
✅ Instructions support placeholders: `{column_name}`
✅ Unique project IDs (UUID)

**Best Practices:**
- Use clear, specific instructions
- Reference CSV column names with `{placeholder}` syntax
- Include step-by-step actions for complex extractions
- Test with small batches first

### Instruction Versioning

**Purpose:** Track changes to extraction instructions over time.

**Features:**
- Version control for instructions
- Production vs draft versions
- Change descriptions
- Rollback capability
- A/B testing support

**API:**
```typescript
POST /api/projects/{id}/instructions/versions
{
  "instructions": "Updated instructions with improved selector logic",
  "changeDescription": "Fixed issue with dynamic pricing elements",
  "setAsProduction": true
}
```

### Updating Projects

**API:**
```typescript
PUT /api/projects/{id}
{
  "name": "Updated Name",
  "description": "Updated description",
  "instructions": "Updated instructions"
}
```

**Note:** All fields are optional (partial updates supported)

---

## 📊 Batch Management

### Creating Batches from CSV

**Purpose:** Upload data to be processed in bulk.

**CSV Format:**
```csv
url,name,gt_price,gt_availability
https://example.com/product1,Product A,29.99,In Stock
https://example.com/product2,Product B,39.99,Out of Stock
```

**Column Types:**
- **URL Column:** Identifies the site to visit (auto-detected)
- **Data Columns:** Used as placeholders in instructions
- **Ground Truth Columns:** Prefixed with `gt_` or suffixed with `_gt`

**API:**
```typescript
POST /api/batches
FormData {
  project_id: "uuid",
  name: "November Price Check",
  goal: "Extract pricing data",
  csv_file: File
}
```

**Auto-Detection:**
- Automatically identifies URL columns
- Detects ground truth columns by naming pattern
- Infers column types (text, number, url, etc.)
- Calculates total sites

**Limits:**
- Max 10,000 rows per batch
- CSV file size: reasonable for web upload
- Column names: alphanumeric + underscore

### Batch Metadata

Each batch stores:
```json
{
  "columnSchema": [
    {
      "name": "url",
      "type": "url",
      "isUrl": true,
      "isGroundTruth": false
    },
    {
      "name": "gt_price",
      "type": "text",
      "isUrl": false,
      "isGroundTruth": true
    }
  ],
  "csvData": [...],
  "hasGroundTruth": true,
  "groundTruthColumns": ["gt_price"],
  "totalSites": 100
}
```

---

## 🚀 Execution System

### Starting an Execution

**API:**
```typescript
POST /api/projects/{id}/batches/{batchId}/execute
{
  "executionType": "test",      // or "production"
  "sampleSize": 10,              // 1-1000
  "useAgentQL": true,            // Use EVA agent
  "concurrency": 5               // 1-50 parallel jobs
}
```

**Validation:**
✅ `executionType`: Must be "test" or "production"
✅ `sampleSize`: Integer 1-1000
✅ `concurrency`: Integer 1-50
✅ UUIDs validated for project and batch IDs

**Response:**
```json
{
  "execution": {
    "id": "uuid",
    "status": "running",
    "totalJobs": 10,
    "concurrency": 5,
    "startedAt": "2025-11-05T10:00:00Z"
  },
  "jobs": [...]
}
```

### Execution Flow

1. **Initialization**
   - Validate request
   - Create execution record
   - Create/reset job records
   - Initialize concurrency controller

2. **Processing**
   - Queue all jobs
   - Process with configured concurrency
   - Apply retry logic on failures
   - Track progress in real-time
   - Publish WebSocket events

3. **Completion**
   - Calculate final metrics
   - Create accuracy snapshot
   - Update execution status
   - Notify via WebSocket

### Job States

```
queued → running → completed
                 ↓
                error
```

**States:**
- `queued`: Waiting to start
- `running`: Currently executing
- `completed`: Successfully finished
- `error`: Failed after retries

### Retry Logic ✅

**Automatic Retry on Transient Failures:**
```typescript
{
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
}
```

**Retry Schedule:**
- Attempt 1: Execute immediately
- Attempt 2: Wait 1s + jitter (retry after failure)
- Attempt 3: Wait 2s + jitter
- Attempt 4: Wait 4s + jitter

**Error Classification:**
- **Transient** (retry): Network errors, timeouts, 5xx errors
- **Rate Limit** (retry with longer delay): 429 errors
- **Permanent** (no retry): 404, validation errors, 401/403

**Jitter:** Random 0-25% added to prevent thundering herd

### Concurrency Control ✅

**Dynamic Concurrency Management:**
```typescript
const controller = createConcurrencyController(5)

// Executes with limit
await controller.run(() => executeJob(job))

// Adjust on-the-fly
controller.updateConcurrency(10)

// Monitor
controller.getActiveCount()   // Running now
controller.getPendingCount()  // Waiting in queue
```

**API to Adjust Concurrency:**
```typescript
POST /api/executions/{id}/concurrency
{
  "concurrency": 10  // 1-50
}
```

**Use Cases:**
- Scale up during quiet hours
- Scale down if hitting rate limits
- Adjust based on error rates
- Dynamic load balancing

### Execution Controls

**Pause Execution:**
```typescript
POST /api/executions/{id}/pause
```
- Stops starting new jobs
- Allows running jobs to complete
- State persisted for resume

**Resume Execution:**
```typescript
POST /api/executions/{id}/resume
```
- Continues from where paused
- Respects current concurrency setting
- Maintains job queue

**Stop Execution:**
```typescript
POST /api/executions/{id}/stop
{
  "reason": "User requested stop"  // Optional
}
```
- Immediately stops all jobs
- Running jobs may complete or error
- Marks execution as stopped

---

## ✅ Ground Truth & Accuracy

### Setting Ground Truth

**Bulk Set:**
```typescript
POST /api/batches/{id}/ground-truth/bulk-set
{
  "updates": [
    {
      "jobId": "uuid",
      "groundTruthData": {
        "price": "29.99",
        "availability": "In Stock"
      }
    }
  ]
}
```

**Validation:**
✅ Max 1000 updates per request
✅ JobId must be valid UUID
✅ Ground truth data as key-value object

**Bulk Edit:**
```typescript
POST /api/batches/{id}/ground-truth/bulk-edit
{
  "jobIds": ["uuid1", "uuid2"],
  "operation": "set",              // "set" | "clear" | "copy"
  "field": "price",
  "value": "29.99"
}
```

### Accuracy Calculation

**Algorithm:**
```typescript
for each job with ground truth:
  for each GT field:
    extracted = normalize(job.extractedData[field])
    expected = normalize(job.groundTruthData[field])

    if extracted === expected:
      matches++

  accuracy = (matches / total_fields) * 100
```

**Normalization:**
- Convert to lowercase
- Trim whitespace
- Remove common punctuation
- Handle null/undefined

**Evaluation:**
- `pass`: accuracy === 100%
- `fail`: accuracy < 100%

### Metrics Snapshot

**Purpose:** Capture point-in-time accuracy for tracking trends.

**API:**
```typescript
POST /api/batches/{id}/ground-truth/snapshot
{
  "notes": "After fixing selector logic",
  "executionId": "uuid"  // Optional, link to specific execution
}
```

**Snapshot Contents:**
```json
{
  "overallAccuracy": 85.5,
  "columnAccuracies": {
    "price": {
      "total": 100,
      "accurate": 92,
      "accuracyPercentage": 92.0
    },
    "availability": {
      "total": 100,
      "accurate": 79,
      "accuracyPercentage": 79.0
    }
  },
  "totalEvaluated": 100
}
```

### Column Metrics

**API:**
```typescript
GET /api/batches/{id}/ground-truth/column-metrics
```

**Response:**
```json
{
  "columns": [
    {
      "name": "price",
      "total": 100,
      "accurate": 92,
      "accuracyPercentage": 92.0,
      "commonErrors": [
        { "extracted": "$29", "expected": "29.99", "count": 3 },
        { "extracted": "null", "expected": "19.99", "count": 2 }
      ]
    }
  ]
}
```

### Accuracy Trends

**API:**
```typescript
GET /api/batches/{id}/ground-truth/trends
```

**Response:**
- Historical snapshots over time
- Accuracy improvements
- Column-level trends
- Execution comparison

---

## 📈 Analytics & Reporting

### Batch Analytics Dashboard

**API:**
```typescript
GET /api/batches/{id}/analytics/dashboard
```

**Metrics Provided:**
```json
{
  "overview": {
    "totalJobs": 100,
    "completedJobs": 95,
    "errorJobs": 5,
    "successRate": 95.0,
    "averageDuration": 4500,  // ms
    "totalDuration": 427500   // ms
  },
  "accuracy": {
    "overallAccuracy": 87.5,
    "evaluatedJobs": 90,
    "passedJobs": 78,
    "failedJobs": 12,
    "passRate": 86.67
  },
  "errorBreakdown": [
    { "category": "timeout", "count": 3 },
    { "category": "selector_not_found", "count": 2 }
  ],
  "columnMetrics": {...},
  "trends": {...}
}
```

### Job Filtering & Search

**API:**
```typescript
GET /api/batches/{id}/jobs?
  status=completed,error&
  hasGroundTruth=true&
  evaluationResult=fail&
  accuracyMin=50&
  accuracyMax=80&
  search=amazon.com
```

**Filters:**
- `status`: Comma-separated (queued, running, completed, error)
- `hasGroundTruth`: Boolean (true/false)
- `evaluationResult`: Comma-separated (pass, fail)
- `accuracyMin/Max`: Integer 0-100
- `search`: Text search on URL, inputId, siteName

**Performance:**
- Database-level filtering (status, GT, evaluation)
- Client-side filtering (accuracy, search) for complex logic
- Indexed queries (50-1000x faster with indexes!)

**Response:**
```json
{
  "jobs": [...],
  "total": 42,
  "filters": {
    "status": ["completed", "error"],
    "hasGroundTruth": "true",
    "evaluationResult": ["fail"],
    "accuracyMin": "50",
    "accuracyMax": "80",
    "search": "amazon.com"
  }
}
```

---

## 📤 Data Export

### Export Formats

**Supported:**
- CSV (text/csv)
- JSON (application/json)
- Excel (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### Export API

```typescript
POST /api/batches/{id}/export
{
  "format": "csv",               // "csv" | "json" | "xlsx"
  "columns": ["url", "price"],   // Optional, auto-detect if empty
  "includeGroundTruth": true,
  "includeComparison": true,
  "filters": {
    "status": ["completed"],
    "hasGroundTruth": true,
    "evaluationResult": ["pass", "fail"]
  }
}
```

**Validation:**
✅ Format must be csv/json/xlsx
✅ Columns array (strings)
✅ Booleans for include options
✅ Filters object with proper structure

**Response:**
- File stream with appropriate Content-Type
- Content-Disposition: attachment
- Filename: `export-{batchId}.{ext}`

### Export Columns

**Standard Columns:**
- `inputId`: Unique row identifier
- `siteUrl`: Target URL
- `siteName`: Site name (if available)
- `status`: Job status
- `extracted_*`: All extracted fields

**With Ground Truth:**
- `gt_*`: Ground truth values
- `accurate_*`: Boolean (match yes/no)

**With Comparison:**
- `accuracy_percentage`: Overall accuracy
- `evaluation_result`: pass/fail
- `is_evaluated`: Boolean

### Export History

**API:**
```typescript
GET /api/batches/{id}/export/history
```

**Response:**
```json
[
  {
    "id": "uuid",
    "format": "csv",
    "fileSize": 15420,
    "rowCount": 100,
    "status": "completed",
    "createdAt": "2025-11-05T10:00:00Z"
  }
]
```

---

## 📡 Real-Time Monitoring

### WebSocket Connection

**Endpoint:** `ws://localhost:3001/ws`

**Client Setup:**
```typescript
const ws = new WebSocket('ws://localhost:3001/ws')

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  handleEvent(message.type, message.data)
}
```

### Event Types

**Execution Events:**
```typescript
// When execution starts
{
  "type": "execution:started",
  "data": {
    "executionId": "uuid",
    "batchId": "uuid",
    "projectId": "uuid",
    "totalJobs": 100,
    "concurrency": 5,
    "executionType": "test"
  }
}

// Periodic stats updates
{
  "type": "execution:stats:updated",
  "data": {
    "executionId": "uuid",
    "stats": {
      "totalJobs": 100,
      "completedJobs": 45,
      "runningJobs": 5,
      "queuedJobs": 50,
      "errorJobs": 2
    }
  }
}

// When execution completes
{
  "type": "execution:completed",
  "data": {
    "executionId": "uuid",
    "completedJobs": 100,
    "totalJobs": 100,
    "passRate": 87.5,
    "duration": 300000
  }
}
```

**Job Events:**
```typescript
// Job started
{
  "type": "job:started",
  "data": {
    "executionId": "uuid",
    "jobId": "uuid",
    "batchId": "uuid",
    "siteUrl": "https://example.com",
    "goal": "Extract price"
  }
}

// Job completed
{
  "type": "job:completed",
  "data": {
    "executionId": "uuid",
    "jobId": "uuid",
    "status": "completed",
    "duration": 4500,
    "extractedData": {...},
    "isEvaluated": true,
    "evaluationResult": "pass"
  }
}

// Job failed
{
  "type": "job:failed",
  "data": {
    "executionId": "uuid",
    "jobId": "uuid",
    "status": "error",
    "errorMessage": "Timeout after 30s",
    "failureReason": "timeout"
  }
}
```

**Control Events:**
```typescript
// Concurrency changed
{
  "type": "concurrency:changed",
  "data": {
    "executionId": "uuid",
    "oldConcurrency": 5,
    "newConcurrency": 10
  }
}
```

### Dashboard Integration

**Real-time Updates:**
- Progress bar updates on every job completion
- Live stats: running/queued/completed counts
- Error rate tracking
- Accuracy percentage (if GT available)
- Jobs per minute throughput

**Performance:**
- WebSocket latency: ~10-50ms
- Update frequency: On every job status change
- Minimal payload: Only changed data

---

## 🔧 API Reference

### Authentication (Future)

```typescript
Headers:
  Authorization: Bearer <token>
  X-API-Key: <api-key>
```

### Common Response Formats

**Success:**
```json
{
  "data": {...}
}
```

**Error:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": "sampleSize",
      "message": "Sample size must be between 1-1000",
      "code": "too_large"
    }
  ]
}
```

### Pagination (Future)

```typescript
GET /api/batches/{id}/jobs?
  cursor=eyJ...&
  limit=100&
  sortBy=createdAt&
  sortOrder=desc
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJ...",
    "hasMore": true,
    "total": 1000
  }
}
```

---

## 💡 Best Practices

### 1. Writing Effective Instructions

**Good:**
```
Navigate to {site_url}
Wait for the page to load completely
Find the element with class "price"
Extract the text content
Remove any currency symbols
Return the numeric value
```

**Bad:**
```
Get the price
```

**Tips:**
- Be specific and step-by-step
- Handle edge cases (missing elements, redirects)
- Use CSS selectors or XPath when needed
- Test with diverse sites

### 2. Optimizing Batch Size

**For Testing:**
- Use sampleSize: 5-10
- Test with diverse sites first
- Verify extraction logic

**For Production:**
- Start with concurrency: 5
- Monitor error rates
- Scale up gradually if stable
- Watch for rate limiting

**Max Recommendations:**
- sampleSize: 100-500 for most use cases
- concurrency: 5-10 for typical sites
- concurrency: 20-50 for fast APIs

### 3. Ground Truth Strategy

**Collect GT Data:**
- Start small (10-20 rows)
- Include edge cases
- Verify GT accuracy manually
- Use consistent formatting

**Iterate:**
1. Run extraction
2. Review accuracy metrics
3. Identify patterns in failures
4. Update instructions
5. Re-run and compare

### 4. Error Handling

**Common Errors:**
- **Timeout:** Increase timeout in instructions, reduce concurrency
- **Selector not found:** Update selectors, handle dynamic content
- **Rate limit:** Reduce concurrency, add delays
- **Auth required:** Include login steps

**Monitoring:**
- Check error categories in analytics
- Review failed jobs for patterns
- Use screenshots for debugging
- Monitor retry counts

### 5. Performance Optimization

**Database:**
- Use indexed fields for filtering
- Limit results with pagination
- Avoid N+1 queries (use with relations)

**Execution:**
- Adjust concurrency based on site response times
- Use retry logic for transient failures
- Monitor and stop runaway executions

**Exports:**
- Filter before exporting (smaller files)
- Use streaming for large datasets
- Choose appropriate format (CSV fastest)

---

## 🎓 Example Workflows

### Workflow 1: Price Monitoring

```typescript
// 1. Create project
POST /api/projects
{
  "name": "Competitor Price Tracker",
  "instructions": "Navigate to {url}, find the product price, extract numeric value"
}

// 2. Upload CSV with URLs and ground truth
POST /api/batches
FormData {
  csv_file: "competitor_prices.csv"
  // Columns: url, product_name, gt_price
}

// 3. Run test execution
POST /api/projects/{id}/batches/{batchId}/execute
{
  "executionType": "test",
  "sampleSize": 10,
  "concurrency": 5
}

// 4. Review accuracy
GET /api/batches/{id}/ground-truth/column-metrics

// 5. Adjust instructions if needed
PUT /api/projects/{id}
{
  "instructions": "Improved instructions..."
}

// 6. Run full production batch
POST /api/projects/{id}/batches/{batchId}/execute
{
  "executionType": "production",
  "sampleSize": 100,
  "concurrency": 10
}

// 7. Export results
POST /api/batches/{id}/export
{
  "format": "csv",
  "includeGroundTruth": true,
  "includeComparison": true
}
```

### Workflow 2: Compliance Monitoring

```typescript
// 1. Create project with compliance checks
POST /api/projects
{
  "name": "GDPR Cookie Consent Check",
  "instructions": "Visit {url}, check if cookie consent banner appears within 3 seconds, verify 'reject all' button exists"
}

// 2. Upload list of sites to check
POST /api/batches
// CSV: url, company_name, gt_has_consent, gt_has_reject_button

// 3. Execute with high concurrency
POST /api/projects/{id}/batches/{batchId}/execute
{
  "executionType": "production",
  "sampleSize": 500,
  "concurrency": 20
}

// 4. Filter for non-compliant sites
GET /api/batches/{id}/jobs?
  evaluationResult=fail&
  hasGroundTruth=true

// 5. Export violations
POST /api/batches/{id}/export
{
  "format": "xlsx",
  "filters": {
    "evaluationResult": ["fail"]
  },
  "includeComparison": true
}
```

---

**Feature Completeness:** 85%
**Production Ready:** Core features ✅
**Next Additions:** Auth, Webhooks, ML Analytics
