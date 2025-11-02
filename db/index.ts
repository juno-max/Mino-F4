import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// For query purposes
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/placeholder'
const queryClient = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})
export const db = drizzle(queryClient, { schema })

export * from './schema'
