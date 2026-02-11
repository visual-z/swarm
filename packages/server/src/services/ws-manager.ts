import type { WSContext } from 'hono/ws';
import { DAEMON_KEY } from '@swarmroom/shared';
import type { WSMessage, WSMessageType } from '@swarmroom/shared';

const DASHBOARD_KEY = '__dashboard__';
const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;

const clients = new Map<string, WSContext[]>();
const pingTimers = new Map<WSContext, ReturnType<typeof setInterval>>();
const pongTimers = new Map<WSContext, ReturnType<typeof setTimeout>>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMessage(type: WSMessageType, payload: unknown): string {
  const msg: WSMessage = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(msg);
}

function safeSend(ws: WSContext, data: string): void {
  try {
    if (ws.readyState === 1) {
      ws.send(data);
    }
  } catch {
  }
}

// ─── Ping/Pong ───────────────────────────────────────────────────────────────

function startPing(ws: WSContext): void {
  const interval = setInterval(() => {
    if (ws.readyState !== 1) {
      clearPing(ws);
      return;
    }

    safeSend(ws, makeMessage('heartbeat', { ping: true }));

    const timeout = setTimeout(() => {
      console.log('[ws] Client failed pong check, closing connection');
      ws.close(1000, 'pong timeout');
    }, PONG_TIMEOUT_MS);

    pongTimers.set(ws, timeout);
  }, PING_INTERVAL_MS);

  pingTimers.set(ws, interval);
}

function clearPing(ws: WSContext): void {
  const interval = pingTimers.get(ws);
  if (interval) {
    clearInterval(interval);
    pingTimers.delete(ws);
  }

  const timeout = pongTimers.get(ws);
  if (timeout) {
    clearTimeout(timeout);
    pongTimers.delete(ws);
  }
}

function handlePong(ws: WSContext): void {
  const timeout = pongTimers.get(ws);
  if (timeout) {
    clearTimeout(timeout);
    pongTimers.delete(ws);
  }
}

// ─── Registration ────────────────────────────────────────────────────────────

export function registerClient(clientId: string, ws: WSContext): void {
  const existing = clients.get(clientId) ?? [];
  existing.push(ws);
  clients.set(clientId, existing);

  startPing(ws);

  console.log(`[ws] Client registered: ${clientId} (${existing.length} connection(s))`);
}

export function unregisterClient(ws: WSContext): void {
  for (const [clientId, connections] of clients.entries()) {
    const idx = connections.indexOf(ws);
    if (idx !== -1) {
      connections.splice(idx, 1);
      console.log(`[ws] Client disconnected: ${clientId} (${connections.length} remaining)`);

      if (connections.length === 0) {
        clients.delete(clientId);
      }

      clearPing(ws);
      return;
    }
  }

  clearPing(ws);
}

// ─── Sending ─────────────────────────────────────────────────────────────────

export function sendToClient(clientId: string, type: WSMessageType, payload: unknown): void {
  const connections = clients.get(clientId);
  if (!connections || connections.length === 0) return;

  const data = makeMessage(type, payload);
  for (const ws of connections) {
    safeSend(ws, data);
  }
}

export function broadcast(type: WSMessageType, payload: unknown): void {
  const data = makeMessage(type, payload);
  for (const connections of clients.values()) {
    for (const ws of connections) {
      safeSend(ws, data);
    }
  }
}

export function sendToDashboards(type: WSMessageType, payload: unknown): void {
  sendToClient(DASHBOARD_KEY, type, payload);
}

export function sendToDaemons(type: WSMessageType, payload: unknown): void {
  sendToClient(DAEMON_KEY, type, payload);
}

export function hasActiveConnections(clientId: string): boolean {
  const connections = clients.get(clientId);
  return !!connections && connections.length > 0;
}

// ─── Message Handling ────────────────────────────────────────────────────────

export function handleIncomingMessage(ws: WSContext, raw: string): void {
  let parsed: WSMessage;
  try {
    parsed = JSON.parse(raw);
  } catch {
    safeSend(ws, makeMessage('error', { message: 'Invalid JSON' }));
    return;
  }

  if (!parsed.type) {
    safeSend(ws, makeMessage('error', { message: 'Missing "type" field' }));
    return;
  }

  switch (parsed.type) {
    case 'register': {
      const payload = parsed.payload as { agentId?: string; clientType?: string };

      if (payload?.clientType === 'dashboard') {
        registerClient(DASHBOARD_KEY, ws);
        safeSend(ws, makeMessage('register', { status: 'ok', clientType: 'dashboard' }));
      } else if (payload?.clientType === 'daemon') {
        registerClient(DAEMON_KEY, ws);
        safeSend(ws, makeMessage('register', { status: 'ok', clientType: 'daemon' }));
      } else if (payload?.agentId) {
        registerClient(payload.agentId, ws);
        safeSend(ws, makeMessage('register', { status: 'ok', agentId: payload.agentId }));
      } else {
        safeSend(ws, makeMessage('error', { message: 'Register requires agentId or clientType' }));
      }
      break;
    }

    case 'heartbeat': {
      handlePong(ws);
      break;
    }

    default: {
      safeSend(ws, makeMessage('error', { message: `Unknown message type: ${parsed.type}` }));
    }
  }
}

// ─── Public Integration ──────────────────────────────────────────────────────

export function broadcastAgentOnline(agent: { id: string; name: string }): void {
  broadcast('agent_online', { agentId: agent.id, name: agent.name });
}

export function broadcastAgentOffline(agent: { id: string; name: string }): void {
  broadcast('agent_offline', { agentId: agent.id, name: agent.name });
}

export function pushMessageToRecipient(recipientId: string, message: unknown): void {
  sendToClient(recipientId, 'message', message);
  sendToDashboards('message', message);
}
