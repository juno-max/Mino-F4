# Code Style Guide

## TypeScript & React Conventions

### File Naming
- **Files**: Use `kebab-case.tsx` for all files
- **Components**: Use `PascalCase` for component names
- **Test Files**: Keep test files adjacent to source files with `.test.tsx` extension

### Component Structure
```tsx
// 1. Imports (sorted by type)
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from '@/types';

// 2. Type/Interface definitions
interface ComponentNameProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

// 3. Component export (prefer named exports)
export function ComponentName({ 
  children,
  variant = 'primary',
  className
}: ComponentNameProps) {
  // Component logic here
  return <div>{children}</div>;
}
```

### Type Definitions
- Always define explicit interfaces for component props
- Use `React.ReactNode` for children props
- Place shared types in `/app/types/` directory
- Prefer interfaces over types for object shapes

### Import Organization
1. React/Next.js imports
2. Third-party libraries
3. Internal utilities (`@/lib/*`)
4. Internal components (`@/components/*`)
5. Types and interfaces
6. Styles and assets

## Tailwind CSS Patterns

### Class Name Organization
```tsx
// Use cn() utility for conditional classes
className={cn(
  // Base classes first
  "px-4 py-2 rounded-md",
  // Variant classes
  variant === 'primary' && "bg-blue-500 text-white",
  // State classes
  disabled && "opacity-50 cursor-not-allowed",
  // Custom className prop last
  className
)}
```

### Design Token Usage
- Always use HSL-based custom properties for colors
- Maintain consistent spacing using Tailwind's spacing scale
- Group related utility classes together

## Server vs Client Components

### Server Component Indicators
```tsx
// No 'use client' directive
// Can be async
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### Client Component Indicators
```tsx
'use client';  // Must be at the very top

import { useState } from 'react';

export function InteractiveComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState()}>Click</button>;
}
```

## Code Comments
- Only add comments to explain "why", never "what"
- Keep comments concise and relevant
- Update comments when modifying associated code
- Document complex business logic or algorithms

## String Formatting
- Use single quotes for static strings: `'static text'`
- Use template literals for interpolation: `` `Hello ${name}` ``
- Use double quotes only in JSX attributes: `className="text-white"`