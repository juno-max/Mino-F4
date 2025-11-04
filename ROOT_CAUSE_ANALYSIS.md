# 🔍 ROOT CAUSE ANALYSIS - Streaming & Execution Issues

**Date:** 2025-11-04
**Status:** ❌ CRITICAL ISSUES FOUND

---

## 🚨 CONFIRMED ISSUES

### Issue 1: NO STREAMING URLS IN DATABASE
**Finding:** ALL sessions have `streaming_url = NULL`
- Checked 10 most recent sessions
- Even running sessions have NULL
- NO streaming URLs have EVER been saved

**Evidence:**
```
Sessions: 10 total
- All have streaming_url=false (NULL)
- Including currently running sessions
```

---

### Issue 2: STUCK RUNNING JOBS
**Finding:** Job is marked "running" but has NO logs and NO execution

**Evidence:**
```
Job: 54a1cdb6-3f03-4937-b4b7-6d6427dcd1e1
Status: running
Session: 94544740-736d-4f2e-8311-33b05c2a6d0d
  - Status: running
  - Log length: 0 chars
  - Started: 9 minutes ago
  - Still running with NO output
```

---

### Issue 3: EXECUTE ROUTE EARLY RETURN
**Finding:** When jobs already exist, execute route returns WITHOUT executing

**Code:**
```typescript
// Line 51-64 in execute/route.ts
if (existingJobs.length > 0) {
  console.log('[Execute] Jobs already exist for this batch, reusing them')
  return NextResponse.json({
    execution: latestExecution,
    jobs: existingJobs,
    message: 'Jobs already exist - use existing execution',
  }, { headers: corsHeaders })
}
```

**Problem:** This prevents re-execution of jobs!

---

## 🔍 ROOT CAUSES

### Root Cause #1: Async Callback Not Awaited

**Location:** `lib/eva-executor.ts:356`

**Code:**
```typescript
onStreamingUrl?.(result.streamingUrl);  // ❌ NOT awaited
```

**Problem:**
- Callback is async but not awaited
- Database update happens but returns immediately
- No guarantee update completes before moving on

**Fix:**
```typescript
await onStreamingUrl?.(result.streamingUrl);  // ✅ Awaited
```

---

### Root Cause #2: EVA Agent May Not Provide Streaming URLs

**Problem:**
- EVA agent might not be configured to provide streaming URLs
- Or streaming URLs might not be available in all cases
- Need to verify EVA agent actually sends `streaming_url` in responses

**Investigation Needed:**
1. Check if EVA sandbox provides streaming URLs
2. Verify the `streaming_url` field exists in responses
3. Test with a known-working EVA execution

---

### Root Cause #3: No Re-Execution Logic

**Problem:**
- Once jobs exist, they can't be re-executed
- "Run All Jobs" button does nothing for existing jobs
- Jobs get stuck in "running" state with no way to restart

**Fix:**
- Remove early return for existing jobs
- OR add logic to reset and re-execute existing jobs
- Allow manual job re-execution

---

### Root Cause #4: No Screenshot Capture

**Problem:**
- EVA agent execution doesn't capture screenshots
- No storage for screenshots in database
- No display logic for screenshots

**Missing:**
1. Screenshot capture during execution
2. Database column for screenshot URLs
3. UI to display screenshots

---

## 🛠️ REQUIRED FIXES

### Fix 1: Await Streaming URL Callback ✅

**File:** `lib/eva-executor.ts`
**Line:** 356

**Change:**
```typescript
// BEFORE
onStreamingUrl?.(result.streamingUrl);

// AFTER
if (onStreamingUrl) {
  await onStreamingUrl(result.streamingUrl);
}
```

---

### Fix 2: Make Callback Properly Async ✅

**File:** `app/api/projects/[id]/batches/[batchId]/execute/route.ts`
**Line:** 204-210

**Ensure:**
```typescript
async (url) => {
  console.log(`[executeEvaJobs] Job ${job.id}: Saving streaming URL: ${url}`)
  await db.update(sessions).set({
    streamingUrl: url
  }).where(eq(sessions.id, session.id))
  console.log(`[executeEvaJobs] Streaming URL saved successfully`)
}
```

---

### Fix 3: Allow Job Re-Execution ✅

**File:** `app/api/projects/[id]/batches/[batchId]/execute/route.ts`

**Option A: Remove Early Return**
```typescript
// Remove lines 51-65
// Always execute, don't check for existing jobs
```

**Option B: Add Reset Logic**
```typescript
if (existingJobs.length > 0) {
  // Reset jobs to queued
  await db.update(jobs)
    .set({ status: 'queued' })
    .where(eq(jobs.batchId, params.batchId))

  // Delete old sessions
  await db.delete(sessions)
    .where(inArray(sessions.jobId, existingJobs.map(j => j.id)))

  console.log('[Execute] Reset existing jobs, starting fresh')
}
```

---

### Fix 4: Add Screenshot Support ✅

**Step 1: Add Database Column**
```sql
ALTER TABLE sessions ADD COLUMN screenshot_url TEXT;
```

**Step 2: Capture Screenshots in EVA Executor**
```typescript
// In executeEvaWorkflow, capture screenshots at key moments
if (result.screenshot) {
  // Save screenshot URL
}
```

**Step 3: Display in Job Details**
```typescript
{session.screenshotUrl && (
  <img src={session.screenshotUrl} alt="Execution screenshot" />
)}
```

---

## 📋 FIX IMPLEMENTATION PLAN

### Phase 1: Critical Fixes (Required for Streaming)
1. ✅ Await streaming URL callback
2. ✅ Add proper error handling in callback
3. ✅ Add logging to verify streaming URLs
4. ✅ Fix execute route early return

### Phase 2: Testing
1. ✅ Reset stuck running jobs
2. ✅ Execute a fresh batch
3. ✅ Monitor for streaming URLs in database
4. ✅ Verify streaming URLs appear in UI

### Phase 3: Screenshot Support
1. ✅ Add database column
2. ✅ Implement screenshot capture
3. ✅ Display screenshots in UI
4. ✅ Test end-to-end

---

## 🧪 TEST PLAN

### Test 1: Streaming URL Storage
```
1. Reset all running jobs to queued
2. Execute a batch
3. Monitor database for streaming_url updates
4. Verify URLs are saved
5. Check UI displays iframe
```

### Test 2: Job Details Display
```
1. Navigate to running job
2. Verify live stream iframe appears
3. Check polling updates every 3s
4. Verify job completes successfully
```

### Test 3: Screenshot Capture
```
1. Execute job
2. Verify screenshots captured
3. Check screenshots saved to database
4. Verify UI displays screenshots
```

---

## 🎯 NEXT STEPS

1. **Fix streaming URL callback** - Make it properly async
2. **Remove execute early return** - Allow re-execution
3. **Reset stuck jobs** - Clean up running jobs
4. **Test complete flow** - Upload → Execute → Monitor → View
5. **Add screenshot support** - If time permits

---

**Status:** ❌ **CRITICAL FIXES NEEDED**
**Priority:** P0 - Blocks all streaming functionality
**ETA:** 30-60 minutes to implement and test all fixes
