# MINO UX Design Standards

**Version**: 1.0
**Last Updated**: November 5, 2025
**Status**: Active - All code changes must follow these principles

---

## 📋 Purpose

This document establishes the mandatory UX design standards for MINO. All UI/UX changes must adhere to these principles to ensure consistency, efficiency, and optimal user experience across the platform.

---

## 🎯 Core Philosophy

**"Progressive Disclosure, Maximum Density, Minimum Friction"**

MINO is a **power tool for data professionals**. The interface prioritizes:
1. **Information density** over whitespace
2. **Quick access** over visual beauty
3. **Contextual actions** over fixed navigation
4. **Status visibility** over feature discovery

---

## 📐 The 10 Mandatory Principles

### 1. Default to Minimal, Expand on Demand
- Start with compact, icon-only representations
- Expand to show labels/details on hover
- Show full content only on click/interaction
- Default collapsed state for all collapsible elements
- **Examples**: Collapsed sidebar (0px), icon-only buttons, collapsed sections

### 2. Context-Aware Actions
- Consistent action buttons that follow context
- Actions appear based on current view/selection
- Right-side drawers for contextual workflows
- **Key Rule**: "Instructions" button always accessible in project context

### 3. Status is King
- Batch status should be PRIMARY information at project level
- Visual status indicators (color, icons) immediately visible
- Health metrics above the fold
- Quick status scanning without clicking

### 4. One Line is Better Than Three
- Horizontal layouts by default
- Inline actions instead of separate rows
- Compact metadata displays
- Smart truncation with expand on hover

### 5. Progressive Disclosure Through Interaction
- Show essentials first
- Reveal details on hover
- Expand content on click
- Hide advanced features behind "More" menus

### 6. Scroll-Responsive UI
- Headers collapse to compact mode on scroll down
- Expand back to full mode on scroll up
- Sticky elements become icon-only on scroll
- Context preserved but space maximized

### 7. Right-Side Drawers for Workflows
- Right-side drawer for all workflow interactions
- Keep main content visible (no overlay)
- Persistent access to workflow tools
- Easy dismissal without losing work
- Width: 480px standard

### 8. Nest, Don't Separate
- Nest secondary features within primary contexts
- Version control INSIDE instruction editor
- Settings within each component
- History/audit logs within item details

### 9. Icon-First, Label-Second
- Use icons for common actions
- Show labels only on hover
- Group related icons together
- Consistent icon language across product

### 10. Batch-Centric Project View
- Table/list view as default for batches
- Status badges prominent and color-coded
- Quick metrics inline
- Sortable by status, last run, pass rate

---

## 🎨 Visual Standards

### Spacing System
- 0px: Collapsed/hidden state
- 4px: Minimum gap between related elements
- 8px: Standard gap between elements
- 12px: Gap between sections
- 16px: Major section separation
- 24px: Page margins (not more!)

### Typography Scale
- 12px: Metadata, timestamps, labels
- 14px: Body text, table content
- 16px: Section headers (not larger!)
- 20px: Page titles (max!)

### Color Usage
- **Emerald 500** (`#10b981`): Success, primary actions
- **Gray 600**: Body text
- **Gray 400**: Secondary text
- **Gray 200**: Borders, dividers
- **Amber 500**: Warnings, pending states
- **Red 500**: Errors, failed states
- **Blue 500**: Info, running states

---

## 🔧 Component Standards

### Sidebar
- **Default state**: Collapsed (0px width)
- **Collapsed**: Completely hidden, 2px hover trigger on left edge
- **Expanded**: 280px width, slides in from left
- **Toggle**: Cmd+\\ keyboard shortcut

### Right Drawer
- **Width**: 480px
- **Overlay**: None (don't block main content)
- **Position**: Fixed right, below top nav
- **Close**: Escape key or X button
- **Toggle**: Cmd+I for instructions

### Headers
- **Full height**: 80px (at top of page)
- **Compact height**: 48px (on scroll down)
- **Transition**: Smooth 300ms
- **Contents**: Title + key metrics + primary actions only

### Buttons
- **Default**: Icon-only (36px height)
- **Hover**: Show label
- **Primary**: Emerald background
- **Secondary**: Outlined
- **Icon size**: 16px (h-4 w-4)

### Status Badges
- **Size**: Compact (px-2 py-1)
- **Colors**: Emerald (success), Amber (warning), Red (error), Blue (running)
- **Always visible**: Never hidden behind hover/click

---

## ✅ Implementation Checklist

When creating or modifying any UI component, ensure:

- [ ] Sidebar defaults to collapsed (0px)
- [ ] Right drawer is 480px with no overlay
- [ ] Headers collapse on scroll
- [ ] Action buttons are icon-only (labels on hover)
- [ ] Metadata is compressed to one line
- [ ] Status badges are immediately visible
- [ ] Spacing follows the defined system
- [ ] Typography follows the defined scale
- [ ] Colors match the fintech theme
- [ ] No unnecessary whitespace
- [ ] Contextual actions are provided
- [ ] Related features are nested (not separated)

---

## 🚫 Common Violations (Avoid These)

### ❌ Don't:
- Large cards with excessive whitespace
- Multi-line headers that could be one line
- Always-visible large button labels
- Separate navigation sections for related features
- Modal dialogs that block content
- Fixed headers that waste space on scroll
- Default-expanded sidebars
- Overlay backgrounds on drawers

### ✅ Do:
- Compact icon buttons with hover labels
- Single-line metadata displays
- Nested secondary features
- Right-side drawers for workflows
- Scroll-responsive headers
- Default-collapsed sidebars
- No overlays on contextual panels

---

## 📊 Success Metrics

Every UX change should aim for:

- **Information Density**: 5x more content above the fold
- **Click Depth**: Reduce by 50% for common actions
- **Context Switching**: Eliminate full page navigations for workflows
- **Scan Time**: Users find batch status in <1 second

---

## 🔗 Reference Documents

1. **Full Design Principles**: `.agent-os/product/MINO_UX_DESIGN_PRINCIPLES.md`
2. **Implementation Status**: `.agent-os/product/UX_REDESIGN_IMPLEMENTATION_STATUS.md`

---

## 📝 Updates

When updating these standards:

1. Bump version number
2. Update "Last Updated" date
3. Document changes in UX_REDESIGN_IMPLEMENTATION_STATUS.md
4. Notify team of breaking changes

---

**This is now the MINO standard. All code must comply.** 🚀
