# User Acceptance Testing (UAT) Plan
# MINO Platform - Production Deployment Readiness

**Test Date**: 2025-11-05
**Version**: 2.0.0-rc1
**Environment**: Local (http://localhost:3001) → Vercel Production
**Tester**: Automated UAT Suite + Manual Verification

---

## Test Objectives

1. Verify all core features work end-to-end
2. Validate production-ready APIs with real data
3. Test concurrent execution and retry logic
4. Verify real-time WebSocket updates
5. Test bulk operations at scale
6. Validate pagination and filtering
7. Ensure error handling works correctly
8. Verify export functionality
9. Test performance under load
10. Confirm deployment readiness

---

## Test Environment Setup

### Prerequisites
- ✅ Database: Supabase PostgreSQL with all indexes
- ✅ Server: Running on localhost:3001
- ✅ WebSocket: ws://localhost:3001/ws
- ✅ Environment Variables: DATABASE_URL, AGENTQL_API_KEY
- ✅ Dependencies: All packages installed

### Test Data Requirements
- Sample CSV with 10+ URLs
- Project instructions for web scraping
- Ground truth data for evaluation
- Test URLs that are accessible

---

## UAT Test Suites

### Suite 1: Project Management
**Goal**: Verify project CRUD operations work correctly

#### Test 1.1: Create Project
- **Action**: POST /api/projects with valid data
- **Expected**: Project created with UUID, timestamps
- **Validation**: Name, instructions stored correctly

#### Test 1.2: Get Project List
- **Action**: GET /api/projects
- **Expected**: Returns all projects with metadata

#### Test 1.3: Get Single Project
- **Action**: GET /api/projects/{id}
- **Expected**: Returns project details

#### Test 1.4: Update Project
- **Action**: PUT /api/projects/{id}
- **Expected**: Project updated, updatedAt timestamp changed

#### Test 1.5: Delete Project
- **Action**: DELETE /api/projects/{id}
- **Expected**: Project deleted, cascading to batches/jobs

#### Test 1.6: Validation Errors
- **Action**: POST /api/projects with invalid data (empty name, no instructions)
- **Expected**: 400 error with structured validation errors

---

### Suite 2: Batch Operations
**Goal**: Verify batch creation and CSV processing

#### Test 2.1: Create Batch with CSV
- **Action**: POST /api/batches with project_id and CSV data
- **Expected**: Batch created, jobs generated from CSV rows

#### Test 2.2: Get Batches for Project
- **Action**: GET /api/batches?project_id={id}&limit=50
- **Expected**: Returns batches with pagination metadata

#### Test 2.3: Get Single Batch
- **Action**: GET /api/batches/{id}
- **Expected**: Returns batch details with stats

#### Test 2.4: Update Batch
- **Action**: PUT /api/batches/{id}
- **Expected**: Batch name/description updated

#### Test 2.5: Delete Batch
- **Action**: DELETE /api/batches/{id}
- **Expected**: Batch deleted, jobs cascade deleted

#### Test 2.6: CSV Validation
- **Action**: POST /api/batches with invalid CSV (no URL column, >10k rows)
- **Expected**: 400 error with validation details

---

### Suite 3: Job Execution & Monitoring
**Goal**: Verify execution engine with retry and concurrency

#### Test 3.1: Execute Batch (Test Mode)
- **Action**: POST /api/projects/{id}/batches/{batchId}/execute
  - executionType: "test"
  - sampleSize: 5
  - concurrency: 3
- **Expected**:
  - Execution record created
  - Jobs run concurrently (3 at a time)
  - Real-time WebSocket events published
  - Stats updated atomically

#### Test 3.2: Execute Batch (Production Mode)
- **Action**: POST /api/projects/{id}/batches/{batchId}/execute
  - executionType: "production"
  - sampleSize: 10
  - concurrency: 5
- **Expected**: All jobs execute, results stored

#### Test 3.3: Monitor Execution Progress
- **Action**: GET /api/executions/{id}
- **Expected**: Real-time stats (running, completed, queued, error counts)

#### Test 3.4: Update Concurrency Mid-Execution
- **Action**: PUT /api/executions/{id}/concurrency with new limit
- **Expected**: Concurrency updated without stopping execution

#### Test 3.5: Pause Execution
- **Action**: POST /api/executions/{id}/pause
- **Expected**: Execution paused, jobs stop processing

#### Test 3.6: Resume Execution
- **Action**: POST /api/executions/{id}/resume
- **Expected**: Execution resumed, queued jobs continue

#### Test 3.7: Stop Execution
- **Action**: POST /api/executions/{id}/stop
- **Expected**: Execution stopped, status set to 'stopped'

#### Test 3.8: Retry Logic Verification
- **Action**: Execute jobs that may fail (timeout, network error)
- **Expected**: Automatic retry up to 5 times with exponential backoff

---

### Suite 4: Ground Truth & Evaluation
**Goal**: Verify ground truth tracking and accuracy evaluation

#### Test 4.1: Set Ground Truth for Job
- **Action**: PATCH /api/jobs/{id} with groundTruthData
- **Expected**: Ground truth stored, hasGroundTruth = true

#### Test 4.2: Bulk Set Ground Truth
- **Action**: POST /api/jobs/ground-truth/bulk-set
- **Expected**: Multiple jobs updated with ground truth

#### Test 4.3: Evaluate Job Accuracy
- **Action**: System compares extractedData vs groundTruthData
- **Expected**: isEvaluated = true, evaluationResult = pass/fail

#### Test 4.4: Filter Jobs by Evaluation
- **Action**: GET /api/batches/{id}/jobs?evaluationResult=pass
- **Expected**: Returns only passed jobs

---

### Suite 5: Bulk Operations
**Goal**: Verify bulk delete, rerun, update APIs

#### Test 5.1: Bulk Delete Jobs
- **Action**: POST /api/jobs/bulk/delete with jobIds array
- **Expected**: Jobs and sessions deleted transactionally

#### Test 5.2: Bulk Rerun Jobs
- **Action**: POST /api/jobs/bulk/rerun with jobIds array
- **Expected**:
  - Jobs reset to 'queued'
  - New execution record created
  - Background execution starts

#### Test 5.3: Bulk Update Jobs
- **Action**: POST /api/jobs/bulk/update
  - Update status, ground truth
- **Expected**: Multiple jobs updated atomically

#### Test 5.4: Bulk Operations Validation
- **Action**: POST bulk endpoints with invalid data (>1000 jobs, invalid UUIDs)
- **Expected**: 400 error with limits enforced

---

### Suite 6: Pagination & Filtering
**Goal**: Verify cursor-based pagination and filters

#### Test 6.1: Paginate Batches
- **Action**: GET /api/batches?project_id={id}&limit=5
- **Expected**:
  - Returns 5 batches
  - Includes nextCursor, hasMore
  - Fetch next page with cursor

#### Test 6.2: Paginate Jobs
- **Action**: GET /api/batches/{id}/jobs?limit=10
- **Expected**: Cursor-based pagination works

#### Test 6.3: Filter by Status
- **Action**: GET /api/batches/{id}/jobs?status=completed,error
- **Expected**: Returns only completed and error jobs

#### Test 6.4: Filter by Ground Truth
- **Action**: GET /api/batches/{id}/jobs?hasGroundTruth=true
- **Expected**: Returns only jobs with ground truth

#### Test 6.5: Search Jobs
- **Action**: GET /api/batches/{id}/jobs?search=example.com
- **Expected**: Returns jobs matching search query

#### Test 6.6: Combined Filters
- **Action**: Multiple filters + pagination
- **Expected**: All filters applied correctly

---

### Suite 7: Export Functionality
**Goal**: Verify CSV, JSON, Excel export

#### Test 7.1: Export as CSV
- **Action**: POST /api/batches/{id}/export
  - format: "csv"
  - includeGroundTruth: true
- **Expected**: CSV file with all job data

#### Test 7.2: Export as JSON
- **Action**: POST /api/batches/{id}/export
  - format: "json"
- **Expected**: JSON file with structured data

#### Test 7.3: Export with Filters
- **Action**: Export with status filter (completed only)
- **Expected**: Only filtered jobs exported

---

### Suite 8: Real-time Updates (WebSocket)
**Goal**: Verify WebSocket events publish correctly

#### Test 8.1: Connect to WebSocket
- **Action**: Connect to ws://localhost:3001/ws
- **Expected**: Connection established

#### Test 8.2: Execution Started Event
- **Action**: Start execution
- **Expected**: Receive execution_started event

#### Test 8.3: Job Started Event
- **Action**: Job begins processing
- **Expected**: Receive job_started event with jobId

#### Test 8.4: Job Completed Event
- **Action**: Job finishes successfully
- **Expected**: Receive job_completed event with results

#### Test 8.5: Job Failed Event
- **Action**: Job fails after retries
- **Expected**: Receive job_failed event with error

#### Test 8.6: Stats Updated Event
- **Action**: During execution
- **Expected**: Periodic stats updates (running, completed counts)

#### Test 8.7: Execution Completed Event
- **Action**: All jobs finish
- **Expected**: Receive execution_completed event with summary

---

### Suite 9: Error Handling
**Goal**: Verify all error scenarios handled gracefully

#### Test 9.1: Invalid UUID Format
- **Action**: GET /api/projects/not-a-uuid
- **Expected**: 400 error with code VALIDATION_ERROR

#### Test 9.2: Resource Not Found
- **Action**: GET /api/projects/550e8400-e29b-41d4-a716-446655440000
- **Expected**: 404 error with code NOT_FOUND

#### Test 9.3: Invalid JSON
- **Action**: POST /api/projects with malformed JSON
- **Expected**: 400 error with code INVALID_JSON

#### Test 9.4: Missing Required Fields
- **Action**: POST /api/projects with {}
- **Expected**: 400 error with field-level validation errors

#### Test 9.5: Database Connection Error
- **Action**: Simulate database down
- **Expected**: 500 error with code DATABASE_ERROR

---

### Suite 10: Performance & Load
**Goal**: Verify performance under realistic load

#### Test 10.1: Large Batch Execution
- **Action**: Execute batch with 100 jobs
- **Expected**: Completes within reasonable time (5-50x faster than sequential)

#### Test 10.2: High Concurrency
- **Action**: Set concurrency to 50
- **Expected**: System handles high concurrency without issues

#### Test 10.3: Pagination Performance
- **Action**: Paginate through 10,000 jobs
- **Expected**: Constant-time performance at any page

#### Test 10.4: Bulk Operations at Scale
- **Action**: Bulk update 1,000 jobs
- **Expected**: Completes in <5 seconds

#### Test 10.5: WebSocket Load
- **Action**: 10 concurrent executions with WebSocket connections
- **Expected**: All events delivered without loss

---

## UAT Execution Plan

### Phase 1: Automated API Testing
1. Run comprehensive API test suite
2. Verify all endpoints return expected responses
3. Test validation and error handling
4. Document any failures

### Phase 2: Manual Feature Testing
1. Test complete user workflows
2. Verify UI interactions (if applicable)
3. Test WebSocket real-time updates
4. Validate exported files

### Phase 3: Performance Testing
1. Test with realistic data volumes
2. Measure execution speed improvements
3. Verify concurrent execution works correctly
4. Test pagination at scale

### Phase 4: Issue Resolution
1. Document all issues found
2. Prioritize by severity (blocker, critical, major, minor)
3. Fix blockers and critical issues
4. Retest after fixes

### Phase 5: Deployment Verification
1. Build for production (npm run build)
2. Test production build locally
3. Deploy to Vercel
4. Verify production deployment

---

## Success Criteria

### Must Pass (Blockers)
- ✅ All API endpoints return 200/201 for valid requests
- ✅ All API endpoints return 400/404/500 for invalid requests
- ✅ Execution engine runs jobs concurrently
- ✅ Retry logic works for transient failures
- ✅ Database indexes improve query performance
- ✅ Pagination works at scale
- ✅ Bulk operations complete successfully
- ✅ No TypeScript errors in build
- ✅ No critical security vulnerabilities

### Should Pass (Critical)
- ✅ WebSocket events publish in real-time
- ✅ Ground truth evaluation works correctly
- ✅ Export functionality produces valid files
- ✅ Concurrency adjustment works mid-execution
- ✅ Error messages are user-friendly

### Nice to Have (Minor)
- Performance optimization for large datasets
- Additional export formats
- Enhanced error recovery

---

## Test Results Template

### Test: [Suite X.Y - Test Name]
- **Status**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
- **Execution Time**: X seconds
- **Expected Result**: [description]
- **Actual Result**: [description]
- **Issues Found**: [list any issues]
- **Notes**: [additional observations]

---

## Issue Tracking

### Issue Template
- **ID**: UAT-001
- **Severity**: BLOCKER / CRITICAL / MAJOR / MINOR
- **Test**: Suite X.Y
- **Description**: [what went wrong]
- **Expected**: [what should happen]
- **Actual**: [what actually happened]
- **Steps to Reproduce**: [detailed steps]
- **Fix Status**: PENDING / IN PROGRESS / FIXED / VERIFIED

---

## Deployment Checklist

### Pre-Deployment
- [ ] All UAT tests pass
- [ ] No blocker or critical issues
- [ ] Production build succeeds
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security audit passed

### Vercel Configuration
- [ ] vercel.json created
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Domain configured (if applicable)
- [ ] Analytics enabled

### Post-Deployment
- [ ] Production site loads
- [ ] API endpoints accessible
- [ ] WebSocket connection works
- [ ] Database connection verified
- [ ] Performance metrics acceptable
- [ ] Error tracking enabled

---

## Timeline

1. **UAT Planning**: 30 minutes ✅
2. **Automated Testing**: 1-2 hours
3. **Manual Testing**: 1-2 hours
4. **Issue Resolution**: 1-3 hours (depending on findings)
5. **Deployment Prep**: 30 minutes
6. **Vercel Deployment**: 30 minutes
7. **Post-Deployment Verification**: 30 minutes

**Total Estimated Time**: 5-9 hours

---

**Status**: Ready to execute UAT
**Next Step**: Run automated API test suite
