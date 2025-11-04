# Batch Creation Debugging Guide

## ✅ Backend API is Working!

Your backend at `http://localhost:3000` is successfully handling batch creation.

**Test Results:**
- ✅ Project created successfully
- ✅ Batch creation from CSV upload working
- ✅ CSV parsing working (3 rows parsed)
- ✅ Column schema auto-detection working (detected URL and ground truth columns)
- ✅ Batch listing API working

---

## 🔍 Testing the Frontend Flow

### Step 1: Open the Frontend

Open your browser and go to:
```
http://localhost:3001
```

### Step 2: Check Browser Console

Open the browser console (F12 or Cmd+Option+I) and check for:
- ✅ API calls to `localhost:3000` (should NOT be localhost:3001)
- ✅ No CORS errors
- ✅ No 404 errors for `/api/projects` or `/api/batches`

### Step 3: Verify Projects Load

You should see:
- "Test Salon Project" in the projects list
- No mock data (no "ClassPass", "Coca-Cola", etc.)

If you see mock data, verify:
```bash
cat /Users/junochen/Documents/github/mino-v2/.env.local | grep MOCK_MODE
# Should show: NEXT_PUBLIC_MOCK_MODE=false
```

### Step 4: Test Batch Creation

1. **Click "Add New Batch"** button
2. **Select Project**: Choose "Test Salon Project"
3. **Upload CSV**: Create a simple test CSV:

```csv
website,service,location,gt_price
https://example-salon.com,Haircut,New York,45
https://another-salon.com,Manicure,Los Angeles,35
```

4. **Enter Goal**:
```
Extract the price for {service} at this salon in {location}
```

5. **Click "Preview Batch"**: Should show:
   - CSV preview with 2 rows
   - Parameterized goals showing actual values

6. **Click "Run All"**: Should create the batch

---

## 🐛 Common Issues & Fixes

### Issue 1: "Failed to create batch"

**Check Backend Logs:**
```bash
# Look for errors in the terminal running mino-ux-2
tail -f /path/to/backend/logs
```

**Check Browser Network Tab:**
- Look for failed POST to `/api/batches`
- Check the request payload
- Check the response body

**Verify FormData is sent correctly:**
```javascript
// Should see in Network tab:
Content-Type: multipart/form-data
Body:
  - project_id: <uuid>
  - name: <filename>
  - goal: <goal text>
  - csv_file: <File object>
```

### Issue 2: Frontend Shows Mock Data

**Fix:**
```bash
cd /Users/junochen/Documents/github/mino-v2

# Update .env.local
echo "NEXT_PUBLIC_MOCK_MODE=false" >> .env.local

# Clear Next.js cache and restart
rm -rf .next
npm run dev
```

**Verify in browser console:**
```javascript
// Should show: "http://localhost:3000"
console.log(process.env.NEXT_PUBLIC_API_URL)

// Should show: "false"
console.log(process.env.NEXT_PUBLIC_MOCK_MODE)
```

### Issue 3: CORS Errors

If you see:
```
Access to fetch at 'http://localhost:3000/api/batches' from origin 'http://localhost:3001' has been blocked by CORS
```

**This shouldn't happen** since both are Next.js apps. But if it does:

1. Check both servers are running:
```bash
lsof -i :3000  # Backend (mino-ux-2)
lsof -i :3001  # Frontend (mino-v2)
```

2. Verify API URL in frontend:
```bash
cat /Users/junochen/Documents/github/mino-v2/.env.local | grep API_URL
```

### Issue 4: CSV Parsing Fails

**Check CSV Format:**
- Must use commas as delimiter
- First row must be headers
- No empty lines
- UTF-8 encoding

**Test CSV manually:**
```bash
curl -X POST http://localhost:3000/api/batches \
  -F project_id=<PROJECT_ID> \
  -F name="Debug Test" \
  -F goal="Test goal" \
  -F csv_file=@your_file.csv
```

---

## 📊 API Endpoints Reference

### Create Batch
```bash
POST http://localhost:3000/api/batches
Content-Type: multipart/form-data

FormData:
  - project_id: <uuid>
  - name: <string>
  - goal: <string> (optional)
  - csv_file: <File>

Response:
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "name": "Test Batch 1",
  "description": "Extract price for service",
  "columnSchema": [...],
  "csvData": [...],
  "totalSites": 3,
  "createdAt": "2025-11-04T...",
  ...
}
```

### List Batches
```bash
GET http://localhost:3000/api/batches?project_id=<uuid>

Response: [
  {
    "id": "<uuid>",
    "name": "Test Batch 1",
    "totalSites": 3,
    ...
  }
]
```

### List Projects
```bash
GET http://localhost:3000/api/projects

Response: [
  {
    "id": "<uuid>",
    "name": "Test Salon Project",
    "instructions": "...",
    ...
  }
]
```

---

## 🧪 Manual Testing Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] Frontend .env.local has `NEXT_PUBLIC_MOCK_MODE=false`
- [ ] Frontend .env.local has `NEXT_PUBLIC_API_URL=http://localhost:3000`
- [ ] Browser console shows no errors
- [ ] Can see "Test Salon Project" in projects list
- [ ] Can open "Add New Batch" modal
- [ ] Can select project from dropdown
- [ ] Can upload CSV file
- [ ] Can see CSV preview
- [ ] Can see parameterized goals
- [ ] Can click "Run All" or "Run a sample of 20"
- [ ] Batch appears in batches list
- [ ] No mock data visible anywhere

---

## 🔧 Quick Verification Commands

```bash
# Check backend is running and has projects
curl -s http://localhost:3000/api/projects | jq length
# Should show: 1 (or more)

# Check batch was created
PROJECT_ID="c91b9f11-5a78-4057-9349-61153b2b4f5f"
curl -s "http://localhost:3000/api/batches?project_id=$PROJECT_ID" | jq length
# Should show: 2 (or more)

# Check frontend environment
cat /Users/junochen/Documents/github/mino-v2/.env.local
# Should show MOCK_MODE=false and API_URL=localhost:3000

# Check both ports are listening
lsof -i :3000 | grep LISTEN  # Backend
lsof -i :3001 | grep LISTEN  # Frontend
```

---

## 📸 What You Should See in Frontend

### Projects Page
```
Projects List:
  - Test Salon Project
    Description: Testing batch creation
    Instructions: Extract the price for {service}...
```

### Batches Modal
```
Add New Batch to Test Salon Project
  Project: [Test Salon Project ▼]
  Upload CSV File: [Browse files] or drag and drop
  Goal: Extract the price for {service}...

  Available columns: {website} {service} {location} {gt_price}
```

### Batch Preview
```
Preview Batch

  Validation Stats:
    ✓ 2 valid URLs
    ⚠ 12 duplicates removed (mock)
    ✓ All required columns present

  Parameterized Goals Preview:
    Row 1: Extract the price for Haircut at this salon in New York
    Row 2: Extract the price for Manicure at this salon in Los Angeles

  CSV Data Preview:
    website                      | service  | location    | gt_price
    https://example-salon.com    | Haircut  | New York    | 45
    https://another-salon.com    | Manicure | Los Angeles | 35
```

---

## 🎯 Success Indicators

When everything is working, you'll see:
1. ✅ Real project data (not mock "ClassPass", etc.)
2. ✅ Batch creation completes successfully
3. ✅ Batch appears in batches list immediately
4. ✅ Can click on batch to view details
5. ✅ Can run execution on the batch
6. ✅ Browser Network tab shows calls to localhost:3000
7. ✅ No console errors

---

## 🆘 Still Having Issues?

### Check Backend Server Health
```bash
# Should return project data
curl http://localhost:3000/api/projects
```

### Check Frontend is Using Real API
```javascript
// In browser console:
fetch('http://localhost:3000/api/projects')
  .then(r => r.json())
  .then(data => console.log('Projects:', data))
```

### Restart Everything
```bash
# Terminal 1: Backend
cd /Users/junochen/Documents/github/mino-ux-2
pkill -f "next dev"
npm run dev

# Terminal 2: Frontend
cd /Users/junochen/Documents/github/mino-v2
pkill -f "next dev -p 3001"
rm -rf .next
npm run dev
```

---

**Current Status:**
- ✅ Backend API working (tested with curl)
- ✅ Batch creation endpoint functional
- ✅ CSV parsing working
- ⏳ Frontend connection (needs user verification)

**Next Step:** Open `http://localhost:3001` in your browser and try creating a batch through the UI!
