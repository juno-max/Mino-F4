# Technical Stack

## Application Framework
- **Next.js 14** with App Router

## Database System
- **PostgreSQL** (via Supabase)

## JavaScript Framework
- **React 18** with TypeScript

## Import Strategy
- **node** (Node.js module resolution)

## CSS Framework
- **Tailwind CSS v4**

## UI Component Library
- **shadcn/ui** (built on Radix UI primitives)

## Fonts Provider
- **Inter** (from Google Fonts or next/font)

## Icon Library
- **lucide-react**

## Application Hosting
- **Vercel**

## Database Hosting
- **Supabase** (PostgreSQL + real-time subscriptions)

## Asset Hosting
- **Vercel** (static assets) + **S3-compatible storage** (screenshots, exports)

## Deployment Solution
- **Vercel** (continuous deployment from GitHub)

## Code Repository URL
- To be determined (GitHub repository)

---

## Additional Technical Details

### ORM & Database
- **Drizzle ORM** for type-safe database operations
- **Drizzle Kit** for schema migrations

### Authentication
- **Supabase Auth** with Google OAuth
- Row Level Security (RLS) for data isolation
- No username/password authentication

### State Management
- **Zustand** for client-side state

### Form Handling
- **react-hook-form** with **zod** validation
- **@hookform/resolvers** for schema integration

### Queue & Background Jobs
- **BullMQ** with **Redis** for workflow execution queue
- Concurrency management for batch processing

### Visualization
- **React Flow** for workflow diagrams
- **Recharts** or **tremor** for analytics dashboards

### Development Tools
- **pnpm** for package management
- **ESLint 9** for code quality
- **Prettier** for code formatting
- **TypeScript strict mode** enabled

### Monitoring & Error Tracking
- **Sentry** for error tracking and performance monitoring

### Critical Integrations
- **OpenAI API** (GPT-4 for workflow orchestration and instruction parsing)
- **Tetra** (proprietary browser automation infrastructure)
- **AgentQL** (natural language web querying for data extraction)

### Runtime
- **Node.js 20+**
