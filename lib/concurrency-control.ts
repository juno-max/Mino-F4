/**
 * Concurrency Control for Job Execution
 * Manages parallel execution with configurable concurrency limits
 */

export interface ConcurrencyController {
  run<T>(fn: () => Promise<T>): Promise<T>
  updateConcurrency(newLimit: number): void
  getCurrentConcurrency(): number
  getActiveCount(): number
  getPendingCount(): number
  waitForAll(): Promise<void>
}

/**
 * Create a concurrency limiter
 * Similar to p-limit but with dynamic concurrency adjustment
 */
export function createConcurrencyController(initialLimit: number = 5): ConcurrencyController {
  let concurrencyLimit = initialLimit
  let activeCount = 0
  let pendingQueue: Array<() => void> = []

  const next = () => {
    activeCount--

    if (pendingQueue.length > 0 && activeCount < concurrencyLimit) {
      activeCount++
      const resolve = pendingQueue.shift()!
      resolve()
    }
  }

  const enqueue = (): Promise<void> => {
    if (activeCount < concurrencyLimit) {
      activeCount++
      return Promise.resolve()
    }

    return new Promise<void>(resolve => {
      pendingQueue.push(resolve)
    })
  }

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    await enqueue()

    try {
      return await fn()
    } finally {
      next()
    }
  }

  function updateConcurrency(newLimit: number): void {
    const diff = newLimit - concurrencyLimit
    concurrencyLimit = newLimit

    // If increasing concurrency, process more from queue
    if (diff > 0) {
      for (let i = 0; i < diff && pendingQueue.length > 0; i++) {
        activeCount++
        const resolve = pendingQueue.shift()!
        resolve()
      }
    }
  }

  function getCurrentConcurrency(): number {
    return concurrencyLimit
  }

  function getActiveCount(): number {
    return activeCount
  }

  function getPendingCount(): number {
    return pendingQueue.length
  }

  async function waitForAll(): Promise<void> {
    while (activeCount > 0 || pendingQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return {
    run,
    updateConcurrency,
    getCurrentConcurrency,
    getActiveCount,
    getPendingCount,
    waitForAll,
  }
}

/**
 * Execution pool for managing job execution with metrics
 */
export class ExecutionPool {
  private controller: ConcurrencyController
  private metrics = {
    totalStarted: 0,
    totalCompleted: 0,
    totalFailed: 0,
    totalRetries: 0,
  }

  constructor(concurrency: number = 5) {
    this.controller = createConcurrencyController(concurrency)
  }

  async execute<T>(
    fn: () => Promise<T>,
    options: {
      onStart?: () => void
      onComplete?: (result: T) => void
      onError?: (error: Error) => void
      onRetry?: () => void
    } = {}
  ): Promise<T> {
    this.metrics.totalStarted++

    if (options.onStart) {
      options.onStart()
    }

    try {
      const result = await this.controller.run(fn)
      this.metrics.totalCompleted++

      if (options.onComplete) {
        options.onComplete(result)
      }

      return result
    } catch (error) {
      this.metrics.totalFailed++

      if (options.onError) {
        options.onError(error as Error)
      }

      throw error
    }
  }

  updateConcurrency(newLimit: number): void {
    this.controller.updateConcurrency(newLimit)
  }

  getMetrics() {
    return {
      ...this.metrics,
      active: this.controller.getActiveCount(),
      pending: this.controller.getPendingCount(),
      concurrency: this.controller.getCurrentConcurrency(),
    }
  }

  async waitForAll(): Promise<void> {
    await this.controller.waitForAll()
  }
}

/**
 * Execute batch of operations with controlled concurrency
 */
export async function executeBatchWithConcurrency<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: {
    concurrency?: number
    onProgress?: (completed: number, total: number) => void
    onItemComplete?: (result: R, item: T, index: number) => void
    onItemError?: (error: Error, item: T, index: number) => void
  } = {}
): Promise<Array<{ success: boolean; result?: R; error?: Error; item: T }>> {
  const {
    concurrency = 5,
    onProgress,
    onItemComplete,
    onItemError,
  } = options

  const controller = createConcurrencyController(concurrency)
  const results: Array<{ success: boolean; result?: R; error?: Error; item: T }> = []
  let completed = 0

  const promises = items.map(async (item, index) => {
    try {
      const result = await controller.run(() => fn(item, index))

      completed++
      results[index] = { success: true, result, item }

      if (onItemComplete) {
        onItemComplete(result, item, index)
      }

      if (onProgress) {
        onProgress(completed, items.length)
      }

      return result
    } catch (error) {
      completed++
      results[index] = { success: false, error: error as Error, item }

      if (onItemError) {
        onItemError(error as Error, item, index)
      }

      if (onProgress) {
        onProgress(completed, items.length)
      }

      throw error
    }
  })

  await Promise.allSettled(promises)

  return results
}
