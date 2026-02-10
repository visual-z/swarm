import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { type ChildProcess, spawn } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT = 10000 + randomInt(50000);
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess: ChildProcess;

async function waitForServer(timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return;
    } catch {
      /* not ready */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

describe('SwarmRoom E2E', () => {
  let agentAId: string;
  let agentBId: string;
  let teamId: string;

  const dbPath = resolve(process.cwd(), 'swarmroom.db');

  beforeAll(async () => {
    serverProcess = spawn('npx', ['tsx', 'packages/server/src/index.ts'], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: resolve(import.meta.dirname, '..'),
    });

    serverProcess.stderr?.on('data', (chunk: Buffer) => {
      const msg = chunk.toString();
      if (msg.includes('Error') || msg.includes('error')) {
        console.error('[server stderr]', msg);
      }
    });

    await waitForServer();
  });

  afterAll(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          serverProcess.kill('SIGKILL');
          resolve();
        }, 3000);
        serverProcess.on('exit', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    try {
      if (existsSync(dbPath)) unlinkSync(dbPath);
      const walPath = dbPath + '-wal';
      const shmPath = dbPath + '-shm';
      if (existsSync(walPath)) unlinkSync(walPath);
      if (existsSync(shmPath)) unlinkSync(shmPath);
    } catch {
      /* cleanup best-effort */
    }
  });

  test('health endpoint returns ok', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('agentCount');
  });

  test('register Agent A', async () => {
    const res = await fetch(`${BASE_URL}/api/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'agent-alpha',
        url: 'http://localhost:9001',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.name).toBe('agent-alpha');

    agentAId = body.data.id;
  });

  test('register Agent B', async () => {
    const res = await fetch(`${BASE_URL}/api/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'agent-beta',
        url: 'http://localhost:9002',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.name).toBe('agent-beta');

    agentBId = body.data.id;
  });

  test('Agent A sends message to Agent B', async () => {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: agentAId,
        to: agentBId,
        content: 'Hello from Agent Alpha!',
        senderType: 'agent',
        type: 'notification',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
  });

  test('Agent B receives the message', async () => {
    const res = await fetch(`${BASE_URL}/api/messages?agentId=${agentBId}`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    const messages = body.data.messages ?? body.data;
    expect(Array.isArray(messages)).toBe(true);

    const received = messages.find(
      (m: Record<string, unknown>) => m.content === 'Hello from Agent Alpha!',
    );
    expect(received).toBeDefined();
    expect(received.from).toBe(agentAId);
    expect(received.to).toBe(agentBId);
  });

  test('list agents shows both agents', async () => {
    const res = await fetch(`${BASE_URL}/api/agents`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    const agents = body.data.agents ?? body.data;
    expect(Array.isArray(agents)).toBe(true);

    const names = agents.map((a: Record<string, unknown>) => a.name);
    expect(names).toContain('agent-alpha');
    expect(names).toContain('agent-beta');
  });

  test('create a team', async () => {
    const res = await fetch(`${BASE_URL}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'e2e-test-team' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');

    teamId = body.data.id;
  });

  test('add Agent A to team', async () => {
    const res = await fetch(`${BASE_URL}/api/teams/${teamId}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: agentAId }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('add Agent B to team', async () => {
    const res = await fetch(`${BASE_URL}/api/teams/${teamId}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: agentBId }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // MCP Streamable HTTP may return SSE (text/event-stream) or direct JSON depending on transport
  test('MCP endpoint responds to initialize', async () => {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'e2e-test', version: '1.0.0' },
        },
      }),
    });

    expect(res.status).toBe(200);

    const contentType = res.headers.get('content-type') ?? '';

    if (contentType.includes('text/event-stream')) {
      const text = await res.text();
      const dataLines = text.split('\n').filter((l) => l.startsWith('data: '));
      expect(dataLines.length).toBeGreaterThan(0);

      const jsonStr = dataLines[0].replace('data: ', '');
      const data = JSON.parse(jsonStr);
      expect(data.result).toBeDefined();
      expect(data.result.serverInfo.name).toContain('swarmroom');
    } else {
      const body = await res.json();
      expect(body.result).toBeDefined();
      expect(body.result.serverInfo.name).toContain('swarmroom');
    }
  });

  test('delete Agent A', async () => {
    const res = await fetch(`${BASE_URL}/api/agents/${agentAId}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('delete Agent B', async () => {
    const res = await fetch(`${BASE_URL}/api/agents/${agentBId}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
