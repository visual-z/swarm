import { eq, and, count } from 'drizzle-orm';
import { db, teams, agentTeams, agents } from '../db/index.js';
import type { CreateTeamRequest } from '@swarmroom/shared';

export function createTeam(input: CreateTeamRequest & { color?: string }) {
  const id = crypto.randomUUID();
  const now = Date.now();

  db.insert(teams)
    .values({
      id,
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? '#6366f1',
      createdAt: now,
    })
    .run();

  if (input.agentIds && input.agentIds.length > 0) {
    for (const agentId of input.agentIds) {
      db.insert(agentTeams).values({ agentId, teamId: id }).run();
    }
  }

  return getTeamById(id);
}

export function listTeams() {
  const allTeams = db.select().from(teams).all();

  return allTeams.map((team) => {
    const result = db
      .select({ value: count() })
      .from(agentTeams)
      .where(eq(agentTeams.teamId, team.id))
      .get();

    return {
      ...team,
      agentCount: result?.value ?? 0,
    };
  });
}

export function getTeamById(id: string) {
  const team = db.select().from(teams).where(eq(teams.id, id)).get();
  if (!team) return null;

  const memberRows = db
    .select()
    .from(agents)
    .innerJoin(agentTeams, eq(agents.id, agentTeams.agentId))
    .where(eq(agentTeams.teamId, id))
    .all();

  return {
    ...team,
    agents: memberRows.map((r) => ({
      ...r.agents,
      agentCard: r.agents.agentCard ? JSON.parse(r.agents.agentCard) : null,
    })),
  };
}

export function updateTeam(
  id: string,
  updates: Partial<{ name: string; description: string; color: string }>,
) {
  const existing = db.select().from(teams).where(eq(teams.id, id)).get();
  if (!existing) return null;

  const values: Record<string, unknown> = {};
  if (updates.name !== undefined) values.name = updates.name;
  if (updates.description !== undefined) values.description = updates.description;
  if (updates.color !== undefined) values.color = updates.color;

  if (Object.keys(values).length > 0) {
    db.update(teams).set(values).where(eq(teams.id, id)).run();
  }

  return getTeamById(id);
}

export function deleteTeam(id: string) {
  const existing = db.select().from(teams).where(eq(teams.id, id)).get();
  if (!existing) return null;

  db.delete(agentTeams).where(eq(agentTeams.teamId, id)).run();
  db.delete(teams).where(eq(teams.id, id)).run();

  return existing;
}

export function addAgentToTeam(teamId: string, agentId: string) {
  const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
  if (!team) return { error: 'team_not_found' as const };

  const agent = db.select().from(agents).where(eq(agents.id, agentId)).get();
  if (!agent) return { error: 'agent_not_found' as const };

  db.insert(agentTeams).values({ agentId, teamId }).run();
  return { data: getTeamById(teamId) };
}

export function removeAgentFromTeam(teamId: string, agentId: string) {
  const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
  if (!team) return { error: 'team_not_found' as const };

  const membership = db
    .select()
    .from(agentTeams)
    .where(eq(agentTeams.teamId, teamId))
    .all()
    .find((r) => r.agentId === agentId);

  if (!membership) return { error: 'not_a_member' as const };

  db.delete(agentTeams)
    .where(and(eq(agentTeams.teamId, teamId), eq(agentTeams.agentId, agentId)))
    .run();

  return { data: getTeamById(teamId) };
}
