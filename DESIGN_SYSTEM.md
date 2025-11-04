# MINO Design System

A modern, warm fintech-inspired design system based on industry leaders like Ramp, Mercury, Square, and Robinhood.

## Core Principles

- **Warm & Approachable**: Using warm amber (#D97706) for primary actions instead of blue
- **Clean & Minimal**: Muted stone backgrounds (#FAFAF9), subtle shadows, and minimal motion
- **Dense & Efficient**: Fintech-style dense tables and large metric numbers
- **Accessible**: 44px minimum touch targets, proper contrast ratios, semantic HTML

## Color Palette

### Primary Colors
```css
--primary: 217 119 6        /* Amber 600 - Warm primary #D97706 */
--primary-hover: 180 83 9   /* Amber 700 - Darker on hover */
--primary-light: 254 243 199 /* Amber 100 - Light backgrounds */
```

### Background Colors
```css
--background: 250 250 249   /* Stone 50 - Warm off-white #FAFAF9 */
--card: 255 255 255         /* White for cards */
--surface-hover: 250 250 249 /* Stone 50 for hover states */
```

### Text Colors
```css
--foreground: 41 37 36      /* Stone 800 - Warm dark text #292524 */
--muted-foreground: 120 113 108 /* Stone 500 - Secondary text */
--text-light: 168 162 158   /* Stone 400 - Tertiary text */
```

### Border Colors
```css
--border: 231 229 228       /* Stone 200 - Standard borders */
--border-light: 245 245 244 /* Stone 100 - Light dividers */
```

### Semantic Colors
```css
--success: 22 163 74        /* Green 600 */
--success-light: 220 252 231 /* Green 100 */

--error: 220 38 38          /* Red 600 */
--error-light: 254 226 226  /* Red 100 */

--warning: 217 119 6        /* Amber 600 */
--warning-light: 254 243 199 /* Amber 100 */
```

## Typography

### Font Family
- **Primary**: Inter (with OpenType features: 'cv02', 'cv03', 'cv04', 'cv11', 'tnum')
- **Monospace**: SF Mono, Monaco, Roboto Mono

### Type Scale

#### Display Numbers (Dashboard Metrics)
```css
.metric-large     /* 60px bold, -2% letter-spacing, tabular numbers */
.metric-medium    /* 36px semibold, -1.5% letter-spacing */
.metric-small     /* 24px semibold, -1% letter-spacing */
```

#### Headings
```css
h1 / .heading-1   /* 36px semibold, -1% letter-spacing */
h2 / .heading-2   /* 30px semibold, -1% letter-spacing */
h3 / .heading-3   /* 24px semibold */
```

#### Labels
```css
.label-section    /* 12px semibold uppercase, 5% letter-spacing */
```

#### Body Text
```css
.text-body        /* 14px, 1.5 line-height */
.text-body-sm     /* 12px, 1.5 line-height */
```

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.03)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.03)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.03)
```

Usage:
- `shadow-fintech-sm` - Cards, inputs
- `shadow-fintech` - Elevated cards
- `shadow-fintech-lg` - Modals, dropdowns

## Transitions

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)  /* Hover states */
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)  /* Default */
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)  /* Panels, drawers */
```

Classes:
- `.transition-fintech-fast` - Quick hover effects
- `.transition-fintech` - Standard transitions
- `.transition-fintech-slow` - Smooth panel slides

## Components

### Buttons

#### Sizes
```html
<button class="btn btn-primary btn-sm">Small</button>    <!-- 36px min-height -->
<button class="btn btn-primary btn-md">Medium</button>   <!-- 40px min-height -->
<button class="btn btn-primary btn-lg">Large</button>    <!-- 44px min-height -->
```

#### Variants
```html
<button class="btn btn-primary">Primary</button>         <!-- Warm amber -->
<button class="btn btn-secondary">Secondary</button>     <!-- Stone 100 -->
<button class="btn btn-outline">Outline</button>         <!-- White w/ border -->
<button class="btn btn-ghost">Ghost</button>             <!-- Transparent -->
<button class="btn btn-success">Success</button>         <!-- Green -->
<button class="btn btn-danger">Danger</button>           <!-- Red -->
```

### Cards

```html
<!-- Basic card -->
<div class="card card-padding-md">Content</div>

<!-- Hoverable card -->
<div class="card card-fintech-hover">Content</div>

<!-- Padding variants -->
<div class="card card-padding-sm">Small padding</div>   <!-- 16px -->
<div class="card card-padding-md">Medium padding</div>  <!-- 24px -->
<div class="card card-padding-lg">Large padding</div>   <!-- 32px -->
```

### Inputs

```html
<input class="input-fintech" placeholder="Enter text" />
<input class="input-fintech input-sm" />
```

### Badges

```html
<span class="badge badge-success">Success</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-neutral">Neutral</span>
```

### Tables (Dense Fintech Style)

```html
<table class="table-fintech">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

Features:
- Stone 50 background for headers
- 3.5px vertical padding for dense rows
- Hover state on rows
- 12px uppercase font for headers

## Layout Patterns

### Dashboard Card Layout
```html
<Card className="card-padding-md">
  <div className="label-section mb-2">Total Revenue</div>
  <div className="metric-large">$1,234,567</div>
  <div className="text-muted text-sm mt-2">+12.5% from last month</div>
</Card>
```

### Dense Table Pattern (Ramp-style)
```html
<Card className="overflow-hidden">
  <table className="table-fintech">
    <!-- Headers with label-section styling -->
    <!-- Dense rows with hover states -->
  </table>
</Card>
```

### Three-Panel Layout
```html
<div className="flex h-screen">
  <!-- Left sidebar -->
  <aside className="w-80 panel-fintech border-r">...</aside>

  <!-- Main content -->
  <main className="flex-1 overflow-y-auto">...</main>

  <!-- Right sidebar -->
  <aside className="w-96 panel-fintech border-l">...</aside>
</div>
```

## Animations

### Fade In
```css
.animate-fade-in  /* Fades in with 8px upward motion */
```

### Slide In
```css
.animate-slide-in  /* Slides in from left */
```

### Hover Lift
```css
.hover-lift        /* Lifts 2px on hover with shadow */
```

### Loading Skeleton
```css
.skeleton-fintech  /* Shimmer animation for loading states */
```

## Spacing Scale

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
```

Utility classes:
- `.spacing-xs` - gap-1
- `.spacing-sm` - gap-2
- `.spacing-md` - gap-4
- `.spacing-lg` - gap-6
- `.spacing-xl` - gap-8

## Border Radius

```css
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
```

## Accessibility

### Touch Targets
- Minimum 44x44px for all interactive elements
- Small buttons can be 36px minimum

### Focus States
```css
.focus-fintech:focus {
  outline: none;
  ring: 2px solid rgb(var(--primary));
  ring-offset: 2px;
}
```

### Color Contrast
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

## Scrollbars

Minimal custom scrollbars across all scrollable areas:
```css
.scrollbar-fintech  /* Thin scrollbar with Stone colors */
.scrollbar-thin     /* Alias for compatibility */
```

## Icon Usage

- **Lucide Icons** - Consistent stroke-width: 2
- **Size Guidelines**:
  - Small: 16px (h-4 w-4)
  - Medium: 20px (h-5 w-5)
  - Large: 24px (h-6 w-6)

## Best Practices

1. **Always use tabular numbers for metrics** - Add `tabular-nums` class
2. **Prefer warm colors** - Use amber for primary, avoid blue
3. **Keep shadows subtle** - Max shadow-fintech-lg
4. **Use consistent spacing** - Stick to the spacing scale
5. **Animate thoughtfully** - Use transitions for all interactive states
6. **Dense layouts** - Maximize information density like fintech apps
7. **Warm backgrounds** - Use Stone 50 (#FAFAF9), not gray-50
8. **Clean typography** - Inter with proper OpenType features

## Component Combinations

### Metric Card
```tsx
<Card className="card-padding-md hover-lift">
  <div className="label-section mb-3">Revenue</div>
  <div className="metric-large text-foreground">$1.2M</div>
  <div className="flex items-center gap-2 mt-3">
    <Badge variant="success">+12%</Badge>
    <span className="text-muted text-sm">vs last month</span>
  </div>
</Card>
```

### Dense Data Row
```tsx
<div className="flex items-center justify-between py-3 border-b border-border-light hover:bg-background transition-fintech-fast">
  <div className="flex items-center gap-3">
    <Badge variant="success">Active</Badge>
    <span className="font-medium">Project Name</span>
  </div>
  <span className="metric-small tabular-nums">$1,234</span>
</div>
```

## Usage with Tailwind

All design tokens are available as Tailwind utilities:
```tsx
<div className="bg-background text-foreground border-border">
  <h1 className="text-3xl font-semibold text-foreground">Title</h1>
  <p className="text-muted-foreground">Subtitle</p>
  <button className="bg-primary text-primary-foreground hover:bg-primary-hover">
    Action
  </button>
</div>
```
