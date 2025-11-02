# MINO MVP - Web Automation Platform

> Enterprise web automation with systematic ground truth validation

[![Status](https://img.shields.io/badge/status-in%20development-yellow)]()
[![Next.js](https://img.shields.io/badge/Next.js-14.2.0-black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database (see Database Setup below)
npm run db:push

# Start development server
npm run dev
```

Visit **http://localhost:3000**

## ✨ Features

- **Use-Case Agnostic:** Works for pricing, restaurants, compliance, contacts - any workflow
- **Ground Truth Testing:** Validate accuracy on sample sites before production
- **Dynamic Columns:** Flexible JSONB schema adapts to any CSV structure
- **Fintech Design:** Professional warm theme inspired by Ramp, Mercury, Brex
- **Natural Language Instructions:** Describe workflows in plain English
- **Iterative Refinement:** Improve from 60% to 95% accuracy systematically

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)

1. Create project at [supabase.com](https://supabase.com)
2. Get credentials from Settings > API
3. Update `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.yourproject.supabase.co:5432/postgres
```

4. Push schema:

```bash
npm run db:push
```

### Option 2: Local PostgreSQL

```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb mino_dev

# Update .env.local
DATABASE_URL=postgresql://localhost:5432/mino_dev

# Push schema
npm run db:push
```

## 📁 Project Structure

```
app/
├── layout.tsx              # Root layout with Inter font
├── page.tsx                # Homepage
├── globals.css             # Tailwind + warm fintech theme
└── projects/
    ├── page.tsx            # Projects dashboard ✅
    ├── new/page.tsx        # Create project ✅
    ├── actions.ts          # Server actions ✅
    └── [id]/
        ├── page.tsx        # Project detail ✅
        └── batches/
            ├── actions.ts  # CSV upload logic ✅
            ├── new/        # CSV upload page (TODO)
            └── [batchId]/  # Test execution (TODO)

components/ui/              # shadcn/ui components
db/schema.ts                # Flexible JSONB schema
lib/utils.ts                # Utility functions
```

## 🎨 Design System

### Color Palette
- **Background:** Stone-50 (#fafaf9)
- **Primary:** Amber-600 (#d97706)
- **Accent:** Amber-500 (#f59e0b)
- **Text:** Stone-900 (#1c1917)
- **Border:** Stone-200 (#e7e5e4)

### Typography
- **Font:** Inter
- **Style:** Clean, minimal, professional

## 📊 Database Schema

### Flexible JSONB Design

```typescript
// Batches store dynamic column schemas
columnSchema: {
  name: string
  type: 'text' | 'number' | 'url'
  isGroundTruth: boolean
  isUrl: boolean
}[]

// CSV data with any structure
csvData: Record<string, any>[]

// Dynamic column-level accuracy
columnAccuracies: {
  [columnName]: {
    total: number
    accurate: number
    accuracyPercentage: number
  }
}
```

This allows MINO to handle **any use case** without schema changes.

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

### Hot Reload

The dev server automatically reloads on file changes:
- **Code changes:** Instant Fast Refresh
- **CSS changes:** Auto-reload
- **Database changes:** Run `npm run db:push`

## 🧪 Testing

### Manual Testing

1. **Homepage:** http://localhost:3000
2. **Projects:** http://localhost:3000/projects
3. **Create Project:** Click "New Project"
4. **Test workflow:**
   - Create project with instructions
   - Upload CSV (once built)
   - Run test execution (once built)
   - View results (once built)

### Sample CSV

Create `test-data.csv`:

```csv
url,name,gt_monthly_price,gt_annual_price
https://example.com,Example Corp,$99/mo,$999/yr
https://test.com,Test Inc,$49/mo,$499/yr
https://demo.com,Demo LLC,$199/mo,$1999/yr
```

## 📋 Implementation Status

### ✅ Completed
- Next.js 14 setup
- Tailwind CSS with fintech theme
- Database schema (flexible JSONB)
- Projects CRUD
- Project detail page
- CSV parsing logic
- Auto-detect ground truth columns

### 🚧 In Progress
- CSV upload UI
- Batch management

### 📝 TODO
- Mock test execution
- Results dashboard
- Refinement workflow
- Accuracy trends
- Deployment

See `MVP_PROGRESS.md` for detailed roadmap.

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Deploy to production
vercel --prod
```

### Docker

```bash
# Build image
docker build -t mino-mvp .

# Run container
docker run -p 3000:3000 --env-file .env.local mino-mvp
```

## 📚 Documentation

- **MVP Progress:** See `MVP_PROGRESS.md`
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **Test Status:** See `TEST_STATUS.md`
- **Product Mission:** See `.agent-os/product/mission.md`
- **Tech Stack:** See `.agent-os/product/tech-stack.md`

## 🎯 Use Cases

MINO is use-case agnostic and works for:

1. **Pricing Intelligence:** Extract competitor pricing across 250+ sites
2. **Restaurant Data:** Gather menu items, hours, contact info from 1M+ locations
3. **Compliance Monitoring:** Track regulatory changes from government sites
4. **Contact Extraction:** Build lead lists with emails, phones, addresses
5. **Product Catalogs:** Scrape inventory, specs, availability
6. **Custom Workflows:** Any data extraction need

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Design Inspiration:** Ramp, Mercury, Brex
- **Framework:** Next.js 14
- **Database:** Supabase + Drizzle ORM
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS

---

**Current Status:** Foundation complete, ready for feature development

**Server:** http://localhost:3000 (when running)

Built with ❤️ for power builders who automate the web
