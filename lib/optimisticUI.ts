/**
 * Optimistic UI Utilities
 * Provides instant feedback before server responses arrive
 * Implements rollback on failure for better UX
 */

export type OptimisticUpdate<T> = {
  id: string
  type: 'update' | 'delete' | 'add'
  original?: T
  optimistic: Partial<T>
  timestamp: number
}

export class OptimisticManager<T extends { id: string }> {
  private updates: Map<string, OptimisticUpdate<T>> = new Map()
  private rollbackQueue: Array<() => void> = []

  /**
   * Apply optimistic update to data
   */
  applyUpdate(
    data: T[],
    id: string,
    update: Partial<T>,
    type: 'update' | 'delete' | 'add' = 'update'
  ): T[] {
    const original = data.find(item => item.id === id)

    // Store the update for potential rollback
    this.updates.set(id, {
      id,
      type,
      original,
      optimistic: update,
      timestamp: Date.now(),
    })

    switch (type) {
      case 'update':
        return data.map(item =>
          item.id === id ? { ...item, ...update } : item
        )
      case 'delete':
        return data.filter(item => item.id !== id)
      case 'add':
        return [...data, { id, ...update } as T]
      default:
        return data
    }
  }

  /**
   * Confirm an optimistic update (remove from pending)
   */
  confirmUpdate(id: string): void {
    this.updates.delete(id)
  }

  /**
   * Rollback an optimistic update
   */
  rollbackUpdate(data: T[], id: string): T[] {
    const update = this.updates.get(id)
    if (!update) return data

    switch (update.type) {
      case 'update':
        // Restore original value
        return data.map(item =>
          item.id === id && update.original
            ? update.original
            : item
        )
      case 'delete':
        // Restore deleted item
        return update.original ? [...data, update.original] : data
      case 'add':
        // Remove added item
        return data.filter(item => item.id !== id)
      default:
        return data
    }
  }

  /**
   * Get all pending updates
   */
  getPendingUpdates(): OptimisticUpdate<T>[] {
    return Array.from(this.updates.values())
  }

  /**
   * Clear all pending updates
   */
  clearAll(): void {
    this.updates.clear()
  }

  /**
   * Check if an item has pending updates
   */
  isPending(id: string): boolean {
    return this.updates.has(id)
  }
}

/**
 * Optimistic action wrapper
 * Executes optimistic update immediately, then confirms or rolls back
 */
export async function withOptimisticUpdate<T extends { id: string }, R>(
  data: T[],
  setData: (data: T[]) => void,
  manager: OptimisticManager<T>,
  options: {
    id: string
    update: Partial<T>
    type?: 'update' | 'delete' | 'add'
    action: () => Promise<R>
    onSuccess?: (result: R) => void
    onError?: (error: Error) => void
  }
): Promise<R | null> {
  const { id, update, type = 'update', action, onSuccess, onError } = options

  try {
    // Apply optimistic update immediately
    const optimisticData = manager.applyUpdate(data, id, update, type)
    setData(optimisticData)

    // Execute actual action
    const result = await action()

    // Confirm update on success
    manager.confirmUpdate(id)
    onSuccess?.(result)

    return result
  } catch (error) {
    // Rollback on error
    const rolledBackData = manager.rollbackUpdate(data, id)
    setData(rolledBackData)
    onError?.(error as Error)
    return null
  }
}

/**
 * Debounced optimistic updates
 * Useful for rapid successive updates (e.g., typing, dragging)
 */
export function createDebouncedOptimistic<T extends { id: string }>(
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null
  let pendingUpdate: (() => void) | null = null

  return {
    schedule: (callback: () => void) => {
      pendingUpdate = callback
      if (timeoutId) clearTimeout(timeoutId)

      // Apply immediately for optimistic feedback
      callback()

      // Schedule confirmation
      timeoutId = setTimeout(() => {
        pendingUpdate = null
        timeoutId = null
      }, delay)
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      pendingUpdate = null
    },
    flush: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (pendingUpdate) {
        pendingUpdate()
        pendingUpdate = null
      }
    }
  }
}

/**
 * Batch optimistic updates
 * For operations that affect multiple items at once
 */
export async function withBatchOptimisticUpdate<T extends { id: string }, R>(
  data: T[],
  setData: (data: T[]) => void,
  manager: OptimisticManager<T>,
  options: {
    updates: Array<{
      id: string
      update: Partial<T>
      type?: 'update' | 'delete' | 'add'
    }>
    action: () => Promise<R>
    onSuccess?: (result: R) => void
    onError?: (error: Error) => void
  }
): Promise<R | null> {
  const { updates, action, onSuccess, onError } = options

  try {
    // Apply all optimistic updates
    let optimisticData = data
    for (const { id, update, type = 'update' } of updates) {
      optimisticData = manager.applyUpdate(optimisticData, id, update, type)
    }
    setData(optimisticData)

    // Execute actual action
    const result = await action()

    // Confirm all updates on success
    for (const { id } of updates) {
      manager.confirmUpdate(id)
    }
    onSuccess?.(result)

    return result
  } catch (error) {
    // Rollback all updates on error
    let rolledBackData = data
    for (const { id } of updates.reverse()) {
      rolledBackData = manager.rollbackUpdate(rolledBackData, id)
    }
    setData(rolledBackData)
    onError?.(error as Error)
    return null
  }
}

/**
 * Hook for using optimistic updates in React components
 */
export function useOptimisticManager<T extends { id: string }>() {
  return new OptimisticManager<T>()
}
