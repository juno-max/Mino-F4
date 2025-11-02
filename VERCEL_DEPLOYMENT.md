# Vercel Deployment Guide

## 🚀 Deploy MINO MVP to Vercel (5 Minutes)

### Prerequisites

✅ Git repository initialized (done)
✅ Code committed (done)
✅ Supabase database setup (or ready to set up)

---

## Option 1: Deploy via Vercel Dashboard (Easiest)

### Step 1: Push to GitHub

```bash
# Create a new repository on GitHub
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/mino-mvp.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to **https://vercel.com**
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository: `mino-mvp`
5. Click **"Import"**

### Step 3: Configure Environment Variables

In the "Configure Project" screen, add these environment variables:

```
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Get these values from:**
- Supabase Dashboard → Settings → API
- Supabase Dashboard → Settings → Database

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait ~2-3 minutes for build
3. Your app will be live at: `https://mino-mvp.vercel.app`

---

## Option 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Deploy

```bash
# Deploy to production
vercel --prod

# Or deploy to preview first
vercel
```

### Step 4: Set Environment Variables

```bash
# Add environment variables
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Paste each value when prompted
```

### Step 5: Redeploy with Environment Variables

```bash
vercel --prod
```

---

## Post-Deployment Setup

### 1. Setup Database Schema

Once deployed, push your database schema:

```bash
# Locally, with Supabase credentials in .env.local
npm run db:push
```

Or use Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Run the schema creation manually (optional)

### 2. Test Deployment

Visit your Vercel URL:
- Homepage: `https://your-app.vercel.app`
- Projects: `https://your-app.vercel.app/projects`
- Create project and test full workflow

---

## Environment Variables Reference

### Required for Production:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Supabase API
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Optional:

```env
# For production optimizations
NODE_ENV=production
```

---

## Vercel Configuration

The project is configured with:

**File:** `next.config.js`
```javascript
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // For CSV uploads
    },
  },
}
```

**File:** `.vercelignore`
- Ignores: test-data, documentation, .agent-os

---

## Deployment Checklist

### Before Deploy:
- [x] Git initialized
- [x] Code committed
- [x] .env.local.example created
- [x] .gitignore excludes .env.local
- [x] Database connection optional at build time
- [x] Dynamic routes configured

### After Deploy:
- [ ] Environment variables set in Vercel
- [ ] Database schema pushed
- [ ] Test homepage loads
- [ ] Test project creation
- [ ] Test CSV upload
- [ ] Test mock execution
- [ ] Review logs for errors

---

## Troubleshooting

### Build Fails with Database Connection Error

**Fix:** Database connection is now optional at build time. The app will work without it and connect at runtime.

### Environment Variables Not Working

**Fix:**
1. Check they're set in Vercel Dashboard → Settings → Environment Variables
2. Redeploy after adding variables
3. Make sure variable names match exactly

### CSV Upload Fails

**Fix:**
1. Check `serverActions.bodySizeLimit` in next.config.js
2. Increase if needed for larger CSVs
3. Redeploy

### Database Connection Error in Production

**Fix:**
1. Verify DATABASE_URL is correct
2. Check Supabase connection pooling is enabled
3. Test connection string locally first

---

## Continuous Deployment

Once connected to GitHub:

1. **Every push to main** → Auto-deploys to production
2. **Every PR** → Creates preview deployment
3. **Branch deploys** → Create staging environments

### Deploy Workflow:

```bash
# Make changes
git add .
git commit -m "Add feature X"
git push

# Vercel automatically deploys!
# Check deployment: https://vercel.com/dashboard
```

---

## Custom Domain (Optional)

### Add Your Domain:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click **"Add Domain"**
3. Enter your domain: `mino.yourdomain.com`
4. Follow DNS configuration instructions
5. Wait for DNS propagation (~5-60 minutes)

---

## Performance Optimizations

### Already Configured:

- ✅ Static page generation where possible
- ✅ Dynamic routes for data-fetching pages
- ✅ Image optimization (Next.js built-in)
- ✅ Code splitting
- ✅ Edge caching

### Monitor:

- Vercel Analytics (built-in)
- Real-time logs
- Build times
- Function execution times

---

## Monitoring & Logs

### View Logs:

1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"**
3. Click latest deployment
4. Click **"Runtime Logs"**

### Monitor Performance:

- **Analytics:** Vercel Dashboard → Analytics
- **Errors:** Check Runtime Logs
- **Database:** Supabase Dashboard → Logs

---

## Rollback (If Needed)

If deployment has issues:

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click **"⋯"** → **"Promote to Production"**

Instant rollback!

---

## Current Status

✅ **Project ready for deployment**

**What's deployed:**
- Homepage
- Projects CRUD
- CSV Upload
- Mock Testing
- Results Dashboard

**What's needed:**
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

**Estimated time:** 5-10 minutes

---

## Quick Deploy Commands

```bash
# Option A: GitHub + Vercel Dashboard (Recommended)
git remote add origin https://github.com/YOUR_USERNAME/mino-mvp.git
git push -u origin main
# Then import in Vercel dashboard

# Option B: Vercel CLI
vercel --prod
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

---

**Ready to deploy!** 🚀

Visit: https://vercel.com/new
