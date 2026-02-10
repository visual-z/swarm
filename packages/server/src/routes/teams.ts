import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { CreateTeamRequestSchema } from '@swarmroom/shared';
import {
  createTeam,
  listTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addAgentToTeam,
  removeAgentFromTeam,
} from '../services/team-service.js';

const teamsRoute = new Hono();

teamsRoute.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = CreateTeamRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPException(400, {
      message: `Invalid request body: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    });
  }

  try {
    const team = createTeam({ ...parsed.data, color: body.color });
    return c.json({ success: true, data: team }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      throw new HTTPException(409, {
        message: `Team with name "${parsed.data.name}" already exists`,
      });
    }
    throw err;
  }
});

teamsRoute.get('/', (c) => {
  const result = listTeams();
  return c.json({ success: true, data: result });
});

teamsRoute.get('/:id', (c) => {
  const id = c.req.param('id');
  const team = getTeamById(id);

  if (!team) {
    throw new HTTPException(404, { message: `Team "${id}" not found` });
  }

  return c.json({ success: true, data: team });
});

teamsRoute.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates: Partial<{ name: string; description: string; color: string }> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.color !== undefined) updates.color = body.color;

  const team = updateTeam(id, updates);

  if (!team) {
    throw new HTTPException(404, { message: `Team "${id}" not found` });
  }

  return c.json({ success: true, data: team });
});

teamsRoute.delete('/:id', (c) => {
  const id = c.req.param('id');
  const team = deleteTeam(id);

  if (!team) {
    throw new HTTPException(404, { message: `Team "${id}" not found` });
  }

  return c.json({ success: true, data: team });
});

teamsRoute.post('/:id/agents', async (c) => {
  const teamId = c.req.param('id');
  const body = await c.req.json();

  if (!body.agentId || typeof body.agentId !== 'string') {
    throw new HTTPException(400, { message: 'agentId is required' });
  }

  const result = addAgentToTeam(teamId, body.agentId);

  if ('error' in result) {
    if (result.error === 'team_not_found') {
      throw new HTTPException(404, { message: `Team "${teamId}" not found` });
    }
    if (result.error === 'agent_not_found') {
      throw new HTTPException(404, { message: `Agent "${body.agentId}" not found` });
    }
  }

  return c.json({ success: true, data: result.data }, 201);
});

teamsRoute.delete('/:id/agents/:agentId', (c) => {
  const teamId = c.req.param('id');
  const agentId = c.req.param('agentId');

  const result = removeAgentFromTeam(teamId, agentId);

  if ('error' in result) {
    if (result.error === 'team_not_found') {
      throw new HTTPException(404, { message: `Team "${teamId}" not found` });
    }
    if (result.error === 'not_a_member') {
      throw new HTTPException(404, { message: `Agent "${agentId}" is not a member of team "${teamId}"` });
    }
  }

  return c.json({ success: true, data: result.data });
});

export { teamsRoute };
