# Development Best Practices

## Project Structure

### Directory Organization
```
app/
├── {page_routes}/        # Route segments
├── api/                  # API routes (webhooks only)
├── actions/              # Server actions
├── components/
│   ├── ui/              # Reusable UI components
│   └── {feature}/       # Page-specific components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
├── types/               # TypeScript type definitions
├── fonts/               # Font configurations
├── icons/               # Icon components
├── global-error.tsx     # Global error boundary
├── not-found.tsx        # 404 page
├── global.css           # Global styles
└── layout.tsx           # Root layout
```

## Data Fetching Patterns

### Server Actions (Preferred)
```tsx
// app/actions/user-actions.ts
'use server';

export async function getUser(id: string) {
  try {
    const user = await fetch(`/api/users/${id}`);
    return { data: user, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}
```

### API Routes (Webhooks Only)
- Reserve `/api/` routes exclusively for external webhooks
- All internal data fetching should use server actions
- Never use API routes for client-server communication

### Error Handling Pattern
```tsx
// Consistent return type for all server-client communication
type ActionResult<T> = 
  | { data: T; error: null }
  | { data: null; error: string };

// Usage in server action
export async function serverAction(): Promise<ActionResult<Data>> {
  try {
    const data = await performOperation();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}
```

## Component Architecture

### Page Components
- All `page.tsx` files must be server components
- Fetch data at the page level when possible
- Pass data down to client components as props

### Client Component Usage
- Only use `'use client'` when component needs:
  - Browser APIs
  - Event handlers
  - State management
  - Effects or lifecycle methods
- Keep client components small and focused

### Component Composition
```tsx
// Server Component (page.tsx)
export default async function Page() {
  const data = await fetchData();
  
  return (
    <div>
      <ServerSection data={data} />
      <ClientInteraction initialData={data} />
    </div>
  );
}

// Client Component (client-interaction.tsx)
'use client';
export function ClientInteraction({ initialData }) {
  const [state, setState] = useState(initialData);
  // Interactive logic here
}
```

## Performance Optimization

### Code Splitting
- Leverage Next.js automatic code splitting
- Use dynamic imports for heavy client components
- Keep initial bundle size minimal

### Data Loading
- Implement streaming with Suspense boundaries
- Use parallel data fetching where possible
- Cache server-side data appropriately

## Testing Strategy

### Test File Placement
```
components/
├── button.tsx
├── button.test.tsx      # Test next to source
└── button.stories.tsx   # Storybook if applicable
```

### Test Coverage Priorities
1. Critical user paths
2. Complex business logic
3. Data transformation functions
4. Error boundary behaviors

## Migration & Anti-Patterns

### Avoid These Patterns
- ❌ React Query (actively migrating away)
- ❌ Client-side data fetching for initial load
- ❌ API routes for internal communication
- ❌ Redundant comments explaining obvious code

### Preferred Alternatives
- ✅ Server actions for all data operations
- ✅ Server components for initial data
- ✅ URL state for shareable application state
- ✅ Zod schemas for runtime validation

## Development Principles

### Keep It Simple
- Implement solutions in the fewest lines possible
- Avoid premature optimization
- Choose clarity over cleverness

### DRY (Don't Repeat Yourself)
- Extract repeated UI patterns to `/components/ui/`
- Create utility functions in `/lib/utils.ts`
- Share types through `/types/` directory

### Consistency
- Match existing patterns in the codebase
- Use established naming conventions
- Follow the same error handling approach throughout

### Progressive Enhancement
- Build features that work server-side first
- Add client-side enhancement where it improves UX
- Ensure graceful degradation