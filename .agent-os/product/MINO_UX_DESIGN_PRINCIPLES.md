# MINO UX Design Principles
**Synthesized from User Feedback - November 5, 2025**

---

## 🎯 Core Philosophy

**"Progressive Disclosure, Maximum Density, Minimum Friction"**

MINO is a **power tool for data professionals**. The interface should prioritize:
1. **Information density** over whitespace
2. **Quick access** over visual beauty
3. **Contextual actions** over fixed navigation
4. **Status visibility** over feature discovery

---

## 📐 The 10 Design Principles

### 1. **Default to Minimal, Expand on Demand**
**Problem**: Large cards, excessive whitespace, always-visible elements waste screen real estate.

**Solution**:
- Start with compact, icon-only representations
- Expand to show labels/details on hover
- Show full content only on click/interaction
- Default collapsed state for all collapsible elements

**Examples**:
- Sidebar: Collapsed by default, icon-only when collapsed, NO visible bar when collapsed
- Action buttons: Icon-only until hover
- Section headers: Collapse on scroll
- Tool panels: Hidden until explicitly opened

---

### 2. **Context-Aware Actions**
**Problem**: Fixed navigation forces users to hunt for actions across multiple locations.

**Solution**:
- **Consistent action buttons** that follow context (e.g., Instructions button always accessible)
- Actions appear based on current view/selection
- Right-side drawers for contextual workflows
- Floating action buttons (FAB) for primary actions

**Examples**:
- **"Instructions" button**: Always visible in header when in any project view, opens right drawer
- Batch actions: Only show when batch is selected
- Bulk operations: Appear when multiple items selected

---

### 3. **Status is King**
**Problem**: At project level, users care about batch status/health, not feature discovery.

**Solution**:
- **Batch status** should be the PRIMARY information at project level
- Visual status indicators (color, icons) immediately visible
- Health metrics above the fold
- Quick status scanning without clicking

**Information Hierarchy (Project Level)**:
```
1. Batch name + status badge
2. Key metrics (completion %, pass rate, duration)
3. Quick actions (run, view, edit)
4. Secondary info (created date, jobs count)
```

---

### 4. **One Line is Better Than Three**
**Problem**: Verbose layouts waste vertical space, forcing excessive scrolling.

**Solution**:
- Horizontal layouts by default
- Inline actions instead of separate rows
- Compact metadata displays
- Smart truncation with expand on hover

**Before**:
```
Batch Name
50 sites
19 columns
Status: Complete
```

**After**:
```
Batch Name  •  50 sites  •  19 cols  •  ✓ Complete
```

---

### 5. **Progressive Disclosure Through Interaction**
**Problem**: Showing all options/features simultaneously overwhelms users.

**Solution**:
- Show essentials first
- Reveal details on hover
- Expand content on click
- Hide advanced features behind "More" menus

**Levels of Disclosure**:
1. **Default**: Core info + status
2. **Hover**: Labels, tooltips, preview
3. **Click**: Full details, all actions
4. **Advanced**: Settings, version history, debug info

---

### 6. **Scroll-Responsive UI**
**Problem**: Fixed headers waste space when user scrolls down.

**Solution**:
- Headers collapse to compact mode on scroll down
- Expand back to full mode on scroll up
- Sticky elements become icon-only on scroll
- Context preserved but space maximized

**Scroll States**:
- **Top**: Full header with breadcrumbs, title, metadata
- **Scrolling**: Compact header with just title + key actions
- **Scroll Up**: Smooth expansion back to full

---

### 7. **Right-Side Drawers for Workflows**
**Problem**: Modal dialogs block content, separate pages break context.

**Solution**:
- **Right-side drawer** for all workflow interactions
- Keep main content visible for reference
- Persistent access to workflow tools
- Easy dismissal without losing work

**Use Cases**:
- **Instructions editor**: Right drawer with version history nested inside
- **Ground Truth setup**: Right drawer with column mapping
- **Export options**: Right drawer with format selection
- **Settings**: Right drawer with save/cancel actions

---

### 8. **Nest, Don't Separate**
**Problem**: Treating related features as separate sections fragments the experience.

**Solution**:
- Nest secondary features within primary contexts
- Version control INSIDE instruction editor, not separate section
- Settings within each component, not global settings page
- History/audit logs within item details, not separate view

**Example - Instructions**:
```
Instructions Drawer (Right Side)
├── Current Instructions (main content)
├── Edit Mode
└── ⚙ Advanced (collapsed by default)
    ├── Version History
    ├── A/B Test Variants
    └── Performance Stats
```

---

### 9. **Icon-First, Label-Second**
**Problem**: Text labels take up space and slow down visual scanning.

**Solution**:
- Use icons for common actions
- Show labels only on hover
- Group related icons together
- Consistent icon language across product

**Icon Usage**:
- ✏️ Edit
- ▶️ Run/Execute
- 📊 Analytics/Stats
- 📥 Export
- ⚙️ Settings
- 📋 Copy
- 🗑️ Delete
- 📝 Instructions
- ✓ Validate/Check

---

### 10. **Batch-Centric Project View**
**Problem**: Current project view doesn't emphasize batch status/health clearly enough.

**Solution**:
- **Table/list view** as default for batches
- Status badges prominent and color-coded
- Quick metrics inline (pass rate, completion, duration)
- Sortable by status, last run, pass rate
- Bulk actions in header

**Batch Row Layout**:
```
[Status Badge] Batch Name  •  50/50 jobs  •  95% pass  •  2h ago  [▶️ Run] [📊 View] [⋯ More]
```

---

## 🎨 Visual Implementation Guidelines

### Spacing System
- **0px**: Default collapsed/hidden state
- **4px**: Minimum gap between related elements
- **8px**: Standard gap between elements
- **12px**: Gap between sections
- **16px**: Major section separation
- **24px**: Page margins (not more!)

### Typography Scale
- **12px**: Metadata, timestamps, labels
- **14px**: Body text, table content
- **16px**: Section headers (not larger!)
- **20px**: Page titles (max!)
- **24px**: Reserved for marketing pages only

### Color Usage (Fintech Theme)
- **Emerald 500** (`#10b981`): Success, primary actions
- **Gray 600**: Body text
- **Gray 400**: Secondary text
- **Gray 200**: Borders, dividers
- **Amber 500**: Warnings, pending states
- **Red 500**: Errors, failed states
- **Blue 500**: Info, running states

---

## 🏗️ Component Architecture

### 1. Collapsible Sidebar (Global Navigation)
```tsx
<Sidebar
  defaultCollapsed={true}
  collapsedWidth={0}  // Completely hidden
  expandedWidth={240}
  trigger="hover" // Expands on hover over left edge
>
  <SidebarContent>
    {/* Projects list */}
  </SidebarContent>
</Sidebar>
```

**States**:
- **Collapsed (default)**: 0px width, nothing visible
- **Hover trigger**: Slim 2px emerald bar appears on left edge
- **Expanded**: 240px sidebar slides in from left
- **Pinned**: User can pin to keep expanded

---

### 2. Right-Side Drawer (Context Panel)
```tsx
<Drawer
  side="right"
  width={480}
  overlay={false}  // Don't block main content
>
  <DrawerContent>
    {/* Instructions, GT setup, etc */}
  </DrawerContent>
</Drawer>
```

**Use Cases**:
- Instructions editor (with version history nested)
- Ground Truth setup
- Export options
- Batch configuration
- Job details

---

### 3. Scroll-Responsive Header
```tsx
<Header
  scrollThreshold={50}
  compactMode={isScrolled}
>
  {isScrolled ? (
    <CompactHeader title={batchName} actions={primaryActions} />
  ) : (
    <FullHeader breadcrumbs metadata title actions />
  )}
</Header>
```

**Behavior**:
- Full height at top: 80px
- Compact height on scroll: 48px
- Smooth transition
- Preserve context (title + primary action)

---

### 4. Progressive Disclosure Button Group
```tsx
<ButtonGroup mode="progressive">
  {/* Default: Icons only */}
  <Button icon={Edit} label="Instructions" showLabel={isHovered} />
  <Button icon={CheckCircle} label="Ground Truth" showLabel={isHovered} />
  <Button icon={Download} label="Export" showLabel={isHovered} />
</ButtonGroup>
```

**States**:
1. **Default**: 3 icon buttons, 36px total width
2. **Hover**: Labels appear, buttons expand
3. **Click**: Action executes or drawer opens

---

## 📱 Responsive Breakpoints

### Desktop (1280px+)
- Default collapsed sidebar (0px)
- Right drawer 480px
- Main content: Remaining space
- Tables: Full columns visible

### Laptop (1024px - 1279px)
- Right drawer 400px
- Slightly more aggressive text truncation
- Some columns hidden by default

### Tablet (768px - 1023px)
- Right drawer 100% width (slides over content)
- Sidebar stays collapsed
- Mobile-optimized tables

---

## 🚀 Implementation Priority

### Phase 1: Core Navigation (Week 1)
1. ✅ Collapsible sidebar with default collapsed
2. ✅ Right-side instruction drawer
3. ✅ Scroll-responsive header
4. ✅ Consistent instruction button in header

### Phase 2: Content Density (Week 2)
5. ✅ Compress batch list to status-first table
6. ✅ Icon-only action buttons with hover labels
7. ✅ One-line metadata displays
8. ✅ Progressive disclosure for all sections

### Phase 3: Context Optimization (Week 3)
9. ✅ Nest version control inside instructions
10. ✅ Contextual action buttons based on view
11. ✅ Batch-centric project dashboard
12. ✅ Quick status scanning

### Phase 4: Polish & Consistency (Week 4)
13. ✅ Apply principles to ALL pages
14. ✅ Consistent spacing/typography
15. ✅ Icon standardization
16. ✅ Animation/transition polish

---

## 📊 Success Metrics

### Information Density
- **Before**: ~300px per batch row
- **Target**: ~60px per batch row (5x improvement)

### Above-the-Fold Content
- **Before**: 3-4 batches visible
- **Target**: 10-12 batches visible

### Click Depth
- **Before**: 3 clicks to view batch results
- **Target**: 1 click to view batch results

### Context Switching
- **Before**: Navigate away to edit instructions
- **Target**: Edit in-place with drawer

---

## 🎓 Design Language Examples

### ❌ AVOID (Current Issues)

**Large Cards**:
```
┌─────────────────────────────────────┐
│  1  Instructions                    │
│                                     │
│  ✓ Using campaign instructions      │
│                                     │
│  [         Edit          ]          │
│                                     │
└─────────────────────────────────────┘
```

**Verbose Headers**:
```
← Back to Project

expedia example - Sheet1
50 sites  •  19 columns
```

**Separate Sections**:
```
Main Nav:
- Projects
- Batches
- Instructions ← separate from context
- Version History ← separate from instructions
- Settings
```

---

### ✅ EMBRACE (New Approach)

**Compact Buttons**:
```
[📝] [✓] [📥]  ← icons only, hover for labels
```

**Dense Headers**:
```
expedia example  •  50 sites  •  19 cols  •  ✓ Complete  [📝 Instructions]
```

**Nested Context**:
```
[📝 Instructions Button] → Opens Right Drawer
  │
  ├── Current Instructions
  ├── Edit Mode
  └── ⚙️ Advanced
      ├── Version History ← nested here!
      └── A/B Tests
```

---

## 🎯 Application Across Product

### Project Dashboard
- **Primary**: Batch list (table view)
- **Status**: Color-coded badges (emerald/amber/red)
- **Actions**: Icon buttons (run, view, more)
- **Metrics**: Inline (50/50 jobs, 95% pass, 2h ago)
- **Sidebar**: Collapsed by default
- **Instructions**: Floating button in header

### Batch Detail View
- **Header**: Scroll-responsive, compact on scroll
- **Job Table**: Dense, status-first, sortable
- **Actions**: Contextual (appear based on selection)
- **Instructions**: Right drawer, always accessible
- **Metrics**: Above the fold, one line

### Job Detail View
- **Context**: Breadcrumb in compact header
- **Primary**: Extraction results front and center
- **Timeline**: Collapsed by default, expand on demand
- **Screenshots**: Thumbnail preview, full view on click
- **Actions**: Icon-only in header

---

## 💡 Key Takeaways

1. **Space is precious**: Every pixel counts. Default to minimal, expand on demand.

2. **Status matters most**: Users want to see batch health at a glance, not hunt for it.

3. **Context is king**: Actions should be contextual, not scattered across navigation.

4. **Progressive disclosure**: Show what's needed, hide what's not, reveal on interaction.

5. **Consistency wins**: One instruction button, one pattern, everywhere.

6. **Nest related features**: Version control belongs INSIDE instructions, not separate.

7. **Right-side for workflows**: Drawers keep context, modals break it.

8. **Icons save space**: Icon-first, label on hover, action on click.

9. **Scroll matters**: Headers should collapse on scroll to maximize content area.

10. **Batch-centric view**: Projects are collections of batches—make that obvious.

---

## 🚀 Next Steps

1. ✅ Create collapsible sidebar component
2. ✅ Build right-side drawer system
3. ✅ Implement scroll-responsive header
4. ✅ Redesign batch list for status-first approach
5. ✅ Create progressive disclosure button components
6. ✅ Nest version control inside instruction drawer
7. ✅ Apply icon-first pattern to all actions
8. ✅ Compress all metadata to one-line displays
9. ✅ Test with real users
10. ✅ Iterate based on feedback

---

**This is the MINO way: Dense, efficient, contextual, and friction-free.** 🚀
