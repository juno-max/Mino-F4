# Tech Stack

## Context

Core Framework:
  - Next.js 15.4.7 with App Router and Turbopack
  - React 19.1.1 with React DOM 19.1.1
  - TypeScript 5 with strict type checking

Styling & UI:
- Tailwind CSS 4 with custom design system
- Radix UI components (accordion, dialog, slider, tabs, slot)
- shadcn/ui patterns with class-variance-authority
- Framer Motion for animations
- Lucide React for icons
- Custom design tokens (HSL-based color system)

State Management & Data:
- Zod for schema validation
- use-query-params for URL state management
- React Server Actions for mutations

Testing & Development:
- Vitest for unit testing with jsdom
- Testing Library (React, Jest DOM, User Event)
- ESLint with Next.js config
- Prettier with Tailwind and import sorting plugins
- TypeScript strict mode with path mapping

Data Handling:
- date-fns with timezone support
- sonner for toast notifications

Build & Deployment:
- Standalone output mode for Docker
- 5MB server action body size limit