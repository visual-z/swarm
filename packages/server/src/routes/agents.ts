import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';
import {
  RegisterAgentRequestSchema,
  HeartbeatRequestSchema,
  HEARTBEAT_INTERVAL_MS,
} from '@swarmroom/shared';
import { db, agents } from '../db/index.js';
import {
  createAgent,
  listAgents,
  getAgentById,
  updateAgent,
  deregisterAgent,
} from '../services/agent-service.js';

const agentsRoute = new Hono();

agentsRoute.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = RegisterAgentRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPException(400, {
      message: `Invalid request body: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    });
  }

  try {
    const agent = createAgent(parsed.data);
    return c.json({ success: true, data: agent }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      throw new HTTPException(409, {
        message: `Agent with name "${parsed.data.name}" already exists`,
      });
    }
    throw err;
  }
});

agentsRoute.get('/', (c) => {
  const status = c.req.query('status');
  const teamId = c.req.query('teamId');
  const projectId = c.req.query('projectId');

  const result = listAgents({ status, teamId, projectId });
  return c.json({ success: true, data: result });
});

agentsRoute.get('/:id', (c) => {
  const id = c.req.param('id');
  const agent = getAgentById(id);

  if (!agent) {
    throw new HTTPException(404, { message: `Agent "${id}" not found` });
  }

  return c.json({ success: true, data: agent });
});

agentsRoute.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.url !== undefined) updates.url = body.url;
  if (body.status !== undefined) updates.status = body.status;
  if (body.agentCard !== undefined) {
    updates.agentCard = JSON.stringify(body.agentCard);
  }

  const agent = updateAgent(id, updates as Parameters<typeof updateAgent>[1]);

  if (!agent) {
    throw new HTTPException(404, { message: `Agent "${id}" not found` });
  }

  return c.json({ success: true, data: agent });
});

agentsRoute.delete('/:id', (c) => {
  const id = c.req.param('id');
  const agent = deregisterAgent(id);

  if (!agent) {
    throw new HTTPException(404, { message: `Agent "${id}" not found` });
  }

  return c.json({ success: true, data: agent });
});

agentsRoute.post('/:id/heartbeat', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = HeartbeatRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPException(400, {
      message: `Invalid request body: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    });
  }

  const existing = db.select({ id: agents.id }).from(agents).where(eq(agents.id, id)).get();
  if (!existing) {
    throw new HTTPException(404, { message: `Agent "${id}" not found` });
  }

  const now = Date.now();
  const updates: Record<string, unknown> = {
    lastHeartbeat: now,
    updatedAt: now,
  };

  if (parsed.data.status) {
    updates.status = parsed.data.status;
  }

  db.update(agents).set(updates).where(eq(agents.id, id)).run();

  return c.json({ status: 'ok', interval: HEARTBEAT_INTERVAL_MS });
});

export { agentsRoute };
