import { eq, and, count, asc, desc, inArray, type SQL } from 'drizzle-orm';
import { db, agents, agentTeams, agentProjects } from '../db/index.js';
import { generateDisplayName } from '../lib/names.js';
import type { RegisterAgentRequest } from '@swarmroom/shared';

function resolveUniqueDisplayName(existingNames: string[], candidate: string): string {
  if (!existingNames.includes(candidate)) {
    return candidate;
  }
  let suffix = 1;
  while (existingNames.includes(`${candidate}-${suffix}`)) {
    suffix++;
  }
  return `${candidate}-${suffix}`;
}

export function createAgent(input: RegisterAgentRequest) {
  const id = crypto.randomUUID();
  const now = Date.now();

  const allAgents = db.select({ displayName: agents.displayName }).from(agents).all();
  const existingNames = allAgents
    .map((a) => a.displayName)
    .filter((n): n is string => n !== null);

  const rawDisplayName = generateDisplayName();
  const displayName = resolveUniqueDisplayName(existingNames, rawDisplayName);

  db.insert(agents)
    .values({
      id,
      name: input.name,
      displayName,
      url: input.url,
      status: 'online',
      agentCard: input.agentCard ? JSON.stringify(input.agentCard) : null,
      lastHeartbeat: now,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  if (input.teamIds && input.teamIds.length > 0) {
    for (const teamId of input.teamIds) {
      db.insert(agentTeams).values({ agentId: id, teamId }).run();
    }
  }

  return getAgentById(id);
}

export function listAgents(filters?: {
  status?: string;
  teamId?: string;
  projectId?: string;
}) {
  const conditions: SQL[] = [];

  if (filters?.status) {
    conditions.push(eq(agents.status, filters.status));
  }

  if (filters?.teamId) {
    const agentIdsInTeam = db
      .select({ agentId: agentTeams.agentId })
      .from(agentTeams)
      .where(eq(agentTeams.teamId, filters.teamId))
      .all()
      .map((r) => r.agentId);

    if (agentIdsInTeam.length === 0) {
      return [];
    }
    conditions.push(inArray(agents.id, agentIdsInTeam));
  }

  if (filters?.projectId) {
    const agentIdsInProject = db
      .select({ agentId: agentProjects.agentId })
      .from(agentProjects)
      .where(eq(agentProjects.projectId, filters.projectId))
      .all()
      .map((r) => r.agentId);

    if (agentIdsInProject.length === 0) {
      return [];
    }
    conditions.push(inArray(agents.id, agentIdsInProject));
  }

  const query = db
    .select()
    .from(agents)
    .orderBy(desc(agents.status), asc(agents.name));

  if (conditions.length > 0) {
    return query.where(and(...conditions)).all();
  }

  return query.all();
}

export function getAgentById(id: string) {
  const agent = db.select().from(agents).where(eq(agents.id, id)).get();
  if (!agent) return null;

  const teamRows = db
    .select({ teamId: agentTeams.teamId })
    .from(agentTeams)
    .where(eq(agentTeams.agentId, id))
    .all();

  const projectRows = db
    .select({ projectId: agentProjects.projectId })
    .from(agentProjects)
    .where(eq(agentProjects.agentId, id))
    .all();

  return {
    ...agent,
    agentCard: agent.agentCard ? JSON.parse(agent.agentCard) : null,
    teamIds: teamRows.map((r) => r.teamId),
    projectIds: projectRows.map((r) => r.projectId),
  };
}

export function updateAgent(
  id: string,
  updates: Partial<{
    name: string;
    url: string;
    status: string;
    agentCard: string;
  }>,
) {
  const existing = db.select().from(agents).where(eq(agents.id, id)).get();
  if (!existing) return null;

  const values: Record<string, unknown> = { updatedAt: Date.now() };

  if (updates.name !== undefined) values.name = updates.name;
  if (updates.url !== undefined) values.url = updates.url;
  if (updates.status !== undefined) values.status = updates.status;
  if (updates.agentCard !== undefined) values.agentCard = updates.agentCard;

  db.update(agents).set(values).where(eq(agents.id, id)).run();

  return getAgentById(id);
}

export function deregisterAgent(id: string) {
  const existing = db.select().from(agents).where(eq(agents.id, id)).get();
  if (!existing) return null;

  db.update(agents)
    .set({ status: 'offline', updatedAt: Date.now() })
    .where(eq(agents.id, id))
    .run();

  return getAgentById(id);
}

export function getAgentCount(): number {
  const result = db.select({ value: count() }).from(agents).get();
  return result?.value ?? 0;
}
