# 🚀 MINO UX-2: START HERE

**Date**: November 6, 2025
**Current Branch**: `feature/live-execution-monitoring`
**Status**: ✅ All new components integrated, ready for Sprint 1

---

## 📋 QUICK STATUS

### What's Working ✅
- 41 new components successfully integrated
- Zero TypeScript errors
- Clean git status (all committed)
- Dev server running on port 3001
- All batch management, job execution, and monitoring features functional

### What's Next 🎯
**Sprint 1: UX Polish** (Week 1, 15-20 hours)
Make current features visually excellent and professionally polished.

---

## 🎬 IMMEDIATE ACTIONS (THIS WEEK)

### Day 1: Hero Visual Enhancements (4-6 hours)

#### 1. Create MetricCard Component (1.5h)
**File**: `components/batch-dashboard/MetricCard.tsx`

```tsx
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  icon: React.ReactElement<LucideIcon>
  label: string
  value: string | number
  subtitle?: string
  trend?: React.ReactNode // Sparkline or ProgressBar
  className?: string
}

export function MetricCard({ icon, label, value, subtitle, trend }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
      {trend && (
        <div className="mt-2">{trend}</div>
      )}
    </div>
  )
}
```

**Test**: Import and use in RunningModeHero

---

#### 2. Create Sparkline Component (1h)
**File**: `components/batch-dashboard/Sparkline.tsx`

```tsx
interface SparklineProps {
  data: number[] // Array of values
  color?: 'emerald' | 'blue' | 'red' | 'amber'
  height?: number
}

export function Sparkline({ data, color = 'blue', height = 24 }: SparklineProps) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = ((max - value) / range) * 100
    return `${x},${y}`
  }).join(' ')

  const colorMap = {
    emerald: 'stroke-emerald-500',
    blue: 'stroke-blue-500',
    red: 'stroke-red-500',
    amber: 'stroke-amber-500'
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ height }}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className={colorMap[color]}
      />
    </svg>
  )
}
```

**Test**: Add to MetricCard with sample data `[1,3,2,5,4,6,5,7]`

---

#### 3. Create DonutChart Component (1.5h)
**File**: `components/batch-dashboard/DonutChart.tsx`

```tsx
interface DonutChartProps {
  data: Array<{
    label: string
    value: number
    color: 'emerald' | 'red' | 'blue' | 'amber'
  }>
  centerText: string
  centerLabel: string
}

export function DonutChart({ data, centerText, centerLabel }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -90 // Start at top

  const colorMap = {
    emerald: '#10b981',
    red: '#ef4444',
    blue: '#3b82f6',
    amber: '#f59e0b'
  }

  return (
    <div className="relative" style={{ width: 120, height: 120 }}>
      <svg viewBox="0 0 120 120" className="transform -rotate-90">
        {data.map((item, index) => {
          const percentage = item.value / total
          const angle = percentage * 360
          const radius = 50
          const circumference = 2 * Math.PI * radius
          const offset = circumference * (1 - percentage)

          const segment = (
            <circle
              key={index}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={colorMap[item.color]}
              strokeWidth="20"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(${currentAngle} 60 60)`}
            />
          )
          currentAngle += angle
          return segment
        })}
        <circle cx="60" cy="60" r="30" fill="white" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-900">{centerText}</div>
        <div className="text-xs text-gray-500">{centerLabel}</div>
      </div>
    </div>
  )
}
```

**Test**: Use in CompletedModeHero with pass/fail data

---

#### 4. Update RunningModeHero (1-2h)
**File**: `components/batch-dashboard/RunningModeHero.tsx`

**Changes**:
1. Replace stats grid with MetricCard components
2. Add Sparkline to success rate metric
3. Add ProgressBar to progress metric
4. Reduce padding from `p-6` to `p-4`
5. Add gradient background: `bg-gradient-to-r from-blue-50 to-emerald-50`

**Reference**: See `COMPREHENSIVE_UX_MASTER_PLAN.md` lines 404-496 for complete code

---

#### 5. Update CompletedModeHero (1-2h)
**File**: `components/batch-dashboard/CompletedModeHero.tsx`

**Changes**:
1. Add DonutChart for pass/fail breakdown
2. Add MetricCard grid for key metrics
3. Add ErrorBadge component for top errors
4. Add "Retry failed jobs" button if errors exist

**Reference**: See `COMPREHENSIVE_UX_MASTER_PLAN.md` lines 530-621 for complete code

---

### Day 2: Quick Wins (5-6 hours)

#### 1. Toast Notification System (2h)

**Step 1**: Install Sonner
```bash
npm install sonner
```

**Step 2**: Create toast helper
**File**: `lib/toast.ts`

```typescript
import { toast as sonnerToast } from 'sonner'

export const toast = {
  jobCompleted: (jobId: string, siteName: string, accuracy: number) => {
    sonnerToast.success('Job completed', {
      description: `${siteName} - ${accuracy}% accuracy`,
      action: {
        label: 'View',
        onClick: () => window.location.href = `/jobs/${jobId}`
      }
    })
  },

  jobFailed: (jobId: string, siteName: string, error: string) => {
    sonnerToast.error('Job failed', {
      description: `${siteName} - ${error}`,
      action: {
        label: 'Retry',
        onClick: () => {
          fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' })
        }
      }
    })
  },

  batchCompleted: (batchName: string, passed: number, total: number) => {
    const success = passed === total
    sonnerToast[success ? 'success' : 'warning']('Batch completed', {
      description: `${passed}/${total} jobs successful`,
      duration: 10000
    })
  }
}
```

**Step 3**: Add Toaster to layout
**File**: `app/layout.tsx`

```typescript
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
```

**Step 4**: Add toast calls to UnifiedBatchDashboard
**File**: `app/(authenticated)/projects/[id]/batches/[batchId]/UnifiedBatchDashboard.tsx`

In the polling/WebSocket update handler:
```typescript
if (updatedJob.status === 'completed' && previousStatus !== 'completed') {
  toast.jobCompleted(updatedJob.id, updatedJob.siteUrl, updatedJob.accuracy)
}

if (updatedJob.status === 'failed' && previousStatus !== 'failed') {
  toast.jobFailed(updatedJob.id, updatedJob.siteUrl, updatedJob.error?.message)
}
```

---

#### 2. Table Hover Effects (1h)
**File**: `components/JobsTableV3.tsx`

**Current row classes**:
```typescript
className={cn(
  'border-b border-gray-200',
  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
)}
```

**Enhanced with hover and selection**:
```typescript
const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set())
const isSelected = selectedJobIds.has(job.id)

className={cn(
  'border-b border-gray-200 transition-colors cursor-pointer',
  isSelected && 'bg-emerald-50/30 border-emerald-200',
  !isSelected && index % 2 === 0 && 'bg-white hover:bg-gray-50/50',
  !isSelected && index % 2 !== 0 && 'bg-gray-50/50 hover:bg-gray-100/50',
  isExpanded && 'border-l-4 border-l-emerald-400'
)}
```

---

#### 3. Quick View Modal (3h)
**File**: `components/batch-dashboard/JobQuickViewModal.tsx`

**Enhance existing component** or create new:

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, RefreshCw, ExternalLink } from 'lucide-react'

interface JobQuickViewModalProps {
  jobId: string | null
  onClose: () => void
}

export function JobQuickViewModal({ jobId, onClose }: JobQuickViewModalProps) {
  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetch(`/api/jobs/${jobId}`).then(r => r.json()),
    enabled: !!jobId
  })

  if (!job) return null

  return (
    <Dialog open={!!jobId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{job.siteName || job.siteUrl}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => retryJob(jobId)}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status banner */}
          <div className={cn(
            'p-3 rounded-lg border',
            job.status === 'completed' && 'bg-green-50 border-green-200',
            job.status === 'failed' && 'bg-red-50 border-red-200'
          )}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{job.status.toUpperCase()}</span>
              {job.accuracy && <span>{job.accuracy}% accuracy</span>}
            </div>
          </div>

          {/* Data comparison */}
          {job.extractedData && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Extracted Data</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(job.extractedData).map(([key, value]) => (
                  <div key={key} className="border border-gray-200 rounded p-2">
                    <div className="text-xs text-gray-500">{key}</div>
                    <div className="text-sm font-medium">{value}</div>
                    {job.groundTruthData?.[key] && (
                      <div className="text-xs mt-1">
                        GT: {job.groundTruthData[key]}
                        {value === job.groundTruthData[key] ? ' ✓' : ' ×'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Streaming URL */}
          {job.streamingUrl && (
            <div className="border border-gray-200 rounded-lg p-4">
              <a
                href={job.streamingUrl}
                target="_blank"
                className="text-blue-600 hover:underline flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Watch execution recording
              </a>
            </div>
          )}

          {/* Screenshot */}
          {job.screenshots?.[0] && (
            <div className="border border-gray-200 rounded-lg p-4">
              <img src={job.screenshots[0]} alt="Job screenshot" className="w-full" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Integration in JobsTableV3**:
```typescript
const [quickViewJobId, setQuickViewJobId] = useState<string | null>(null)

// Add onClick to table rows
<tr onClick={() => setQuickViewJobId(job.id)}>

// Add modal at bottom of component
<JobQuickViewModal
  jobId={quickViewJobId}
  onClose={() => setQuickViewJobId(null)}
/>
```

---

### Day 3: Live Streaming Prominence (2-3 hours)

#### Add "Watch Live" Button to Running Jobs
**File**: `components/table/ProgressOutcomeColumn.tsx`

For jobs with `status === 'running'` and `streamingUrl`:

```tsx
{job.status === 'running' && job.streamingUrl && (
  <a
    href={job.streamingUrl}
    target="_blank"
    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
    onClick={(e) => e.stopPropagation()}
  >
    <Eye className="h-3 w-3" />
    Watch Live
  </a>
)}
```

#### Create Streaming Viewer Modal (optional enhancement)
**File**: `components/batch-dashboard/StreamingViewerModal.tsx`

For inline viewing without leaving page:

```tsx
<Dialog open={!!streamingUrl}>
  <DialogContent className="max-w-5xl">
    <DialogHeader>
      <DialogTitle>Live Execution Stream</DialogTitle>
    </DialogHeader>
    <div className="aspect-video">
      <iframe
        src={streamingUrl}
        className="w-full h-full border-0"
        allow="fullscreen"
      />
    </div>
  </DialogContent>
</Dialog>
```

---

## 📊 END OF DAY 3 CHECKLIST

By the end of Day 3 (Week 1), you should have:

- ✅ MetricCard component created and working
- ✅ Sparkline component showing trends
- ✅ DonutChart component for completion hero
- ✅ RunningModeHero redesigned with visual metrics
- ✅ CompletedModeHero redesigned with charts
- ✅ Toast notifications active for job events
- ✅ Table hover effects working
- ✅ Quick view modal showing job details
- ✅ "Watch Live" button visible for running jobs

**Visual Result**: Professional, polished UX that matches fintech standards

---

## 🎯 WEEK 1 DELIVERABLE

### Demo Script (for stakeholder review)

1. **Show Running Batch Dashboard**
   - Point out: Visual metrics with sparklines
   - Show: Live agent previews
   - Demonstrate: Real-time toast notifications

2. **Show Completed Batch**
   - Point out: Donut chart with pass/fail breakdown
   - Show: Visual metrics grid
   - Demonstrate: Top errors with retry button

3. **Show Jobs Table**
   - Point out: Hover effects
   - Demonstrate: Click for quick view modal
   - Show: "Watch Live" button for running jobs

4. **Performance Check**
   - Open Chrome DevTools
   - Show: Smooth 60fps animations
   - Show: <2s page load times

---

## 📚 DOCUMENTATION REFERENCE

### Key Documents Created
1. **COMPREHENSIVE_GAP_ANALYSIS.md** - Full feature gap analysis with priorities
2. **GAP_ANALYSIS_SUMMARY.md** - Executive summary with quick reference
3. **IMPLEMENTATION_ROADMAP_VISUAL.md** - 10-week sprint plan with Gantt chart
4. **START_HERE.md** (this file) - Immediate action items

### Agent OS Product Docs Reviewed
- COMPREHENSIVE_UX_MASTER_PLAN.md (1,062 lines) - Complete UX specifications
- JOBS_TABLE_JTBD_OPTIMIZATION.md (1,324 lines) - Table design philosophy
- MINO_NO_CODE_MISSION.md (372 lines) - Product vision and principles
- PHASE_5_GAP_ANALYSIS.md (1,687 lines) - Detailed gap analysis
- COMPREHENSIVE_FEATURE_INVENTORY.md (1,922 lines) - Complete feature list

---

## 🚨 IMPORTANT REMINDERS

### Design Principles to Follow
1. **Progressive Disclosure**: Show complexity only when needed
2. **Maximum Density**: Compact 12px spacing, 12-line visible content
3. **Minimum Friction**: Everything in ≤3 clicks

### Code Quality Standards
1. **TypeScript**: No `any` types, proper type safety
2. **Components**: Reusable, single responsibility
3. **Styling**: Consistent Tailwind classes, fintech color palette
4. **Performance**: React.memo for expensive components

### Testing Before Commit
1. Run `npx tsc --noEmit` (must show 0 errors)
2. Test in browser (both Chrome and Safari)
3. Check mobile responsive (DevTools mobile view)
4. Test with real batch data (not just mocks)

---

## 🎬 GETTING STARTED COMMANDS

### Start Development
```bash
# Ensure dev server is running
npm run dev

# In separate terminal, watch for TypeScript errors
npx tsc --noEmit --watch

# Check git status
git status

# Create new feature branch (if starting fresh work)
git checkout -b feature/sprint-1-ux-polish
```

### Development Workflow
```bash
# After completing each component:
npx tsc --noEmit              # Check types
npm run dev                    # Test in browser
git add <files>                # Stage changes
git commit -m "feat: [description]"  # Commit

# End of day:
git push origin feature/sprint-1-ux-polish
```

---

## 🤝 NEED HELP?

### Reference Materials
- **Design system**: See `MINO_UX_DESIGN_PRINCIPLES.md`
- **Component examples**: See `components/batch-dashboard/` and `components/table/`
- **UX specifications**: See `COMPREHENSIVE_UX_MASTER_PLAN.md`

### Common Issues
- **TypeScript errors**: Check schema field names match database
- **Styling issues**: Ensure Tailwind classes are correct
- **Performance**: Use React.memo, avoid inline functions in render

---

## ✅ SUCCESS CRITERIA FOR WEEK 1

### User Experience
- [ ] Hero sections visually match or exceed fintech standards
- [ ] Toast notifications appear for job completion/failure
- [ ] Quick view modal shows job details in <100ms
- [ ] Table hover effects are smooth (60fps)
- [ ] "Watch Live" button is clearly visible

### Technical
- [ ] Zero TypeScript errors
- [ ] No console errors in browser
- [ ] Page load time <2 seconds
- [ ] All animations smooth (60fps)

### Code Quality
- [ ] All new components have TypeScript types
- [ ] Consistent Tailwind styling
- [ ] Reusable components (MetricCard, Sparkline, DonutChart)
- [ ] Clean git history with descriptive commits

---

**READY TO START?**

👉 Begin with **Day 1, Task 1**: Create MetricCard component

**Estimated Time This Week**: 15-20 hours
**Expected Outcome**: Professional, polished UX that wows stakeholders

🚀 **LET'S BUILD!**
