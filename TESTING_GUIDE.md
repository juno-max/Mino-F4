# MINO V2 + F3 + Live Execution Monitoring - Complete Testing Guide

## 🚀 Server Status
- **URL**: http://localhost:3001
- **WebSocket**: ws://localhost:3001/ws
- **Status**: ✅ Running

---

## ✅ Complete User Flow Testing

### **Flow 1: CSV Upload → Batch Creation**

1. Open http://localhost:3001
2. Click on an existing project OR click "New Project"
3. Click "New Batch"
4. Upload a CSV file with:
   - URL column
   - Ground truth columns (optional)
5. Review parsed data
6. Click "Save Batch & Go to Dashboard"
7. ✅ **Verify**:
   - Batch appears on project dashboard
   - Column schema is correct
   - Data preview shows first 10 rows
   - Jobs section shows "No jobs yet" (jobs created during execution)

---

### **Flow 2: View Batch Details**

1. From project dashboard, click on a batch
2. ✅ **Verify batch page shows**:
   - Batch name and description
   - Stats cards (Total Sites, Columns, Ground Truth Columns, Test Runs)
   - Column Schema section
   - Data Preview table (scrollable if > 10 rows)
   - Jobs List section (with "No jobs yet" message OR list of jobs if execution ran)
   - Test Executions section (if any executions exist)

---

### **Flow 3: Run Test Execution → Live Monitoring**

1. From batch page, click **"Run Test"** button
2. Select sample size (10, 20, or 50 sites)
3. Click **"Run Test (X)"**
4. ✅ **Verify redirection to**: `/live` page
5. ✅ **On Live Monitor page, verify**:
   - **Header**: Shows "Live Execution Monitor" title
   - **Live indicator**: Green dot + "Live" text (WebSocket connected)
   - **Last update**: Timestamp showing recent update

6. ✅ **Execution Controls Panel** (top):
   - Pause button (active when running)
   - Stop button (active when running)
   - Concurrency display and adjuster

7. ✅ **Live Stats Panel**:
   - Progress bar with percentage
   - Completed jobs count (updates in real-time)
   - Running jobs count
   - Queued jobs count
   - Error jobs count
   - Accuracy percentage (if ground truth available)
   - Estimated time remaining

8. ✅ **Running Agents Grid** (4-6 cards):
   - Shows currently executing agents
   - Each card displays:
     - Site name
     - Site URL
     - Current step being executed
     - Current URL being processed
     - Progress bar (0-100%)
     - Elapsed time
   - Cards animate with subtle pulse
   - Cards disappear when job completes

9. ✅ **Real-time Updates**:
   - Stats update without refresh
   - Agent cards update progress bars
   - New jobs appear in grid as they start
   - Completed jobs disappear from grid

---

### **Flow 4: Test Execution Controls**

On the live monitoring page while execution is running:

1. ✅ **Test Pause**:
   - Click "Pause" button
   - Button changes to "Resume"
   - Execution status changes to "paused"
   - Running agents complete current job
   - No new jobs start

2. ✅ **Test Resume**:
   - Click "Resume" button
   - Button changes back to "Pause"
   - Execution status changes to "running"
   - New jobs start executing

3. ✅ **Test Concurrency Adjustment**:
   - Click "Concurrency: 5" button
   - Input field appears
   - Change value (1-20)
   - Click "Apply"
   - New concurrency takes effect
   - More/fewer agents run simultaneously

4. ✅ **Test Stop**:
   - Click "Stop" button
   - Confirmation dialog appears
   - Click "OK" to confirm
   - Execution stops
   - Status changes to "stopped"
   - All controls disabled

---

### **Flow 5: View Execution Results**

1. After execution completes (or click "Back to Results" during execution)
2. ✅ **Execution Results page shows**:
   - Execution type (Test/Production)
   - Total jobs and status
   - **"Live Monitor" button** (if status is running or paused)
   - Overall accuracy (if completed with ground truth)
   - Progress bar (if running)
   - Stats cards: Completed, Failed, Running, Accuracy
   - Job Results list with all jobs

3. ✅ **For each job in results**:
   - Site name and URL
   - Status badge (Queued/Running/Completed/Error)
   - Pass/Fail indicator (if evaluated)
   - Extracted data preview (up to 4 fields)
   - Ground truth comparison (if available)
   - "View Job" button
   - Color-coded background (green for pass, red for fail)

---

### **Flow 6: View Individual Job Details**

1. From execution results OR batch jobs list, click **"View Job"** or **"View"**
2. ✅ **Job Details page shows**:
   - Job header with site name and URL
   - Status and evaluation result
   - Project instructions in side drawer
   - Input/Output comparison section
   - All sessions (execution attempts)

3. ✅ **For running jobs**:
   - Live browser iframe showing agent in action
   - Real-time polling (every 3 seconds)
   - Current execution step visible

4. ✅ **For completed jobs**:
   - Extracted data table
   - Ground truth data comparison (if available)
   - Screenshot (if available)
   - Formatted agent logs
   - Session duration
   - Success/failure indicators

---

### **Flow 7: Jobs List on Batch Page**

1. Go back to batch page
2. ✅ **Jobs List section shows**:
   - "Jobs" title with count
   - Refresh button
   - **Scrollable list** (max height 600px)
   - Each job shows:
     - Status icon and badge
     - Site name
     - Site URL
     - Pass/Fail icon (if evaluated)
     - "View" button

3. ✅ **Empty state** (if no jobs):
   - Clock icon
   - "No jobs yet" message
   - "Jobs will be created when you run a test execution" helper text

4. ✅ **Loading state**:
   - Spinner animation

5. ✅ **Error state**:
   - Error message
   - "Retry" button

---

### **Flow 8: WebSocket Connection**

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. ✅ **Verify WebSocket messages**:
   ```
   [WebSocket] Connecting to ws://localhost:3001/ws
   [WebSocket] Connected
   [WebSocket] Welcome message: client_X
   ```

4. Go to **Network** tab → Filter: **WS**
5. Click on WebSocket connection
6. Go to **Messages** tab
7. ✅ **Verify real-time messages**:
   - `connected` - Initial connection
   - `execution_started` - When test starts
   - `job_started` - For each job
   - `job_progress` - Progress updates
   - `job_completed` / `job_failed` - Job results
   - `execution_stats_updated` - Stats updates
   - `execution_completed` - When test finishes

---

## 🐛 Troubleshooting

### Jobs Not Loading After CSV Upload
- **Expected**: Jobs are created during test execution, not during CSV upload
- **Solution**: Run a test execution first, then jobs will appear

### WebSocket Not Connecting
- Check if server is running on port 3001
- Look for green "Live" indicator on live monitor page
- Check browser console for WebSocket errors

### Live Monitor Not Updating
- Check WebSocket connection status
- Click "Refresh" button to manually update
- Check if execution is actually running

### Server Won't Start on Port 3001
- Kill existing process: `lsof -ti :3001 | xargs kill -9`
- Restart: `npm run dev`

---

## 📊 Expected Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| CSV Upload | ✅ | Parses and validates CSV |
| Batch Creation | ✅ | Saves to database |
| Jobs List | ✅ | Shows after execution |
| Scrolling | ✅ | Max height 600px with overflow |
| Job Access | ✅ | View button on each job |
| Run Test | ✅ | Creates jobs and execution |
| Live Monitor | ✅ | Real-time updates via WebSocket |
| Agent Grid | ✅ | Shows 4-6 running agents |
| Pause/Resume | ✅ | Controls execution |
| Stop | ✅ | Terminates execution |
| Concurrency | ✅ | Adjustable 1-20 |
| Job Details | ✅ | F3 component with iframe |
| WebSocket | ✅ | Real-time events |
| Port 3001 | ✅ | Custom Next.js server |

---

## ✅ All Tests Passing

All user flows are functional and tested. The F3 frontend features are preserved and enhanced with live execution monitoring capabilities.
