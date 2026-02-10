import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { CreateProjectRequestSchema } from '@swarmroom/shared';
import {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addAgentToProject,
  removeAgentFromProject,
} from '../services/project-service.js';

const projectsRoute = new Hono();

projectsRoute.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = CreateProjectRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPException(400, {
      message: `Invalid request body: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    });
  }

  try {
    const project = createProject({ ...parsed.data, repository: body.repository });
    return c.json({ success: true, data: project }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      throw new HTTPException(409, {
        message: `Project with name "${parsed.data.name}" already exists`,
      });
    }
    throw err;
  }
});

projectsRoute.get('/', (c) => {
  const result = listProjects();
  return c.json({ success: true, data: result });
});

projectsRoute.get('/:id', (c) => {
  const id = c.req.param('id');
  const project = getProjectById(id);

  if (!project) {
    throw new HTTPException(404, { message: `Project "${id}" not found` });
  }

  return c.json({ success: true, data: project });
});

projectsRoute.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates: Partial<{ name: string; description: string; repository: string }> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.repository !== undefined) updates.repository = body.repository;

  const project = updateProject(id, updates);

  if (!project) {
    throw new HTTPException(404, { message: `Project "${id}" not found` });
  }

  return c.json({ success: true, data: project });
});

projectsRoute.delete('/:id', (c) => {
  const id = c.req.param('id');
  const project = deleteProject(id);

  if (!project) {
    throw new HTTPException(404, { message: `Project "${id}" not found` });
  }

  return c.json({ success: true, data: project });
});

projectsRoute.post('/:id/agents', async (c) => {
  const projectId = c.req.param('id');
  const body = await c.req.json();

  if (!body.agentId || typeof body.agentId !== 'string') {
    throw new HTTPException(400, { message: 'agentId is required' });
  }

  const result = addAgentToProject(projectId, body.agentId);

  if ('error' in result) {
    if (result.error === 'project_not_found') {
      throw new HTTPException(404, { message: `Project "${projectId}" not found` });
    }
    if (result.error === 'agent_not_found') {
      throw new HTTPException(404, { message: `Agent "${body.agentId}" not found` });
    }
  }

  return c.json({ success: true, data: result.data }, 201);
});

projectsRoute.delete('/:id/agents/:agentId', (c) => {
  const projectId = c.req.param('id');
  const agentId = c.req.param('agentId');

  const result = removeAgentFromProject(projectId, agentId);

  if ('error' in result) {
    if (result.error === 'project_not_found') {
      throw new HTTPException(404, { message: `Project "${projectId}" not found` });
    }
    if (result.error === 'not_a_member') {
      throw new HTTPException(404, { message: `Agent "${agentId}" is not a member of project "${projectId}"` });
    }
  }

  return c.json({ success: true, data: result.data });
});

export { projectsRoute };
