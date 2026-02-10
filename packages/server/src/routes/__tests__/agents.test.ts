import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { errorHandler } from '../../middleware/error-handler.js';
import { agentsRoute } from '../../routes/agents.js';

function createTestApp() {
  const app = new Hono();
  app.onError(errorHandler);
  app.route('/api/agents', agentsRoute);
  return app;
}

describe('Agents Route', () => {
  it('POST /api/agents → 201 with agent data', async () => {
    const app = createTestApp();

    const res = await app.request('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'route-agent', url: 'http://localhost:8000' }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.name).toBe('route-agent');
    expect(json.data.id).toBeDefined();
    expect(json.data.displayName).toBeTruthy();
    expect(json.data.status).toBe('online');
  });

  it('GET /api/agents → 200 with list', async () => {
    const app = createTestApp();

    await app.request('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'list-agent-1', url: 'http://a' }),
    });
    await app.request('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'list-agent-2', url: 'http://b' }),
    });

    const res = await app.request('/api/agents');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
  });

  it('GET /api/agents/:id → 200 with agent detail', async () => {
    const app = createTestApp();

    const createRes = await app.request('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'detail-agent', url: 'http://detail' }),
    });
    const created = await createRes.json();
    const id = created.data.id;

    const res = await app.request(`/api/agents/${id}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(id);
    expect(json.data.name).toBe('detail-agent');
    expect(json.data.teamIds).toEqual([]);
  });

  it('GET /api/agents/:id → 404 for nonexistent agent', async () => {
    const app = createTestApp();

    const res = await app.request('/api/agents/nonexistent-id');
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('POST /api/agents → 400 for invalid body', async () => {
    const app = createTestApp();

    const res = await app.request('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: true }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
