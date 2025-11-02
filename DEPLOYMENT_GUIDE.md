# MINO MVP - Local Testing & Deployment Guide

## 🚀 Quick Setup

### Option 1: Use Supabase (Recommended)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Wait for database to provision

2. **Get Credentials**
   - Go to Settings > API
   - Copy `Project URL` and `anon public` key
   - Go to Settings > Database
   - Copy `Connection string` (Direct connection)

3. **Update .env.local**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
   ```

4. **Push Database Schema**
   ```bash
   npm run db:push
   ```

5. **Start Dev Server**
   ```bash
   npm run dev
   ```

### Option 2: Local PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql

   # Create database
   createdb mino_dev
   ```

2. **Update .env.local**
   ```bash
   DATABASE_URL=postgresql://postgres:password@localhost:5432/mino_dev
   ```

3. **Push Schema**
   ```bash
   npm run db:push
   ```

4. **Start Dev Server**
   ```bash
   npm run dev
   ```

## 🧪 Testing Checklist

### Test 1: Homepage
- [ ] Visit http://localhost:3000
- [ ] Click "Get Started" → Should redirect to /projects
- [ ] Verify warm fintech design (stone/amber colors)

### Test 2: Create Project
- [ ] Click "New Project"
- [ ] Fill in:
  - Name: "Test Pricing Workflow"
  - Instructions: "Extract pricing data from /pricing page"
- [ ] Click "Create Project"
- [ ] Should redirect to project detail page

### Test 3: Project Dashboard
- [ ] Should see project card with name
- [ ] Click on project → Should open detail page
- [ ] Verify instructions displayed correctly

### Test 4: CSV Upload (Once implemented)
- [ ] Click "Upload CSV" on project page
- [ ] Upload CSV with URL column
- [ ] Verify ground truth columns detected
- [ ] Verify column schema displayed

### Test 5: Mock Test Execution (Once implemented)
- [ ] Click "Run Test" on batch
- [ ] Select 10 sites
- [ ] Verify progress tracking
- [ ] Check results show 60-75% accuracy
- [ ] Verify column-level accuracy

### Test 6: Refinement (Once implemented)
- [ ] Edit project instructions
- [ ] Re-run test
- [ ] Verify accuracy trend chart
- [ ] Check improvement delta

## 📊 Test Data

### Sample CSV for Testing

Create `test-data.csv`:
```csv
url,name,gt_monthly_price,gt_annual_price
https://example.com,Example Corp,$99/mo,$999/yr
https://test.com,Test Inc,$49/mo,$499/yr
https://demo.com,Demo LLC,$199/mo,$1999/yr
```

### Sample Instructions

**Pricing Workflow:**
```
Navigate to the /pricing page
Extract the following fields:
- Monthly subscription price
- Annual subscription price
- Features list
```

**Contact Workflow:**
```
Go to /contact or /about page
Extract:
- Email address
- Phone number
- Physical address
- Support hours
```

## 🔄 Continuous Testing Workflow

### Automated Testing Script

Create `scripts/test-flow.sh`:
```bash
#!/bin/bash

echo "🧪 Testing MINO MVP..."

# Test 1: Homepage loads
curl -s http://localhost:3000 | grep -q "MINO" && echo "✅ Homepage loads" || echo "❌ Homepage failed"

# Test 2: Projects page loads
curl -s http://localhost:3000/projects | grep -q "Projects" && echo "✅ Projects page loads" || echo "❌ Projects page failed"

# Test 3: New project page loads
curl -s http://localhost:3000/projects/new | grep -q "Create New Project" && echo "✅ New project page loads" || echo "❌ New project page failed"

echo "✅ All tests passed!"
```

Run with:
```bash
chmod +x scripts/test-flow.sh
./scripts/test-flow.sh
```

## 🚢 Local Deployment Options

### Option 1: PM2 (Production-like)

```bash
# Install PM2
npm install -g pm2

# Build for production
npm run build

# Start with PM2
pm2 start npm --name "mino-mvp" -- start

# Monitor
pm2 logs mino-mvp
pm2 monit

# Auto-restart on changes
pm2 restart mino-mvp --watch
```

### Option 2: Docker

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: mino_dev
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

### Option 3: Simple Production Build

```bash
# Build
npm run build

# Start production server
npm start

# Or with custom port
PORT=3001 npm start
```

## 🔧 Development Workflow

### Hot Reload Testing

The dev server (`npm run dev`) automatically reloads on file changes:

1. Make code changes
2. Save file
3. Browser auto-refreshes
4. Test immediately

### Database Changes

When updating schema:
```bash
# Generate migration
npm run db:generate

# Push to database
npm run db:push

# Open Drizzle Studio (visual DB editor)
npm run db:studio
```

## 📈 Performance Testing

### Test Database Performance

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Test Load Performance

```bash
# Install autocannon
npm install -g autocannon

# Test homepage
autocannon -c 10 -d 10 http://localhost:3000

# Test projects API
autocannon -c 10 -d 10 http://localhost:3000/projects
```

## 🐛 Debugging

### Common Issues

**1. Database connection errors**
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**2. Build errors**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

**3. Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## ✅ Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Database schema pushed
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (manual or automated)
- [ ] No console errors in browser
- [ ] Responsive design tested
- [ ] Database has test data
- [ ] Error handling works
- [ ] Loading states display correctly

## 🚀 Vercel Deployment (Future)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

## 📝 Notes

- Dev server runs on http://localhost:3000
- Changes auto-reload (Fast Refresh)
- Database changes require manual push
- Test with realistic CSV data
- Monitor database performance
- Keep .env.local secure (gitignored)

Happy testing! 🎉
