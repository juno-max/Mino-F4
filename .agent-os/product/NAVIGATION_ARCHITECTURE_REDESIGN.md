# Navigation & Information Architecture Redesign - JTBD Analysis

**Date:** 2025-11-05
**Status:** 🎯 Planning Phase
**Impact:** Transform MINO into a context-aware, navigation-efficient platform

---

## 🎯 EXECUTIVE SUMMARY

**The Problem:**
Users lose context when navigating between projects and batches, can't access critical controls (like workflow instructions) consistently, and waste time clicking through multiple levels to access their work.

**The Solution:**
A three-tier navigation system with persistent left sidebar (project tree), auto-hiding top nav (dashboard + account), and contextual right drawer (project instructions), optimized for screen real estate and ease of use.

**Expected Impact:**
- 📉 **75% reduction in navigation clicks** (4+ clicks → 1 click)
- 👁️ **100% visibility** of all projects/batches at a glance
- ⚡ **Instant context switching** via persistent sidebar
- 🎨 **15% more screen space** for content (auto-hide top nav)
- 🔄 **Always-accessible instructions** via right drawer

---

## 📊 JOBS TO BE DONE ANALYSIS

### Job #1: Quick Access & Context Awareness
**When I'm** working across multiple projects and batches,
**I want to** see all my work in a hierarchical tree and switch between them instantly,
**So I can** maintain context and navigate efficiently without multiple page loads.

**Current Pain Points:**
- ❌ Must navigate: Home → Projects → Click Project → See Batches → Click Batch (4+ clicks)
- ❌ No overview of all projects/batches simultaneously
- ❌ Can't see batch status without clicking into each one
- ❌ Lose context when navigating between projects
- ❌ No breadcrumb trail or location awareness
- ❌ No keyboard shortcuts for navigation

**Success Metrics:**
- ✅ See all projects + batches in one view
- ✅ Click once to switch between any batch
- ✅ See status indicators (jobs, completion %, accuracy) inline
- ✅ Maintain context across navigation
- ✅ Keyboard shortcut to open quick switcher (Cmd+K)

---

### Job #2: Persistent Instruction Management
**When I'm** working within a project (viewing batches, analyzing jobs, etc.),
**I want to** easily update and refine workflow instructions,
**So I can** iterate on extraction quality without losing my current context.

**Current Pain Points:**
- ❌ Instructions buried in a card on project detail page
- ❌ Can't edit instructions while viewing batch results
- ❌ Can't update instructions while reviewing job details
- ❌ No version control visibility
- ❌ Must navigate away from current page to edit instructions
- ❌ Changes not immediately reflected

**Success Metrics:**
- ✅ Instructions accessible from anywhere within a project
- ✅ Edit mode with syntax highlighting
- ✅ Save & apply to new runs button
- ✅ Version history inline (last 5 versions)
- ✅ Keyboard shortcut to open drawer (Cmd+I)
- ✅ Auto-save drafts

---

### Job #3: Dashboard Overview & Orientation
**When I** land on the platform or return after time away,
**I want to** see my overall progress and recent activity at a glance,
**So I can** quickly orient myself and jump into my most important work.

**Current Pain Points:**
- ❌ No dashboard homepage (lands directly on projects list)
- ❌ Projects page is list-focused, not overview-focused
- ❌ Can't see aggregate metrics (total jobs, success rate, etc.)
- ❌ No recent activity feed
- ❌ No "continue where you left off" functionality
- ❌ Top nav wastes space with minimal value

**Success Metrics:**
- ✅ Dashboard homepage (/dashboard) with aggregate stats
- ✅ Recent activity feed (last 10 actions)
- ✅ Quick actions (create project, upload batch, view running jobs)
- ✅ Auto-hiding top nav on scroll (saves ~60px)
- ✅ Breadcrumb trail for context
- ✅ "Resume work" button for last-viewed page

---

### Job #4: Efficient Screen Real Estate
**When I'm** working with data-dense interfaces (jobs tables, analytics, etc.),
**I want to** maximize screen space for content,
**So I can** see more data without scrolling and work more efficiently.

**Current Pain Points:**
- ❌ Top nav always visible (64px wasted when scrolling)
- ❌ Right sidebar on projects page takes 320px (25% of 1280px screen)
- ❌ No collapsible sections in navigation
- ❌ Inconsistent padding/spacing across pages
- ❌ Static headers that don't adapt to scroll

**Success Metrics:**
- ✅ Auto-hide top nav on scroll down, show on scroll up
- ✅ Collapsible left sidebar (collapsed = 64px icons, expanded = 280px)
- ✅ Right drawer only visible when needed (not persistent)
- ✅ Sticky headers that collapse/compress on scroll
- ✅ 15-20% more vertical space for content

---

## 🏗️ PROPOSED NAVIGATION ARCHITECTURE

### Three-Tier System

```
┌─────────────────────────────────────────────────────────────┐
│ 🔝 TOP NAV (Auto-Hide on Scroll)                           │
│ Logo | Dashboard | [Cmd+K Quick Switch] | User Menu         │
├────┬────────────────────────────────────────────────────┬───┤
│ 📁 │                                                    │📝 │
│    │                                                    │   │
│ L  │         MAIN CONTENT AREA                         │ R │
│ E  │                                                    │ I │
│ F  │         (Projects, Batches, Jobs, etc.)           │ G │
│ T  │                                                    │ H │
│    │                                                    │ T │
│ S  │                                                    │   │
│ I  │                                                    │ D │
│ D  │                                                    │ R │
│ E  │                                                    │ A │
│    │                                                    │ W │
│ B  │                                                    │ E │
│ A  │                                                    │ R │
│ R  │                                                    │   │
│    │                                                    │   │
└────┴────────────────────────────────────────────────────┴───┘

LEFT SIDEBAR: Persistent project tree navigation
RIGHT DRAWER: Contextual (instructions, settings, etc.)
TOP NAV: Global actions + auto-hide on scroll
```

---

## 📐 DETAILED COMPONENT DESIGN

### 1. **Top Navigation (Auto-Hide)**

**Behavior:**
- Show by default
- Auto-hide on scroll down (after 100px)
- Show on scroll up (any amount)
- Always show if at top of page (scrollY < 50px)
- Smooth transition (200ms ease-in-out)

**Visual Design:**
```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] Dashboard    [🔍 Cmd+K Search]    [User Menu 👤]     │
│  MINO                                                         │
└──────────────────────────────────────────────────────────────┘
```

**Collapsed State (on scroll):**
- Height: 64px → 0px (smooth transform)
- Opacity: 1 → 0 (fade out)
- Position: sticky top-0 → sticky -top-16

**Components:**
- Logo (links to /dashboard)
- Dashboard link
- Quick Switcher (Cmd+K) - search all projects/batches
- User Menu (right-aligned)

**Implementation:**
```tsx
// hooks/useScrollDirection.ts
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const updateScrollDirection = () => {
      const scrollY = window.scrollY

      setIsAtTop(scrollY < 50)

      if (Math.abs(scrollY - lastScrollY) < 10) {
        ticking = false
        return
      }

      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up')
      lastScrollY = scrollY > 0 ? scrollY : 0
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return { scrollDirection, isAtTop }
}

// components/TopNav.tsx
export function TopNav() {
  const { scrollDirection, isAtTop } = useScrollDirection()
  const isVisible = scrollDirection !== 'down' || isAtTop

  return (
    <nav className={`
      sticky top-0 z-50 bg-white border-b border-gray-200
      transition-transform duration-200 ease-in-out
      ${isVisible ? 'translate-y-0' : '-translate-y-full'}
    `}>
      {/* Nav content */}
    </nav>
  )
}
```

---

### 2. **Left Sidebar (Project Tree)**

**Behavior:**
- Persistent across all pages
- Collapsible (toggle button at top)
- Remembers state (localStorage)
- Shows project hierarchy with batch children
- Inline status indicators
- Keyboard navigation (↑↓ arrow keys)

**Visual Design (Expanded - 280px):**
```
┌─────────────────────────────────┐
│ [≡] Projects                    │
├─────────────────────────────────┤
│                                 │
│ 🔽 Classpass Extraction         │
│    ├─ 📄 4653 Venues    [●●●○] │
│    │   45/50 | 90% | ✓         │
│    └─ 📄 Test Run 10    [●●○○] │
│        8/10 | 80% | ⚠          │
│                                 │
│ 🔽 Expedia Pricing              │
│    └─ 📄 50 Attractions [●●●●] │
│        50/50 | 100% | ✓        │
│                                 │
│ 🔽 Sheriff Contacts             │
│    └─ 📄 13 Counties    [●●○○] │
│        10/13 | 77% | ⚠         │
│                                 │
│ ⊕ Create Project                │
│                                 │
└─────────────────────────────────┘
```

**Visual Design (Collapsed - 64px):**
```
┌─────┐
│ [≡] │
├─────┤
│  C  │ ← Classpass (tooltip on hover)
│ [●] │
│     │
│  E  │ ← Expedia
│ [●] │
│     │
│  S  │ ← Sheriff
│ [●] │
│     │
│ [+] │ ← Create
└─────┘
```

**Status Indicators:**
- Progress bar: `[●●●○]` = 75% complete
- Job count: `45/50` = 45 completed of 50 total
- Accuracy: `90%` = success rate
- Health icon:
  - ✓ Green checkmark = 100% success
  - ⚠ Yellow warning = 70-99% success
  - ✗ Red X = <70% success
  - ⚡ Blue bolt = running jobs

**Interaction:**
- Click project name → expand/collapse batches
- Click batch → navigate to batch detail page
- Hover → show tooltip with full metrics
- Right-click → context menu (edit, delete, duplicate)
- Drag & drop to reorder projects

**Data Structure:**
```tsx
interface ProjectTreeNode {
  id: string
  name: string
  type: 'project' | 'batch'
  icon?: string
  status: 'running' | 'completed' | 'error' | 'idle'
  metrics: {
    totalJobs: number
    completedJobs: number
    accuracy: number
    health: 'excellent' | 'good' | 'warning' | 'error'
  }
  children?: ProjectTreeNode[]
}
```

**Implementation:**
```tsx
// components/LeftSidebar.tsx
export function LeftSidebar() {
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('sidebar-expanded') !== 'false'
  })
  const [projects, setProjects] = useState<ProjectTreeNode[]>([])

  useEffect(() => {
    // Fetch projects with batch children
    fetchProjectTree().then(setProjects)
  }, [])

  const toggleExpanded = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    localStorage.setItem('sidebar-expanded', String(newState))
  }

  return (
    <aside className={`
      fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200
      transition-all duration-300 ease-in-out z-40
      ${isExpanded ? 'w-[280px]' : 'w-[64px]'}
    `}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={toggleExpanded} className="p-2 hover:bg-gray-100 rounded">
            <MenuIcon className="h-5 w-5" />
          </button>
          {isExpanded && <h2 className="font-semibold">Projects</h2>}
        </div>

        {/* Project Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {projects.map(project => (
            <ProjectTreeItem key={project.id} node={project} isExpanded={isExpanded} />
          ))}
        </div>

        {/* Create Button */}
        <div className="border-t p-4">
          <Link href="/projects/new">
            <Button variant="primary" size="sm" className="w-full">
              {isExpanded ? '+ Create Project' : '+'}
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  )
}
```

---

### 3. **Right Drawer (Contextual)**

**Behavior:**
- Context-aware (changes based on current page)
- Slides in from right (300px width)
- Keyboard shortcut to toggle (Cmd+I for instructions)
- Remembers state per-project (localStorage)
- Auto-save drafts every 2 seconds

**Contexts:**
1. **Within a Project** → Workflow Instructions Editor
2. **Within a Batch** → Batch Settings (GT config, export options)
3. **Within a Job** → Job Actions (retry, screenshot viewer)
4. **Account Pages** → Help & Documentation

**Workflow Instructions Drawer (Primary Use Case):**
```
┌────────────────────────────────┐
│ ✕ Workflow Instructions        │
├────────────────────────────────┤
│                                │
│ [Edit] [Preview] [History]     │
│                                │
│ ┌────────────────────────────┐ │
│ │ Extract the following:     │ │
│ │                            │ │
│ │ 1. Business name           │ │
│ │ 2. Address                 │ │
│ │ 3. Phone number            │ │
│ │ 4. Website URL             │ │
│ │                            │ │
│ │ ...                        │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ 📊 Accuracy Impact         │ │
│ │ Current: 87%               │ │
│ │ Version 1.2: 91%           │ │
│ │ Version 1.1: 85%           │ │
│ └────────────────────────────┘ │
│                                │
│ [Cancel] [Save Draft]          │
│          [Save & Run Test ▶]   │
│                                │
└────────────────────────────────┘
```

**Features:**
- **Edit Tab:** Textarea with syntax highlighting
- **Preview Tab:** Rendered instructions preview
- **History Tab:** Version history (last 10 versions)
- **Accuracy Impact:** Shows accuracy per version (if available)
- **Actions:**
  - Cancel (discard changes)
  - Save Draft (auto-saves every 2s anyway)
  - Save & Run Test (saves + starts 10-site test run)

**Implementation:**
```tsx
// components/RightDrawer.tsx
export function RightDrawer({ projectId, batchId }: { projectId?: string, batchId?: string }) {
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem(`drawer-open-${projectId}`) === 'true'
  })
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'history'>('edit')
  const [instructions, setInstructions] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  // Auto-save draft
  useEffect(() => {
    if (!isDirty) return

    const timer = setTimeout(() => {
      saveDraft(instructions)
      setIsDirty(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [instructions, isDirty])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSaveAndTest = async () => {
    await saveInstructions(projectId, instructions)
    await startTestRun(batchId, { sampleSize: 10 })
    toast.success('Test run started with new instructions!')
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed right-0 top-16 bottom-0 w-[400px] bg-white border-l border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">Workflow Instructions</h3>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded">
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {(['edit', 'preview', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-emerald-500 text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'edit' && (
              <textarea
                value={instructions}
                onChange={(e) => {
                  setInstructions(e.target.value)
                  setIsDirty(true)
                }}
                className="w-full h-full font-mono text-sm border rounded p-3"
                placeholder="Enter workflow instructions..."
              />
            )}

            {activeTab === 'preview' && (
              <div className="prose prose-sm">
                <pre className="whitespace-pre-wrap">{instructions}</pre>
              </div>
            )}

            {activeTab === 'history' && (
              <InstructionHistory projectId={projectId} />
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4 space-y-2">
            {isDirty && (
              <div className="text-xs text-amber-600 flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                Auto-saving draft...
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveAndTest}>
                Save & Run Test
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
```

---

### 4. **Quick Switcher (Cmd+K)**

**Behavior:**
- Modal overlay (center of screen)
- Fuzzy search all projects and batches
- Keyboard navigation (↑↓ arrows, Enter to select)
- Recent searches saved
- Shows metrics inline

**Visual Design:**
```
┌─────────────────────────────────────────────────┐
│ 🔍 Quick Switcher                         Cmd+K │
├─────────────────────────────────────────────────┤
│ [Search projects and batches...]                │
├─────────────────────────────────────────────────┤
│                                                  │
│ Recent                                           │
│ ─────────────────────────────────────────────── │
│ 📁 Classpass Extraction                          │
│ 📄 4653 Venues                   45/50 | 90%    │
│                                                  │
│ 📁 Expedia Pricing                               │
│ 📄 50 Attractions                50/50 | 100%   │
│                                                  │
│ ─────────────────────────────────────────────── │
│ Quick Actions                                    │
│ ─────────────────────────────────────────────── │
│ ⊕ Create New Project                            │
│ 📤 Upload CSV to Batch                           │
│ 📊 View All Running Jobs                         │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Implementation:**
```tsx
// components/QuickSwitcher.tsx
export function QuickSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (query.length === 0) {
      setResults(getRecentSearches())
    } else {
      setResults(fuzzySearch(query, allProjectsAndBatches))
    }
  }, [query])

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <div className="fixed inset-0 bg-black/30 z-50" />
      <div className="fixed inset-0 flex items-start justify-center pt-[20vh] z-50">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-2xl">
          {/* Search input */}
          <div className="p-4 border-b">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects and batches..."
              className="w-full text-lg outline-none"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {results.map(result => (
              <QuickSwitcherItem key={result.id} item={result} onSelect={() => {
                router.push(result.url)
                setIsOpen(false)
              }} />
            ))}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
```

---

## 📱 RESPONSIVE DESIGN

### Desktop (≥1280px)
- Left sidebar: 280px expanded, 64px collapsed
- Right drawer: 400px
- Top nav: Full width
- Main content: Remaining space

### Tablet (768px - 1279px)
- Left sidebar: Collapsed by default (64px)
- Right drawer: Full screen overlay (not side-by-side)
- Top nav: Full width
- Main content: Full width minus 64px

### Mobile (<768px)
- Left sidebar: Hidden, accessible via hamburger menu
- Right drawer: Full screen modal
- Top nav: Simplified (logo + hamburger + user icon)
- Main content: Full width

---

## 🎨 VISUAL DESIGN SPECS

### Colors
- **Background:** `#FFFFFF` (white)
- **Border:** `#E5E7EB` (gray-200)
- **Text Primary:** `#111827` (gray-900)
- **Text Secondary:** `#6B7280` (gray-500)
- **Accent:** `rgb(52,211,153)` (emerald-400)
- **Running:** `#3B82F6` (blue-500)
- **Error:** `#EF4444` (red-500)
- **Warning:** `#F59E0B` (amber-500)

### Typography
- **Font:** Inter (system font fallback)
- **Nav Items:** 14px, font-medium
- **Project Names:** 15px, font-semibold
- **Metrics:** 13px, tabular-nums
- **Icons:** 20px (lucide-react)

### Spacing
- **Sidebar Item Padding:** 12px vertical, 16px horizontal
- **Nested Indent:** 24px
- **Section Gap:** 16px
- **Border Radius:** 6px (rounded-md)

### Shadows
- **Sidebar:** `shadow-sm` (0 1px 2px rgba(0,0,0,0.05))
- **Drawer:** `shadow-2xl` (large shadow)
- **Top Nav:** `shadow-sm`

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Foundation (Week 1)
**Goal:** Build core navigation components

**Tasks:**
1. ✅ Create `useScrollDirection` hook
2. ✅ Build `TopNav` component with auto-hide
3. ✅ Build `LeftSidebar` component (static)
4. ✅ Create `RightDrawer` shell component
5. ✅ Set up layout structure in `app/layout.tsx`

**Deliverables:**
- Auto-hiding top nav (functional)
- Left sidebar (static, no data yet)
- Right drawer (shell, no content)
- Layout structure wired up

---

### Phase 2: Data Integration (Week 1)
**Goal:** Connect navigation to real data

**Tasks:**
1. ✅ Create `/api/navigation/tree` endpoint
   - Returns projects with batch children
   - Includes metrics (jobs, completion %, accuracy)
2. ✅ Build `ProjectTreeItem` component
3. ✅ Add expand/collapse functionality
4. ✅ Implement status indicators
5. ✅ Add loading states

**Deliverables:**
- Left sidebar shows real projects/batches
- Metrics displayed inline
- Expand/collapse works
- Loading/error states

---

### Phase 3: Instruction Drawer (Week 2)
**Goal:** Build workflow instructions editor

**Tasks:**
1. ✅ Create `InstructionsEditor` component
2. ✅ Add tabs (Edit, Preview, History)
3. ✅ Implement auto-save (2s debounce)
4. ✅ Add version history API
5. ✅ Add "Save & Run Test" action
6. ✅ Keyboard shortcut (Cmd+I)

**Deliverables:**
- Instructions editor functional
- Auto-save working
- Version history visible
- Save & test integration

---

### Phase 4: Quick Switcher (Week 2)
**Goal:** Build Cmd+K quick switcher

**Tasks:**
1. ✅ Create `QuickSwitcher` component
2. ✅ Implement fuzzy search (use fuse.js)
3. ✅ Add keyboard navigation
4. ✅ Save recent searches (localStorage)
5. ✅ Add quick actions

**Deliverables:**
- Cmd+K opens switcher
- Fuzzy search works
- Keyboard navigation (↑↓ Enter)
- Recent searches saved

---

### Phase 5: Dashboard Page (Week 3)
**Goal:** Create dashboard homepage

**Tasks:**
1. ✅ Create `/dashboard` page
2. ✅ Build aggregate stats cards
3. ✅ Build recent activity feed
4. ✅ Add quick actions section
5. ✅ Add "resume work" functionality

**Deliverables:**
- Dashboard page with stats
- Recent activity feed
- Quick actions
- Resume work button

---

### Phase 6: Polish & Testing (Week 3)
**Goal:** Refine UX and fix bugs

**Tasks:**
1. ✅ Add animations and transitions
2. ✅ Implement responsive design
3. ✅ Add keyboard shortcuts help modal
4. ✅ Test across browsers
5. ✅ Performance optimization
6. ✅ Accessibility audit

**Deliverables:**
- Smooth animations
- Mobile-responsive
- Keyboard shortcuts documented
- No major bugs
- Accessible (WCAG AA)

---

## 📊 SUCCESS METRICS

### Quantitative
- ✅ **75% reduction in navigation clicks** (baseline: 4.2 avg, target: <1.1)
- ✅ **15% more screen space** for content (auto-hide nav)
- ✅ **<200ms navigation response** time
- ✅ **100% project/batch visibility** (all visible in sidebar)
- ✅ **50% faster instruction updates** (inline vs. page navigation)

### Qualitative
- ✅ Users can navigate without losing context
- ✅ Instructions always accessible
- ✅ Dashboard provides clear overview
- ✅ Navigation feels fast and responsive
- ✅ Keyboard shortcuts improve efficiency

### User Feedback (Post-Launch)
- Survey: "How easy is it to find your projects/batches?" (1-5 scale, target: >4.2)
- Survey: "How often do you use the quick switcher?" (track adoption)
- Analytics: Track Cmd+K usage, sidebar collapse rate, drawer open rate

---

## 🎯 KEY DESIGN DECISIONS

### 1. **Why Left Sidebar over Top Tabs?**
- **Pro:** Vertical space is abundant on modern screens (1440px+ height)
- **Pro:** Hierarchical data (projects → batches) fits tree structure
- **Pro:** Persistent visibility without taking vertical space
- **Con:** Horizontal space is limited (1280-1920px width)
- **Decision:** Left sidebar with collapse option balances visibility and space

### 2. **Why Auto-Hide Top Nav?**
- **Pro:** Saves 64px of vertical space when scrolling
- **Pro:** User intent: scrolling down = consuming content, don't need nav
- **Pro:** Industry standard (Notion, Linear, etc.)
- **Con:** May feel "jumpy" if not smooth
- **Decision:** Auto-hide with smooth animation (200ms) on scroll down, instant show on scroll up

### 3. **Why Right Drawer over Modal?**
- **Pro:** Maintains context (can see content behind drawer)
- **Pro:** Faster to open/close (slide vs. fade)
- **Pro:** Fits fintech UI (side panels common in trading platforms)
- **Con:** Takes horizontal space
- **Decision:** Right drawer for desktop, modal for mobile

### 4. **Why Cmd+K Quick Switcher?**
- **Pro:** Industry standard (VSCode, GitHub, Notion, Linear, etc.)
- **Pro:** Power users love keyboard shortcuts
- **Pro:** Fuzzy search handles typos and partial matches
- **Con:** Discoverability (not all users know Cmd+K)
- **Decision:** Implement with prominent hint in UI ("Press Cmd+K to search")

---

## 🔮 FUTURE ENHANCEMENTS

### Short-Term (Next 3 Months)
- [ ] **Drag-and-drop project reordering** in sidebar
- [ ] **Favorite/pin projects** to top of sidebar
- [ ] **Batch search within project** (filter batches by name/date)
- [ ] **Keyboard shortcut help modal** (press ? to show all shortcuts)
- [ ] **Dark mode support** for all navigation components

### Medium-Term (3-6 Months)
- [ ] **Multi-workspace support** (switch between organizations)
- [ ] **Collaboration indicators** (who's viewing what)
- [ ] **Notification center** (bell icon in top nav)
- [ ] **Global search** (search jobs, not just projects/batches)
- [ ] **Command palette** (Cmd+Shift+P for actions)

### Long-Term (6-12 Months)
- [ ] **Custom views** (saved filters/sorts)
- [ ] **Dashboard customization** (drag-and-drop widgets)
- [ ] **Offline mode** (service worker for navigation)
- [ ] **Mobile app** (native navigation for iOS/Android)
- [ ] **Voice commands** (experimental)

---

## 📚 TECHNICAL STACK

### New Dependencies
```json
{
  "fuse.js": "^7.0.0",          // Fuzzy search
  "@headlessui/react": "^1.7.0", // Accessible components (already installed)
  "cmdk": "^0.2.0",              // Command palette (optional, can build custom)
  "react-hotkeys-hook": "^4.4.0" // Keyboard shortcuts
}
```

### File Structure
```
components/
├── navigation/
│   ├── TopNav.tsx              # Auto-hiding top navigation
│   ├── LeftSidebar.tsx         # Project tree sidebar
│   ├── RightDrawer.tsx         # Contextual drawer
│   ├── QuickSwitcher.tsx       # Cmd+K modal
│   ├── ProjectTreeItem.tsx     # Sidebar tree item
│   └── InstructionsEditor.tsx  # Drawer instructions editor
│
hooks/
├── useScrollDirection.ts       # Auto-hide logic
├── useKeyboardShortcut.ts      # Keyboard shortcut hook
└── useLocalStorage.ts          # Persist state
│
app/
├── dashboard/
│   └── page.tsx                # Dashboard homepage
│
api/
└── navigation/
    └── tree/
        └── route.ts            # Project tree API
```

---

## ✅ READY TO BUILD

This plan is comprehensive and actionable. All components are designed with:
- Clear user jobs and pain points
- Specific visual designs and behaviors
- Implementation details and code examples
- Success metrics and testing criteria
- Phased rollout plan (3 weeks)

**Next Steps:**
1. Review and approve this plan
2. Set up feature branch: `feature/navigation-redesign`
3. Start Phase 1: Foundation (auto-hide nav + sidebar shell)
4. Weekly demos and iteration

**Questions for User:**
1. Do you want to proceed with all 3 tiers (top nav, left sidebar, right drawer)?
2. Any specific keyboard shortcuts you prefer?
3. Should we build the dashboard page first, or start with navigation?
4. Any concerns about screen real estate on smaller screens?

---

**Status:** 📋 **READY FOR IMPLEMENTATION**

_Generated: 2025-11-05_
_Next Review: After Phase 1 completion_
