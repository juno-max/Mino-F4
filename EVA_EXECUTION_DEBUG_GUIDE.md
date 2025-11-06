# EVA Execution & Live Updates - Debug Guide

## ✅ Status: EVA API Working!

**Verified Working:**
- ✅ EVA API connectivity (https://eva.sandbox.tinyfish.io)
- ✅ Session creation
- ✅ SSE streaming
- ✅ Web scraping execution

## 🔧 Testing Live Updates End-to-End

### Step 1: Start the Development Server

```bash
npm run dev
```

Server should be running on `http://localhost:3001`

### Step 2: Navigate to a Batch

1. Go to `http://localhost:3001/projects`
2. Select a project
3. Click on a batch (or create a new one)

### Step 3: Execute Jobs

Click the **"Run Test"** button on the batch detail page.

**What Should Happen:**

1. **Immediate Response:**
   - Jobs table should show jobs moving to "queued" status
   - Progress indicators appear

2. **Live Updates (5-10 seconds):**
   - Jobs move to "running" status
   - **LIVE badge appears** (pulsing animation)
   - Current step updates: "→ Visiting URL..."
   - Progress percentage increases
   - Row has subtle pulse animation

3. **WebSocket Events (check browser console):**
   ```
   [WebSocket] Connected
   [WebSocket] Welcome message: client_xxx
   ```

4. **Completion:**
   - Status changes to "completed" or "failed"
   - **Extracted data appears in columns**
   - Accuracy indicators show (✓✗⚠-)
   - LIVE badge disappears

### Step 4: Verify WebSocket Connection

Open browser console (F12) and check for:

```
[WebSocket] Connecting to ws://localhost:3001/ws
[WebSocket] Connected
```

If you see reconnection attempts, the WebSocket server may not be initialized.

## 🐛 Troubleshooting

### Issue 1: No Live Updates

**Symptoms:** Jobs execute but table doesn't update in real-time

**Checks:**
1. Browser console shows WebSocket connection?
   ```bash
   # Check server logs
   grep "WS" server.log
   ```

2. Are events being published?
   ```bash
   # Check for event publishing
   grep "ExecutionEvents" server.log
   ```

**Solution:** Restart the dev server

### Issue 2: Jobs Stay "Queued"

**Symptoms:** Jobs never move to "running"

**Checks:**
1. Check server logs for execution errors:
   ```bash
   grep "executeEvaJobs" server.log
   ```

2. Verify EVA connectivity:
   ```bash
   node scripts/test-eva-correct-api.js
   ```

**Common Causes:**
- EVA API temporary downtime
- Network connectivity issues
- Rate limiting

### Issue 3: "execution_events" Table Not Found

**Symptoms:** Error in logs about missing table

**Solution:**
```bash
# Run the migration script
node scripts/add-execution-events-table.ts
```

### Issue 4: Jobs Fail Immediately

**Symptoms:** Jobs move to "failed" status without attempting

**Checks:**
1. Check error messages in job details
2. Verify project instructions are set
3. Check column schema is valid

## 📊 Monitoring Live Execution

### Browser DevTools

**Network Tab:**
- Should see WebSocket connection to `ws://localhost:3001/ws`
- Status: 101 Switching Protocols

**Console:**
```javascript
// Check WebSocket messages
// You should see execution events streaming in real-time
```

### Server Logs

```bash
# Watch live execution
tail -f server.log | grep -E "(executeEvaJobs|WebSocket|ExecutionEvents)"
```

**Expected Log Pattern:**
```
[executeEvaJobs] Processing job: xxx
[executeEvaJobs] Job xxx status updated to running
[ExecutionEvents] Broadcast function not initialized, event not sent: job_started
[executeEvaJobs] EVA workflow completed for job: xxx
[WS] Client connected: client_xxx
```

## 🎯 Testing Specific Features

### Test 1: Data-First Display

**What to Look For:**
- Extracted data columns appear FIRST (not URLs)
- Each cell shows validation icon: ✓ (match), ✗ (mismatch), ⚠ (no GT), - (empty)
- Accuracy column shows percentage

### Test 2: Live Monitoring

**What to Look For:**
- LIVE badge appears when job starts
- Current step updates (→ Extracting...)
- Progress bar animates
- Row pulses subtly

### Test 3: Quick View Modal

**Test:**
1. Click eye icon on any job
2. Modal opens showing full details
3. Can see all extracted data
4. Can navigate to full details page

### Test 4: Advanced Filtering

**Test:**
1. Click "Advanced" button
2. Set accuracy filter to "High (≥90%)"
3. Table filters to only high-accuracy jobs
4. Filter count badge appears on button

### Test 5: Column Customization

**Test:**
1. Click "Columns" button
2. Toggle column visibility
3. Table updates immediately
4. Refresh page - settings persist

## 🚀 Quick Test Script

Run this to execute a simple test batch:

```bash
# Create and execute test batch
node scripts/test-complete-flow.js
```

This will:
1. Create a test batch
2. Execute jobs
3. Monitor progress
4. Display live updates
5. Show final results

## 📝 What You Should See

### In the Browser (Jobs Table):

```
┌──────────────────────────────────────────────────────────────┐
│ [✓] Status    Accuracy  Product Name      Price    URL       │
├──────────────────────────────────────────────────────────────┤
│ [✓] 🔵Running  🔴LIVE    ✓ iPhone 15       ✓ $999  klook.com │
│     → Extracting price                                        │
│                                                               │
│ [✓] ✅Complete   100%    ✓ AirPods Pro    ✓ $249  apple.com │
│                          ✓ Wireless                           │
│                                                               │
│ [✓] ⏱Queued     —       - Pending...      -       site.com  │
└──────────────────────────────────────────────────────────────┘
```

### In Browser Console:

```
[WebSocket] Connected
[WebSocket] Welcome message: client_1
Event: job_started - Job xxx started
Event: job_progress - 50% complete
Event: job_completed - Job xxx finished
```

### In Server Logs:

```
[executeEvaJobs] Processing job: xxx URL: https://...
[executeEvaJobs] Job xxx status updated to running
Starting EVA run run_xxx
Created EVA agent session for run run_xxx
[executeEvaJobs] EVA workflow completed for job: xxx
```

## 🎨 Visual Indicators Reference

| Icon/Badge | Meaning |
|------------|---------|
| 🔴 LIVE | Job currently running |
| ✓ Green | Data matches ground truth |
| ✗ Red | Data doesn't match |
| ⚠ Amber | No ground truth to compare |
| - Gray | No data extracted |
| 🔵 Running | Job in progress |
| ✅ Completed | Job finished successfully |
| ❌ Failed | Job encountered error |
| ⏱ Queued | Waiting to execute |

## 💡 Tips

1. **Refresh Not Needed:** Table updates automatically via WebSocket
2. **Multiple Jobs:** Run 5-10 jobs to see concurrent execution
3. **Filter While Running:** Try filtering while jobs execute
4. **Click Eye Icon:** Quick preview without navigating away
5. **Watch Progress:** Live percentage updates every few seconds

## 📞 Still Not Working?

1. Check all dev servers are running (`npm run dev`)
2. Clear browser cache and reload
3. Check browser console for errors
4. Verify WebSocket connection in Network tab
5. Test EVA connectivity: `node scripts/test-eva-correct-api.js`
6. Check server logs for errors

---

**Next Steps:** Execute a test batch and watch the magic happen! 🚀
