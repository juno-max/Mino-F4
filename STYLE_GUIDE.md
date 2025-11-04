# MINO UI Style Guide

Comprehensive design system based on modern fintech products (Ramp, Square, Mercury, Robinhood).

## Design Principles

- **Clean & Professional**: Trustworthy appearance that conveys reliability
- **Generous Whitespace**: Clear visual hierarchy through spacing
- **Consistent Spacing**: 4px base unit system throughout
- **Accessible Contrast**: WCAG AA compliant color combinations
- **Subtle Interactions**: Smooth, purposeful animations

## Color Palette

### Primary Colors
- **Primary Blue**: `#3b82f6` (blue-500)` - Main brand color for primary actions
- **Success Green**: `#22c55e (green-500)` - Positive states, success indicators
- **Warning Amber**: `#f59e0b (amber-500)` - Caution states, pending actions
- **Error Red**: `#ef4444 (red-500)` - Destructive actions, errors

### Neutral Grays
- **Gray 50**: `#f9fafb` - Background
- **Gray 100**: `#f3f4f6` - Muted backgrounds
- **Gray 200**: `#e5e7eb` - Borders
- **Gray 300**: `#d1d5db` - Subtle borders
- **Gray 400**: `#9ca3af` - Icons, placeholders
- **Gray 500**: `#6b7280` - Secondary text
- **Gray 600**: `#4b5563` - Muted text
- **Gray 700**: `#374151` - Secondary headings
- **Gray 800**: `#1f2937` - Primary text (dark mode)
- **Gray 900**: `#111827` - Primary headings, primary text

### Usage Guidelines
- **Primary text**: `text-gray-900`
- **Secondary text**: `text-gray-600`
- **Muted text**: `text-gray-500`
- **Borders**: `border-gray-200`
- **Backgrounds**: `bg-gray-50` or `bg-white`

## Typography

### Font Family
- **Primary**: Inter (sans-serif)
- **Monospace**: SF Mono, Monaco, Roboto Mono (for code/data)

### Type Scale
- **XS**: 12px / 1rem - Labels, captions
- **SM**: 14px / 0.875rem - Body text, buttons
- **Base**: 16px / 1rem - Default body text
- **LG**: 18px / 1.125rem - Emphasized body text
- **XL**: 20px / 1.25rem - Small headings
- **2XL**: 24px / 1.5rem - Section headings
- **3XL**: 30px / 1.875rem - Page titles
- **4XL**: 36px / 2.25rem - Hero text

### Font Weights
- **Normal**: 400 - Body text
- **Medium**: 500 - Emphasized text
- **Semibold**: 600 - Headings, labels
- **Bold**: 700 - Strong emphasis (use sparingly)

### Letter Spacing
- Headings: `-0.025em` (tighter for larger text)
- Body: `-0.011em` (subtle tightening)
- Uppercase labels: `0.05em` (wider for readability)

## Spacing System

Based on 4px grid system:
- **1**: 4px
- **2**: 8px
- **3**: 12px
- **4**: 16px (most common)
- **6**: 24px
- **8**: 32px
- **12**: 48px
- **16**: 64px

### Container Spacing
- **Padding (responsive)**:
  - Mobile: `px-4`
  - Tablet: `sm:px-6`
  - Desktop: `lg:px-8`

## Border Radius

- **SM**: 4px - Small elements
- **Base/MD**: 8px - Default (buttons, inputs, cards)
- **LG**: 12px - Large cards
- **Full**: 9999px - Pills, avatars

## Shadows

- **Fintech (sm)**: `0 1px 2px 0 rgb(0 0 0 / 0.05)` - Subtle elevation
- **Fintech MD**: `0 1px 3px 0 rgb(0 0 0 / 0.1)` - Cards, dropdowns
- **Fintech LG**: `0 4px 6px -1px rgb(0 0 0 / 0.1)` - Modals, panels

## Component Styles

### Buttons

**Variants:**
- **Primary**: Blue background, white text, shadow
- **Secondary**: Gray background, dark text
- **Outline**: Border, transparent background
- **Ghost**: Transparent, hover background
- **Success**: Green background, white text
- **Danger**: Red background, white text

**Sizes:**
- **SM**: `h-8`, `px-3 py-1.5`, `text-sm`
- **MD**: `h-10`, `px-4 py-2`, `text-sm` (default)
- **LG**: `h-12`, `px-6 py-3`, `text-base`

**States:**
- Hover: Darker shade or background change
- Focus: Ring-2 with primary color
- Disabled: 50% opacity

### Cards

- Background: White
- Border: `border-gray-200`
- Shadow: `shadow-sm`
- Radius: `rounded-lg` (8px)
- Padding: `p-6` (default), `p-4` (small), `p-8` (large)

### Inputs

- Height: `h-10` (default)
- Border: `border-gray-300`
- Focus: `ring-2 ring-blue-500 border-blue-500`
- Error: `border-red-300 focus:ring-red-500`
- Placeholder: `text-gray-400`

### Tables

- Header: `bg-gray-50`, `border-b border-gray-200`
- Header cells: `text-xs font-semibold text-gray-500 uppercase tracking-wider`
- Body cells: `text-sm text-gray-900`
- Rows: `hover:bg-gray-50`, `border-b border-gray-100`
- Scrollbar: Thin, custom styled

### Badges

- Size: `px-2.5 py-0.5`, `text-xs`, `rounded-full`
- Variants:
  - Success: `bg-green-100 text-green-800`
  - Warning: `bg-amber-100 text-amber-800`
  - Error: `bg-red-100 text-red-800`
  - Info: `bg-blue-100 text-blue-800`
  - Neutral: `bg-gray-100 text-gray-800`

## Layout Patterns

### Headers
- Background: White
- Border: `border-b border-gray-200`
- Shadow: `shadow-sm`
- Sticky: `sticky top-0 z-10`
- Padding: `py-4` (default)

### Page Containers
- Max width: `max-w-7xl mx-auto`
- Padding: Responsive (`px-4 sm:px-6 lg:px-8`)

### Section Spacing
- Between sections: `mb-8` or `space-y-8`

## Iconography

- **Library**: Lucide React
- **Size standards**:
  - Small: `h-3 w-3` (12px) - Inline with text
  - Default: `h-4 w-4` (16px) - Most common
  - Medium: `h-5 w-5` (20px) - Section headers
  - Large: `h-6 w-6` (24px) - Feature icons

- **Color**: Inherit from parent or use `text-gray-400` for muted icons

## Transitions

- **Duration**: 200ms for most interactions
- **Easing**: `ease-out` for natural feel
- **Properties**: `transition-all` or specific properties

## Status Colors

- **Success**: Green (positive actions, completed states)
- **Warning**: Amber (pending, caution)
- **Error**: Red (failures, destructive)
- **Info**: Blue (information, neutral status)

## Best Practices

1. **Consistency**: Always use design tokens, never hardcode colors
2. **Accessibility**: Maintain WCAG AA contrast ratios
3. **Responsive**: Mobile-first approach with responsive spacing
4. **Performance**: Use CSS transitions over JavaScript animations
5. **Semantic HTML**: Proper heading hierarchy, ARIA labels where needed

## Examples

### Primary Button
```tsx
<Button variant="primary" size="md">
  Save Changes
</Button>
```

### Card with Content
```tsx
<Card padding="md">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Title</h3>
  <p className="text-sm text-gray-600">Content here</p>
</Card>
```

### Table Row
```tsx
<TableRow>
  <TableCell className="font-medium text-gray-900">Value</TableCell>
  <TableCell className="text-gray-600">Secondary</TableCell>
</TableRow>
```

This style guide ensures consistency across all MINO interfaces, creating a professional, trustworthy fintech experience.

