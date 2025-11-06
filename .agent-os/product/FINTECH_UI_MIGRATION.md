# Fintech UI Migration - Complete Plan

## ✅ Completed

### 1. Custom Fintech Theme
- ✅ Copied emerald green color palette from mino-v2
- ✅ Robinhood-inspired design system
- ✅ Custom shadows (shadow-fintech-sm/md/lg)
- ✅ Subtle pulse animation for running agents

### 2. Custom Components Migrated
- ✅ **Button.tsx** - Emerald green primary, custom variants
- ✅ **Badge.tsx** - Status badges with fintech styling
- ✅ **Card.tsx** - Clean card component with fintech shadows
- ✅ **Toast.tsx** - Toast notifications
- ✅ **ExecutionStats.tsx** - Live stats display

### 3. Enhanced LiveExecutionGrid
- ✅ Uses custom Card component (not shadcn)
- ✅ Emerald green for active jobs
- ✅ Amber for stalled jobs
- ✅ Smart fallback messages (time-based)
- ✅ Stalled job detection (>60s or >90s no activity)
- ✅ Progress bars with emerald/amber themes
- ✅ All backend features integrated:
  - currentStep tracking
  - progressPercentage
  - lastActivityAt
  - Polling every 1-2 seconds

---

## 🔄 In Progress

### Update Batch Detail Page
Replace RunningAgents component with LiveExecutionGrid

**File**: `app/projects/[id]/batches/[batchId]/page.tsx`

**Changes needed**:
1. Import LiveExecutionGrid
2. Create client wrapper to fetch running jobs
3. Replace RunningAgents section

---

## 📋 Remaining Work

### Pages to Migrate

1. **Batch Detail Page** (`app/projects/[id]/batches/[batchId]/page.tsx`)
   - ✅ Remove RunningAgents
   - 🔄 Add LiveExecutionGrid
   - ⏳ Update all shadcn components to custom
   - ⏳ Use Button, Badge, Card from custom components

2. **Project Detail Page** (`app/projects/[id]/page.tsx`)
   - ⏳ Replace shadcn Card with custom Card
   - ⏳ Use custom Button components
   - ⏳ Update BatchCard with fintech styling
   - ⏳ Emerald green theme throughout

3. **Projects List** (`app/projects/page.tsx`)
   - ⏳ Custom Card for project cards
   - ⏳ Emerald theme
   - ⏳ Custom Button

4. **Job Detail** (`app/projects/[id]/jobs/[jobId]/page.tsx`)
   - ⏳ Custom components
   - ⏳ Fintech styling

5. **Batch Creation** (`app/projects/[id]/batches/new/page.tsx`)
   - ⏳ Already has correct flow (MINO F3)
   - ⏳ Update to fintech UI
   - ⏳ Custom components

6. **Auth Pages** (`app/auth/signin/page.tsx`)
   - ⏳ Fintech login page
   - ⏳ Emerald green buttons

---

## 🎨 Fintech UI Characteristics

### Colors
- **Primary**: Emerald green `rgb(52, 211, 153)` - #34D399
- **Primary Hover**: `rgb(16, 185, 129)` - #10B981
- **Success**: Green `rgb(34, 197, 94)`
- **Warning**: Amber `rgb(245, 158, 11)`
- **Error**: Red `rgb(239, 68, 68)`
- **Background**: Pure white `#FFFFFF`
- **Text**: Black with gray variants

### Typography
- **Base size**: 15px (Robinhood standard)
- **Font**: Inter, -apple-system, sans-serif
- **Letter spacing**: -0.003em (tighter tracking)
- **Headers**: Bold, -0.022em tracking

### Components Style
- **Buttons**: Rounded-md, active scale effect
- **Cards**: White bg, subtle shadows, clean borders
- **Badges**: Rounded-full, status-based colors
- **Progress bars**: Rounded-full, smooth transitions

### Animations
- **Transitions**: 150-300ms cubic-bezier
- **Pulse**: 2s ease-in-out for running agents
- **Scale**: 0.98 on button active

---

## 🔧 Migration Strategy

### Phase 1: Core Components (✅ DONE)
1. Theme (globals.css)
2. Button, Badge, Card
3. LiveExecutionGrid with all features

### Phase 2: Batch Views (🔄 IN PROGRESS)
1. Batch detail with LiveExecutionGrid
2. Batch creation page
3. Batch list

### Phase 3: Project Views (⏳ TODO)
1. Project detail
2. Projects list
3. Project creation

### Phase 4: Job Views (⏳ TODO)
1. Job detail
2. Job list

### Phase 5: Auth & Settings (⏳ TODO)
1. Sign in
2. Profile
3. Organization settings

---

## 🎯 Feature Preservation

All backend features MUST be preserved:
- ✅ Live job updates (2-3s polling)
- ✅ Running agents display
- ✅ Progress tracking with currentStep
- ✅ Stalled job detection
- ✅ Smart fallback messages
- ✅ Job filtering
- ✅ Ground truth evaluation
- ✅ Batch execution controls
- ✅ Real EVA agent integration
- ✅ Multi-tenancy (organizationId)

---

## 📝 Next Steps

1. **Update batch detail page** - Add LiveExecutionGrid client wrapper
2. **Create BatchDetailClient** - Client component for live updates
3. **Migrate project pages** - Use custom components
4. **Test end-to-end** - Verify all features work with new UI

---

## 🚀 Expected Outcome

### Before (Shadcn UI)
- Stone/amber color scheme
- Shadcn components
- Generic styling

### After (Fintech UI)
- Emerald green (Robinhood-style)
- Custom components
- Professional fintech design
- Same functionality, better UX
- Clean, modern interface

---

## 📁 Key Files

### Theme
- `app/globals.css` - Complete fintech theme

### Components
- `components/Button.tsx` - Emerald primary
- `components/Badge.tsx` - Status badges
- `components/Card.tsx` - Fintech cards
- `components/live-execution-grid.tsx` - Running agents with fintech UI

### Pages (To Update)
- All `app/projects/**/*.tsx` files
- All `app/auth/**/*.tsx` files
- Navigation components

---

**Total Progress**: ~30% Complete
- ✅ Theme & Core Components
- 🔄 Batch Pages
- ⏳ Project Pages
- ⏳ Job Pages
- ⏳ Auth Pages
