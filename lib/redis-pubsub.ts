/**
 * Redis Pub/Sub for WebSocket Scaling
 *
 * Enables multiple server instances to share WebSocket events via Redis.
 * When one server publishes an event, all other servers receive it and
 * broadcast to their connected clients.
 */

import type { ExecutionEvent } from './execution-events'

// Redis client instances (lazy loaded)
let redisPublisher: any = null
let redisSubscriber: any = null
let isInitialized = false

const REDIS_CHANNEL = 'execution_events'

/**
 * Initialize Redis pub/sub for WebSocket scaling
 *
 * @param broadcastFn - Function to broadcast events to local WebSocket clients
 * @returns True if Redis is successfully initialized, false otherwise
 */
export async function initializeRedisPubSub(
  broadcastFn: (event: ExecutionEvent) => number
): Promise<boolean> {
  // Skip if no Redis URL configured
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.log('[RedisPubSub] REDIS_URL not configured, running in single-server mode')
    return false
  }

  try {
    // Lazy load ioredis (optional dependency)
    const Redis = await import('ioredis').then(m => m.default)

    // Create publisher and subscriber clients
    redisPublisher = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    })

    redisSubscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    })

    // Connect both clients
    await Promise.all([
      redisPublisher.connect(),
      redisSubscriber.connect(),
    ])

    // Subscribe to execution events channel
    await redisSubscriber.subscribe(REDIS_CHANNEL)

    // Handle incoming messages from other servers
    redisSubscriber.on('message', (channel: string, message: string) => {
      if (channel === REDIS_CHANNEL) {
        try {
          const event = JSON.parse(message) as ExecutionEvent
          // Broadcast to local WebSocket clients
          broadcastFn(event)
        } catch (err) {
          console.error('[RedisPubSub] Error parsing Redis message:', err)
        }
      }
    })

    // Handle Redis errors
    redisPublisher.on('error', (err: Error) => {
      console.error('[RedisPubSub] Publisher error:', err)
    })

    redisSubscriber.on('error', (err: Error) => {
      console.error('[RedisPubSub] Subscriber error:', err)
    })

    isInitialized = true
    console.log('[RedisPubSub] ✅ Initialized successfully')
    return true
  } catch (error) {
    console.error('[RedisPubSub] ❌ Failed to initialize:', error)
    console.log('[RedisPubSub] Falling back to single-server mode')
    console.log('[RedisPubSub] To enable multi-server scaling, install ioredis: npm install ioredis')
    return false
  }
}

/**
 * Publish event to Redis for other servers to receive
 */
export async function publishToRedis(event: ExecutionEvent): Promise<void> {
  if (!isInitialized || !redisPublisher) {
    return // Silently skip if Redis not initialized
  }

  try {
    await redisPublisher.publish(REDIS_CHANNEL, JSON.stringify(event))
  } catch (error) {
    console.error('[RedisPubSub] Error publishing to Redis:', error)
  }
}

/**
 * Gracefully shutdown Redis connections
 */
export async function shutdownRedisPubSub(): Promise<void> {
  if (!isInitialized) {
    return
  }

  try {
    if (redisSubscriber) {
      await redisSubscriber.quit()
    }
    if (redisPublisher) {
      await redisPublisher.quit()
    }
    console.log('[RedisPubSub] Shutdown complete')
  } catch (error) {
    console.error('[RedisPubSub] Error during shutdown:', error)
  }

  isInitialized = false
  redisPublisher = null
  redisSubscriber = null
}

/**
 * Check if Redis pub/sub is initialized and ready
 */
export function isRedisPubSubReady(): boolean {
  return isInitialized
}
