import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer, WebSocket } from 'ws'
import { initializeExecutionEvents } from './lib/execution-events'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// WebSocket connection tracking
const clients = new Map<string, WebSocket>()
let clientIdCounter = 0

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000

// Export broadcast function to send to all clients
export function broadcast(message: any) {
  const data = JSON.stringify(message)
  let sent = 0
  clients.forEach((ws, clientId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data)
      sent++
    }
  })
  console.log(`[WS] Broadcast to ${sent}/${clients.size} clients:`, message.type)
  return sent
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws: WebSocket) => {
    const clientId = `client_${++clientIdCounter}`
    clients.set(clientId, ws)

    console.log(`[WS] Client connected: ${clientId} (total: ${clients.size})`)

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
    }))

    // Setup heartbeat
    let isAlive = true
    ws.on('pong', () => {
      isAlive = true
    })

    const heartbeat = setInterval(() => {
      if (!isAlive) {
        console.log(`[WS] Client ${clientId} is not responding, terminating...`)
        clearInterval(heartbeat)
        ws.terminate()
        clients.delete(clientId)
        return
      }
      isAlive = false
      ws.ping()
    }, HEARTBEAT_INTERVAL)

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())
        console.log(`[WS] Message from ${clientId}:`, message.type)

        // Echo ping messages
        if (message.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
          }))
        }
      } catch (err) {
        console.error(`[WS] Error parsing message from ${clientId}:`, err)
      }
    })

    // Handle disconnection
    ws.on('close', () => {
      clearInterval(heartbeat)
      clients.delete(clientId)
      console.log(`[WS] Client disconnected: ${clientId} (remaining: ${clients.size})`)
    })

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WS] Error from ${clientId}:`, error)
      clearInterval(heartbeat)
      clients.delete(clientId)
    })
  })

  // Initialize execution event publisher with broadcast function
  initializeExecutionEvents(broadcast)

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`)
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  clients.forEach((ws, clientId) => {
    ws.close()
  })
  clients.clear()
  process.exit(0)
})

// Export function to send to specific client (if needed later)
export function sendToClient(clientId: string, message: any) {
  const ws = clients.get(clientId)
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
    return true
  }
  return false
}

// Export clients map for inspection
export function getConnectedClients() {
  return Array.from(clients.keys())
}
