# MINO F6 - COMPREHENSIVE DESIGN OPTIMIZATION MASTER PLAN

**Date**: 2025-11-06
**Status**: Planning Phase
**Goal**: Systematically optimize all frontend designs with best-in-class UX patterns

---

## EXECUTIVE SUMMARY

### Current State
- **14 authenticated pages** across dashboard, projects, batches, jobs, account
- **78 components** with duplication issues (ui/ vs root components/)
- **Well-established design system** (emerald/stone fintech palette)
- **Advanced features** exist but inconsistently applied
- **Major issue**: Component duplication causing amber vs emerald color conflicts

### Optimization Goals
1. **Consolidate** duplicate components (Button, Card, Badge, Input)
2. **Standardize** emerald-400 as primary color everywhere
3. **Add** missing core UI primitives (Modal, Dropdown, Tooltip, Tabs)
4. **Apply** consistent design patterns across all 14 pages
5. **Enhance** with micro-interactions and progressive disclosure
6. **Document** design system for maintainability

---

## PHASE 1: FOUNDATION CLEANUP (Week 1)

### Priority: CRITICAL
**Goal**: Resolve component duplication and color inconsistencies

### 1.1 Component Consolidation

#### A. Button Component Resolution
**Current Problem**: Two implementations
- `/components/ui/button.tsx` - Uses amber-600 (WRONG)
- `/components/Button.tsx` - Uses emerald-400 (CORRECT)

**Action**:
```typescript
// Keep: /components/Button.tsx with emerald colors
// Update: All imports from ui/button.tsx → Button.tsx
// Delete: /components/ui/button.tsx

// Button.tsx should have:
variants = {
  primary: "bg-emerald-400 hover:bg-emerald-500 text-white",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900",
  outline: "border-2 border-gray-300 hover:border-emerald-400",
  ghost: "hover:bg-gray-100",
  success: "bg-green-500 hover:bg-green-600 text-white",
  danger: "bg-red-500 hover:bg-red-600 text-white"
}
sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-base", // 44px for accessibility
  lg: "h-12 px-6 text-lg"
}
```

#### B. Card Component Resolution
**Current Problem**: Two implementations with different APIs

**Action**:
```typescript
// Keep: /components/Card.tsx (has more features)
// Migrate: ui/card.tsx users to Card.tsx
// Delete: /components/ui/card.tsx

// Card.tsx final API:
<Card variant="interactive" padding="md">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

#### C. Badge/StatusBadge Consolidation
**Action**:
- Keep both (different purposes)
- Badge.tsx = simple status badges
- StatusBadge.tsx = complex job status with icons
- Ensure consistent emerald/stone colors

#### D. Input Component Resolution
**Action**:
- Keep /components/Input.tsx (has fintech styling)
- Migrate ui/input.tsx users
- Add variants: default, error, success
- Ensure 44px min-height

### 1.2 Color Standardization

**Find & Replace Across Codebase**:
```bash
# Replace all amber primary colors with emerald
amber-600 → emerald-400
amber-700 → emerald-500
amber-500 → emerald-400

# Standardize border colors to stone palette
gray-200 → stone-200
gray-300 → stone-300
gray-100 → stone-100
```

**Files to Update**:
1. components/ui/button.tsx (DELETE)
2. All page files importing ui/button
3. tailwind.config.ts (verify emerald is primary)
4. globals.css (ensure --primary uses emerald)

### 1.3 File Organization Cleanup

**Action**:
```bash
# Create clear structure:
/components/ui/          # Core primitives (Button, Card, Input, Badge)
/components/layout/      # Layout components (Navigation, Sidebar)
/components/data/        # Data display (Table, MetricCard, StatusBadge)
/components/forms/       # Form controls (Input, Select, Checkbox)
/components/feedback/    # User feedback (Toast, Modal, Tooltip)
/components/batch-dashboard/  # Feature-specific components
```

**Migration Plan**:
- Move Navigation.tsx → layout/Navigation.tsx
- Move Table.tsx → data/Table.tsx
- Move Toast.tsx → feedback/Toast.tsx
- Update all imports

---

## PHASE 2: MISSING COMPONENTS (Week 1-2)

### Priority: HIGH
**Goal**: Add essential UI primitives using Shadcn/Radix patterns

### 2.1 Modal/Dialog Component

**Why**: Currently no reusable modal system

**Implementation**:
```typescript
// components/ui/Dialog.tsx
import * as DialogPrimitive from '@radix-ui/react-dialog'

export function Dialog({ children, open, onOpenChange }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
}

export function DialogTrigger({ children }) {
  return <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
}

export function DialogContent({ children, className }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
      <DialogPrimitive.Content className={`
        fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
        bg-white rounded-lg shadow-lg p-6 w-full max-w-md
        animate-fade-in ${className}
      `}>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ children }) {
  return <div className="mb-4">{children}</div>
}

export function DialogTitle({ children }) {
  return (
    <DialogPrimitive.Title className="text-xl font-semibold text-gray-900">
      {children}
    </DialogPrimitive.Title>
  )
}

export function DialogDescription({ children }) {
  return (
    <DialogPrimitive.Description className="text-sm text-gray-600 mt-2">
      {children}
    </DialogPrimitive.Description>
  )
}
```

**Usage Example**:
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Project</DialogTitle>
      <DialogDescription>
        Are you sure? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 2.2 Dropdown Menu Component

**Implementation**:
```typescript
// components/ui/DropdownMenu.tsx
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'

export function DropdownMenu({ children }) {
  return <DropdownPrimitive.Root>{children}</DropdownPrimitive.Root>
}

export function DropdownMenuTrigger({ children }) {
  return <DropdownPrimitive.Trigger asChild>{children}</DropdownPrimitive.Trigger>
}

export function DropdownMenuContent({ children, align = 'end' }) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        className="
          min-w-[200px] bg-white rounded-lg shadow-lg border border-stone-200
          p-1 animate-slide-in z-50
        "
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  )
}

export function DropdownMenuItem({ children, onClick }) {
  return (
    <DropdownPrimitive.Item
      onClick={onClick}
      className="
        px-3 py-2 text-sm text-gray-900 rounded cursor-pointer
        hover:bg-emerald-50 hover:text-emerald-900
        focus:bg-emerald-50 focus:outline-none
        transition-colors
      "
    >
      {children}
    </DropdownPrimitive.Item>
  )
}

export function DropdownMenuSeparator() {
  return <DropdownPrimitive.Separator className="h-px bg-stone-200 my-1" />
}
```

### 2.3 Tooltip Component

**Implementation**:
```typescript
// components/ui/Tooltip.tsx
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

export function TooltipProvider({ children }) {
  return <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>
}

export function Tooltip({ children, content, side = 'top' }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          className="
            px-3 py-1.5 text-xs text-white bg-gray-900 rounded
            shadow-lg animate-fade-in z-50
          "
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-gray-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
```

### 2.4 Tabs Component

**Implementation**:
```typescript
// components/ui/Tabs.tsx
import * as TabsPrimitive from '@radix-ui/react-tabs'

export function Tabs({ children, defaultValue }) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue}>
      {children}
    </TabsPrimitive.Root>
  )
}

export function TabsList({ children }) {
  return (
    <TabsPrimitive.List className="
      inline-flex items-center gap-1 p-1
      bg-stone-100 rounded-lg
    ">
      {children}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ value, children }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className="
        px-4 py-2 text-sm font-medium text-gray-700 rounded
        hover:text-gray-900 hover:bg-white/50
        data-[state=active]:bg-white data-[state=active]:text-emerald-700
        data-[state=active]:shadow-sm
        transition-all
      "
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

export function TabsContent({ value, children }) {
  return (
    <TabsPrimitive.Content value={value} className="mt-4">
      {children}
    </TabsPrimitive.Content>
  )
}
```

### 2.5 Form Components (Checkbox, Radio, Switch)

**Checkbox**:
```typescript
// components/ui/Checkbox.tsx
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'

export function Checkbox({ checked, onCheckedChange, label }) {
  return (
    <div className="flex items-center gap-2">
      <CheckboxPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="
          h-5 w-5 rounded border-2 border-stone-300
          hover:border-emerald-400
          data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-400
          focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
          transition-all
        "
      >
        <CheckboxPrimitive.Indicator>
          <Check className="h-4 w-4 text-white" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && <label className="text-sm text-gray-900">{label}</label>}
    </div>
  )
}
```

### 2.6 Loading States

**Skeleton Loader**:
```typescript
// components/ui/Skeleton.tsx
export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`animate-pulse bg-stone-200 rounded ${className}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="16px" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
      <Skeleton height="20px" width="40%" />
      <SkeletonText lines={2} />
      <Skeleton height="40px" width="100%" />
    </div>
  )
}
```

**Spinner**:
```typescript
// components/ui/Spinner.tsx
export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg className="animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}
```

---

## PHASE 3: PAGE-BY-PAGE OPTIMIZATION (Week 2-3)

### Priority: HIGH
**Goal**: Apply consistent design patterns to all 14 pages

### 3.1 Dashboard Page Enhancement

**Current**: Basic metric cards
**Target**: Hero metrics + activity feed + insights

**Changes**:
```typescript
// app/(authenticated)/dashboard/page.tsx

// Add:
1. Hero section with large KPI cards (current: 4 cards ✓)
2. Recent activity with enhanced card design
3. Quick actions with icons
4. Trends chart (optional)
5. Notifications/alerts section

// Specific updates:
- MetricCard: Add trend arrows ✓
- Activity cards: Add hover lift effect
- Empty states: Add illustrations
- Loading states: Add skeletons
```

### 3.2 Projects Page Enhancement

**Current**: Grid/list view toggle
**Target**: Enhanced grid with filters + search

**Changes**:
```typescript
// app/(authenticated)/projects/page.tsx

// Add:
1. EnhancedTableHeader with search ← NEW
2. Filter chips (status, date, owner)
3. Sort dropdown (name, date, status)
4. Bulk actions for selected projects
5. Create project CTA prominent

// ProjectsGridView updates:
- Card variant="interactive" ✓
- Add project owner avatar
- Add last activity timestamp
- Add quick actions menu (3-dot)
- Skeleton loading states
```

### 3.3 Batch Dashboard Enhancement

**Current**: Advanced table with filters
**Target**: Polish existing + add missing pieces

**Changes**:
```typescript
// app/(authenticated)/projects/[id]/batches/[batchId]/page.tsx

// Current features (keep):
- EnhancedJobsTable with search/filters ✓
- Live execution monitoring ✓
- Bulk actions ✓

// Add:
1. Batch header with breadcrumbs
2. Quick stats cards above table
3. Export modal (instead of inline)
4. Column presets (save/load views)
5. Keyboard shortcuts help (?)

// Table improvements:
- Add row actions menu (3-dot)
- Add expand/collapse for row details
- Add column resize
- Add column reorder (drag)
```

### 3.4 Job Detail Page Enhancement

**Current**: Basic field comparison
**Target**: Comprehensive job insights

**Changes**:
```typescript
// app/(authenticated)/projects/[id]/jobs/[jobId]/page.tsx

// Add:
1. Job header with status badge
2. Tabs: Overview | Fields | Timeline | Debug
3. Field comparison with diff highlighting
4. Screenshot viewer with playback
5. Execution timeline with steps
6. Debug info collapsible

// Layout:
- 2-column layout (info + preview)
- Sticky header with actions
- Breadcrumb navigation
```

### 3.5 Batch Analytics Page Enhancement

**Current**: Basic analytics
**Target**: Comprehensive insights dashboard

**Changes**:
```typescript
// app/(authenticated)/projects/[id]/batches/[batchId]/analytics/page.tsx

// Add:
1. KPI cards (success rate, avg duration, etc.)
2. Charts:
   - Success rate over time (line chart)
   - Status distribution (pie chart)
   - Duration distribution (histogram)
   - Failure patterns (bar chart)
3. Top errors list
4. Export report button
5. Date range picker

// Use:
- recharts for charts
- Card components for chart containers
- MetricCard for KPIs
```

### 3.6 Account Pages Enhancement

**Current**: Basic forms
**Target**: Modern settings UI

**Changes**:
```typescript
// app/(authenticated)/account/*/page.tsx

// Add to all account pages:
1. Sidebar navigation (Profile, API Keys, Org, Billing)
2. Section cards with headers
3. Form with proper validation
4. Save/cancel sticky footer
5. Unsaved changes warning

// Profile page:
- Avatar upload
- Name, email fields
- Password change section
- Danger zone (delete account)

// API Keys page:
- Table of API keys
- Create key modal
- Copy key with toast
- Revoke key confirmation

// Organization page:
- Org details form
- Members table
- Invite member modal
- Role management
```

---

## PHASE 4: MICRO-INTERACTIONS & POLISH (Week 3)

### Priority: MEDIUM
**Goal**: Add delightful interactions throughout

### 4.1 Hover States Enhancement

**Apply to all interactive elements**:
```css
/* Already in globals.css ✓ */
.table-row-hover:hover { @apply bg-stone-50; }
.card-interactive:hover { @apply -translate-y-1 shadow-lg; }
.button-press:active { @apply scale-95; }

/* Add new: */
.nav-item:hover { @apply bg-emerald-50 text-emerald-900; }
.dropdown-item:hover { @apply bg-emerald-50; }
.tab-hover:hover { @apply bg-white/50; }
```

### 4.2 Loading States

**Add to all async operations**:
- Button loading state (spinner + disabled)
- Page skeleton loaders
- Table skeleton rows
- Optimistic UI updates

**Example**:
```typescript
<Button disabled={isLoading}>
  {isLoading && <Spinner size="sm" className="mr-2" />}
  {isLoading ? 'Saving...' : 'Save Changes'}
</Button>
```

### 4.3 Empty States

**Add illustrations to**:
- Empty projects list
- Empty batches list
- Empty jobs table
- No search results

**Pattern**:
```typescript
<div className="py-12 text-center">
  <div className="h-24 w-24 mx-auto mb-4 text-stone-300">
    <EmptyIcon />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
  <p className="text-sm text-gray-600 mb-4">
    Create your first project to get started
  </p>
  <Button variant="primary">Create Project</Button>
</div>
```

### 4.4 Toast Notifications

**Standardize toast usage**:
```typescript
// Success
toast.success('Project created successfully')

// Error
toast.error('Failed to delete batch')

// Info
toast.info('Export will be ready in a few minutes')

// Warning
toast.warning('You have unsaved changes')
```

**Position**: bottom-right
**Duration**: 4s (success), 6s (error)
**Max visible**: 3

### 4.5 Keyboard Shortcuts

**Add shortcuts for**:
- `Cmd+K` - Quick switcher (exists ✓)
- `?` - Show shortcuts help
- `N` - New project/batch
- `Esc` - Close modal/drawer
- `Cmd+S` - Save form
- `/` - Focus search

**Implementation**:
```typescript
// components/KeyboardShortcuts.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === '?' && !e.metaKey) {
      setShowHelp(true)
    }
    if (e.key === 'n' && !e.metaKey && !isTyping) {
      router.push('/projects/new')
    }
    // ... more shortcuts
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

---

## PHASE 5: MOBILE RESPONSIVENESS (Week 4)

### Priority: MEDIUM
**Goal**: Ensure all pages work on mobile/tablet

### 5.1 Responsive Breakpoints

**Use Tailwind breakpoints consistently**:
```css
sm: 640px   /* Phone landscape */
md: 768px   /* Tablet portrait */
lg: 1024px  /* Tablet landscape / small laptop */
xl: 1280px  /* Desktop */
2xl: 1536px /* Large desktop */
```

### 5.2 Mobile Navigation

**Add**:
- Hamburger menu for sidebar
- Bottom tab bar for main actions
- Swipe gestures for drawer
- Touch-friendly tap targets (44px ✓)

### 5.3 Responsive Tables

**Strategy**:
```typescript
// Desktop: Full table
// Tablet: Hide less important columns
// Mobile: Card view

<div className="hidden lg:block">
  <Table>...</Table>
</div>

<div className="lg:hidden space-y-2">
  {jobs.map(job => (
    <Card key={job.id}>
      <CardHeader>
        <CardTitle>{job.siteName}</CardTitle>
        <StatusBadge status={job.status} />
      </CardHeader>
      <CardContent>
        {/* Key info only */}
      </CardContent>
    </Card>
  ))}
</div>
```

### 5.4 Mobile-First Components

**Ensure work on mobile**:
- Modals (full-screen on mobile)
- Dropdowns (drawer on mobile)
- Date pickers (native on mobile)
- Forms (stacked on mobile)

---

## PHASE 6: DOCUMENTATION (Week 4)

### Priority: LOW (but important for maintenance)
**Goal**: Document the design system

### 6.1 Component Documentation

**Create**:
```markdown
# docs/components/Button.md

## Button Component

### Usage
\`\`\`tsx
import { Button } from '@/components/Button'

<Button variant="primary" size="md">Click me</Button>
\`\`\`

### Variants
- primary (emerald-400)
- secondary (gray)
- outline
- ghost
- success (green)
- danger (red)

### Sizes
- sm (36px height)
- md (44px height)
- lg (48px height)

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | string | 'primary' | Button style variant |
| size | string | 'md' | Button size |
| disabled | boolean | false | Disabled state |
| onClick | function | - | Click handler |

### Examples
[Show code examples for each variant/size]

### Accessibility
- Minimum 44px tap target ✓
- Focus visible ring ✓
- Keyboard accessible ✓
- ARIA labels supported ✓
```

### 6.2 Design Tokens Documentation

**Create**:
```typescript
// docs/design-tokens.ts

export const designTokens = {
  colors: {
    primary: {
      DEFAULT: 'rgb(52, 211, 153)', // emerald-400
      hover: 'rgb(16, 185, 129)',    // emerald-500
      light: 'rgb(209, 250, 229)'    // emerald-100
    },
    // ... all colors
  },
  spacing: {
    // ... spacing scale
  },
  typography: {
    // ... font sizes, weights, line heights
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.10)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.10)'
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)'
  }
}
```

### 6.3 Pattern Library

**Document common patterns**:
- Hero sections
- KPI card grids
- Data tables with filters
- Form layouts
- Modal patterns
- Empty states
- Loading states
- Error states

---

## IMPLEMENTATION CHECKLIST

### Week 1: Foundation
- [ ] Resolve Button duplication (keep Button.tsx, delete ui/button.tsx)
- [ ] Resolve Card duplication
- [ ] Resolve Badge duplication
- [ ] Resolve Input duplication
- [ ] Replace all amber colors with emerald
- [ ] Standardize stone vs gray usage
- [ ] Create missing Dialog component
- [ ] Create missing DropdownMenu component
- [ ] Create missing Tooltip component
- [ ] Create missing Tabs component

### Week 2: Core Components & Pages
- [ ] Create Checkbox component
- [ ] Create Radio component
- [ ] Create Switch component
- [ ] Create Skeleton loader
- [ ] Create Spinner component
- [ ] Enhance Dashboard page
- [ ] Enhance Projects page
- [ ] Enhance Batch dashboard

### Week 3: Page Optimization & Polish
- [ ] Enhance Job detail page
- [ ] Enhance Batch analytics page
- [ ] Enhance Account pages
- [ ] Add hover states everywhere
- [ ] Add loading states everywhere
- [ ] Add empty states with illustrations
- [ ] Standardize toast notifications
- [ ] Implement keyboard shortcuts

### Week 4: Mobile & Documentation
- [ ] Mobile navigation
- [ ] Responsive tables (card view)
- [ ] Mobile-friendly modals
- [ ] Touch gestures
- [ ] Component documentation
- [ ] Design tokens documentation
- [ ] Pattern library
- [ ] Final QA pass

---

## SUCCESS METRICS

### User Experience
- ✅ Consistent visual language across all pages
- ✅ <200ms perceived load time (skeleton loaders)
- ✅ No layout shift (CLS score < 0.1)
- ✅ Touch targets ≥44px everywhere
- ✅ Keyboard accessible (all interactive elements)

### Developer Experience
- ✅ No component duplication
- ✅ Consistent naming convention
- ✅ Documented components
- ✅ Reusable patterns
- ✅ Type-safe props

### Performance
- ✅ Bundle size <300KB (gzipped)
- ✅ First Contentful Paint <1.5s
- ✅ Time to Interactive <3s
- ✅ No blocking scripts

---

## MAINTENANCE PLAN

### Monthly
- Review new components for consistency
- Update documentation
- Check for unused components
- Performance audit

### Quarterly
- Design system health check
- Component consolidation opportunities
- Accessibility audit
- User feedback review

---

## NOTES

- All changes should be incremental and tested
- No breaking changes to APIs where possible
- Maintain backward compatibility during migration
- Use feature flags for major changes
- Get stakeholder approval before Phase 3

---

**END OF MASTER PLAN**
