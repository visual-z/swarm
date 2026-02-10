import type { Hono } from 'hono';
import type { createNodeWebSocket } from '@hono/node-ws';
import {
  handleIncomingMessage,
  unregisterClient,
} from '../services/ws-manager.js';

type NodeWebSocket = ReturnType<typeof createNodeWebSocket>;

export function registerWsRoute(
  app: Hono,
  upgradeWebSocket: NodeWebSocket['upgradeWebSocket'],
): void {
  app.get(
    '/ws',
    upgradeWebSocket(() => {
      return {
        onMessage(event, ws) {
          const data = typeof event.data === 'string'
            ? event.data
            : String(event.data);
          handleIncomingMessage(ws, data);
        },
        onClose(_event, ws) {
          unregisterClient(ws);
        },
        onError(_event, ws) {
          unregisterClient(ws);
        },
      };
    }),
  );
}
