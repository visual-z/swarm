import { eq, and, count } from 'drizzle-orm';
import { db, projectGroups, agentProjects, agents } from '../db/index.js';
import type { CreateProjectRequest } from '@swarmroom/shared';

export function createProject(input: CreateProjectRequest & { repository?: string }) {
  const id = crypto.randomUUID();
  const now = Date.now();

  db.insert(projectGroups)
    .values({
      id,
      name: input.name,
      description: input.description ?? null,
      repository: input.repository ?? null,
      createdAt: now,
    })
    .run();

  if (input.agentIds && input.agentIds.length > 0) {
    for (const agentId of input.agentIds) {
      db.insert(agentProjects).values({ agentId, projectId: id }).run();
    }
  }

  return getProjectById(id);
}

export function listProjects() {
  const allProjects = db.select().from(projectGroups).all();

  return allProjects.map((project) => {
    const result = db
      .select({ value: count() })
      .from(agentProjects)
      .where(eq(agentProjects.projectId, project.id))
      .get();

    return {
      ...project,
      agentCount: result?.value ?? 0,
    };
  });
}

export function getProjectById(id: string) {
  const project = db.select().from(projectGroups).where(eq(projectGroups.id, id)).get();
  if (!project) return null;

  const memberRows = db
    .select()
    .from(agents)
    .innerJoin(agentProjects, eq(agents.id, agentProjects.agentId))
    .where(eq(agentProjects.projectId, id))
    .all();

  return {
    ...project,
    agents: memberRows.map((r) => ({
      ...r.agents,
      agentCard: r.agents.agentCard ? JSON.parse(r.agents.agentCard) : null,
    })),
  };
}

export function updateProject(
  id: string,
  updates: Partial<{ name: string; description: string; repository: string }>,
) {
  const existing = db.select().from(projectGroups).where(eq(projectGroups.id, id)).get();
  if (!existing) return null;

  const values: Record<string, unknown> = {};
  if (updates.name !== undefined) values.name = updates.name;
  if (updates.description !== undefined) values.description = updates.description;
  if (updates.repository !== undefined) values.repository = updates.repository;

  if (Object.keys(values).length > 0) {
    db.update(projectGroups).set(values).where(eq(projectGroups.id, id)).run();
  }

  return getProjectById(id);
}

export function deleteProject(id: string) {
  const existing = db.select().from(projectGroups).where(eq(projectGroups.id, id)).get();
  if (!existing) return null;

  db.delete(agentProjects).where(eq(agentProjects.projectId, id)).run();
  db.delete(projectGroups).where(eq(projectGroups.id, id)).run();

  return existing;
}

export function addAgentToProject(projectId: string, agentId: string) {
  const project = db.select().from(projectGroups).where(eq(projectGroups.id, projectId)).get();
  if (!project) return { error: 'project_not_found' as const };

  const agent = db.select().from(agents).where(eq(agents.id, agentId)).get();
  if (!agent) return { error: 'agent_not_found' as const };

  db.insert(agentProjects).values({ agentId, projectId }).run();
  return { data: getProjectById(projectId) };
}

export function removeAgentFromProject(projectId: string, agentId: string) {
  const project = db.select().from(projectGroups).where(eq(projectGroups.id, projectId)).get();
  if (!project) return { error: 'project_not_found' as const };

  const membership = db
    .select()
    .from(agentProjects)
    .where(eq(agentProjects.projectId, projectId))
    .all()
    .find((r) => r.agentId === agentId);

  if (!membership) return { error: 'not_a_member' as const };

  db.delete(agentProjects)
    .where(and(eq(agentProjects.projectId, projectId), eq(agentProjects.agentId, agentId)))
    .run();

  return { data: getProjectById(projectId) };
}
