# MINO MVP - Complete Workflow Guide

## 🎉 Features Built & Ready to Test!

### ✅ What's Working:
1. **CSV Upload** - File picker, auto-detect GT columns, preview
2. **Batch Management** - Create, view, manage batches
3. **Mock Testing** - 60-75% baseline accuracy simulation
4. **Results Dashboard** - Dynamic columns, per-field accuracy
5. **Real-time Progress** - Live execution tracking
6. **Column-Level Metrics** - Detailed accuracy breakdown

---

## 🚀 Complete End-to-End Workflow

### Step 1: Setup Database (One-Time)

```bash
# Follow SUPABASE_SETUP.md to create project
# Update .env.local with credentials
# Then push schema:
npm run db:push
```

### Step 2: Create a Project

1. Visit **http://localhost:3000**
2. Click **"Get Started"** → Redirects to `/projects`
3. Click **"New Project"**
4. Fill in:
   - **Name:** "Competitor Pricing Intelligence"
   - **Description:** "Track pricing across 15 competitors"
   - **Instructions:**
     ```
     Navigate to the /pricing page
     Extract the following fields:
     - Monthly subscription price
     - Annual subscription price
     - Free trial availability
     ```
5. Click **"Create Project"**

### Step 3: Upload CSV Batch

1. On project detail page, click **"Upload CSV"**
2. Upload `test-data/pricing-sample.csv` (or create your own)
3. **Auto-Detection** will identify:
   - ✅ URL column: `url`
   - ✅ Ground Truth columns: `gt_monthly_price`, `gt_annual_price`, `gt_free_trial`
   - ✅ Column types: text, number, url
4. Review **Column Analysis** - should show 3 GT columns detected
5. Fill in **Batch Name:** "Q1 2024 Pricing"
6. Click **"Create Batch"**

### Step 4: Run Test Execution

1. On batch detail page, click **"Run Test"**
2. Select sample size:
   - **10 sites** (fastest, good for quick testing)
   - **20 sites** (more data)
   - **50 sites** (comprehensive, if you have >50 rows)
3. Click **"Run Test (10)"**
4. You'll be redirected to execution results page

### Step 5: View Results

**While Running:**
- Progress bar shows: `3 / 10` sites completed
- Refresh page to see updates (auto-refresh not yet implemented)

**When Complete:**
- **Overall Accuracy:** 60-75% (mock baseline)
- **Stats Cards:**
  - ✅ Successful: 7-8 sites
  - ❌ Failed: 2-3 sites
  - 🎯 Accuracy: 65% (example)

**Column-Level Accuracy:**
- `monthly_price`: 75% (9/12 accurate)
- `annual_price`: 70% (8/12 accurate)
- `free_trial`: 60% (7/12 accurate)

**Results Table:**
- ✅ Green = Accurate match
- ❌ Red = Failed or inaccurate
- Shows extracted vs. expected (ground truth)
- Displays failure reasons for failed sites

### Step 6: Analyze & Iterate (Coming Soon)

**Current Status:** Results dashboard complete
**Next Phase:** Refinement workflow with:
- Edit instructions
- Re-test on same sites
- Track accuracy improvement over iterations
- Trend visualization

---

## 📊 Sample CSV Formats

### Pricing Intelligence
```csv
url,company_name,gt_monthly_price,gt_annual_price,gt_free_trial
https://example.com,Example Corp,$99/mo,$999/yr,Yes
https://acme.com,Acme Inc,$49/mo,$490/yr,14 days
```

### Restaurant Data
```csv
url,name,gt_cuisine,gt_price_range,gt_rating
https://restaurant1.com,Bistro 101,French,$$,4.5
https://restaurant2.com,Taco Stand,Mexican,$,4.2
```

### Contact Information
```csv
url,business_name,gt_email,gt_phone,gt_address
https://company1.com,Company One,contact@co1.com,555-1234,123 Main St
https://company2.com,Company Two,info@co2.com,555-5678,456 Oak Ave
```

### Compliance Monitoring
```csv
url,jurisdiction,gt_last_update,gt_status,gt_compliance_date
https://regulator1.gov,California,2024-01-15,Active,2024-02-01
https://regulator2.gov,Texas,2024-01-10,Pending,2024-03-01
```

---

## 🧪 Testing Checklist

### Test 1: Project Creation ✅
- [ ] Create project with natural language instructions
- [ ] Project appears in dashboard
- [ ] Can view project detail
- [ ] Instructions displayed correctly

### Test 2: CSV Upload ✅
- [ ] Upload `pricing-sample.csv`
- [ ] Ground truth columns auto-detected (gt_ prefix)
- [ ] URL column auto-detected
- [ ] Column types inferred correctly
- [ ] Data preview shows first 5 rows
- [ ] Batch created successfully

### Test 3: Batch Detail ✅
- [ ] Stats display correctly (15 sites, 5 columns, 3 GT)
- [ ] Column schema lists all fields
- [ ] Data preview table shows 10 rows
- [ ] "Run Test" button visible

### Test 4: Mock Execution ✅
- [ ] Select 10 site sample
- [ ] Test starts and creates execution record
- [ ] Redirects to results page
- [ ] Progress shows completion

### Test 5: Results Dashboard ✅
- [ ] Overall accuracy 60-75%
- [ ] Success/failed counts correct
- [ ] Per-column accuracy displayed
- [ ] Progress bars colored (green >90%, amber >70%, red <70%)
- [ ] Results table shows all sites
- [ ] Extracted vs. GT comparison visible
- [ ] Failure reasons shown for failed sites

---

## 🎯 Key Features Demonstrated

### 1. Use-Case Agnostic ✅
Works for ANY CSV structure:
- Pricing data
- Restaurant info
- Contact details
- Compliance records
- Custom workflows

### 2. Ground Truth Auto-Detection ✅
Automatically finds GT columns with patterns:
- `gt_*` (e.g., `gt_price`)
- `*_gt` (e.g., `price_gt`)
- `*_ground_truth`
- `*_expected`
- `expected_*`

### 3. Dynamic Column Schema ✅
JSONB storage adapts to any CSV:
- No hardcoded fields
- Flexible column types
- Per-column accuracy tracking
- Works with 3 columns or 30 columns

### 4. Mock Testing (60-75% Baseline) ✅
Realistic simulation:
- 1-3 second delays per site
- 15-25% failure rate
- Partial matches (fuzzy comparison)
- Various failure categories
- Matches ground truth ~65% of time

### 5. Professional Fintech Design ✅
- Warm stone/amber palette
- Dense data tables
- Large metrics prominently displayed
- Subtle shadows
- Minimal motion
- Clean Inter typography

---

## 📈 What to Expect

### Baseline Accuracy: 60-75%
This is **intentional** to demonstrate the refinement workflow:
1. Initial test: 65% accuracy
2. After refinement: 80% accuracy
3. After 2nd refinement: 90% accuracy
4. After 3rd refinement: 95%+ accuracy

### Common "Failures" (Simulated)
- **Element not found**: 30%
- **Timeout**: 20%
- **Incorrect format**: 20%
- **Missing data**: 15%
- **Navigation error**: 15%

These simulate real-world scraping challenges.

---

## 🚢 Current Status

### ✅ Complete
- Project CRUD
- CSV upload with auto-detection
- Batch management
- Mock execution engine
- Results dashboard
- Column-level accuracy
- Progress tracking
- Failure categorization

### 🚧 Next Phase (Refinement Workflow)
- Edit instructions on project
- Re-test with updated instructions
- Compare accuracy before/after
- Trend visualization (Recharts)
- Show improvement delta
- A/B testing multiple instructions

---

## 🎨 Design Highlights

### Color-Coded Accuracy
- **Green (>90%)**: Excellent accuracy
- **Amber (70-90%)**: Good, needs minor refinement
- **Red (<70%)**: Needs significant improvement

### Dense Data Display
Following fintech patterns (Ramp, Mercury):
- Compact tables with lots of information
- Large metrics (accuracy %) prominently displayed
- Subtle visual hierarchy
- Professional, not playful

### Warm Palette
- **Stone-50** backgrounds: #fafaf9
- **Amber-600** primary: #d97706
- **Amber-500** accent: #f59e0b
- Clean, trustworthy, professional

---

## 💡 Tips for Testing

1. **Use realistic CSV data** - Better simulation
2. **Test with 10-20 sites first** - Faster feedback
3. **Look for patterns in failures** - Guides refinement
4. **Check column-level accuracy** - Find weak spots
5. **Refresh results page** - See progress updates

---

## 🐛 Troubleshooting

### CSV Upload Failed
- Check URL column exists (`url`, `website`, `site`)
- Verify CSV has headers
- Make sure file isn't empty

### No Ground Truth Detected
- Use `gt_` prefix (e.g., `gt_price`)
- Or other patterns: `_gt`, `_expected`, `expected_`
- Can still run test without GT (won't measure accuracy)

### Test Not Starting
- Check database connection
- Verify batch was created
- Look at browser console for errors

### Results Not Updating
- Refresh page manually (auto-refresh coming)
- Check execution status field
- Wait ~30-60 seconds for 10 sites

---

## 📝 Next Steps

1. **Setup database** (if not done)
2. **Create test project**
3. **Upload sample CSV**
4. **Run 10-site test**
5. **Review results**
6. **Iterate & improve** (refinement workflow coming)

---

**Server Running:** http://localhost:3000

**Sample Data:** `test-data/pricing-sample.csv`

**Ready to test!** 🚀
