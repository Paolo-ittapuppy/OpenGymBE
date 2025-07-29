// src/websocket.ts
import fastify, { FastifyInstance } from 'fastify'
import websocketPlugin from '@fastify/websocket'
import { RawData, WebSocket } from 'ws'
type SessionId = string

const clientsBySession = new Map<SessionId, Set<WebSocket>>()

export async function websocketRoutes(app: FastifyInstance) {
  app.register(websocketPlugin)
  
  app.get('/ws', { websocket: true }, (socket, req) => {
    console.log('🔌 Client connected:', req.ip)

    socket.on('message', (message) => {
      console.log('📨 Message received:', message.toString())

      // Echo message back
      socket.send(`Server received: ${message}`)
    })

    socket.on('close', () => {
      console.log('❌ Client disconnected')
    })
  })
}
