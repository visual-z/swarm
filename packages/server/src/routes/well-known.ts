import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { inArray } from 'drizzle-orm';
import type { AgentCard } from '@swarmroom/shared';
import { getAgentById } from '../services/agent-service.js';
import { db, teams, projectGroups } from '../db/index.js';

const wellKnown = new Hono();

// ─── Hub Agent Card ──────────────────────────────────────────────────────────

wellKnown.get('/.well-known/agent-card.json', (c) => {
  const url = new URL(c.req.url);
  const selfUrl = `${url.protocol}//${url.host}`;

  const card: AgentCard = {
    name: 'SwarmRoom Hub',
    description: 'Multi-agent coordination hub for local AI agents',
    version: '0.1.0',
    url: selfUrl,
    skills: [
      {
        id: 'agent-discovery',
        name: 'Agent Discovery',
        description: 'Discover and manage AI coding agents on the local network',
        tags: ['discovery', 'mdns'],
      },
      {
        id: 'message-routing',
        name: 'Message Routing',
        description: 'Route messages between agents in real-time',
        tags: ['messaging', 'routing'],
      },
      {
        id: 'team-management',
        name: 'Team Management',
        description: 'Organize agents into teams and project groups',
        tags: ['teams', 'projects'],
      },
    ],
    teams: [],
    projectGroups: [],
  };

  return c.json(card);
});

// ─── Per-Agent Card ──────────────────────────────────────────────────────────

wellKnown.get('/api/agents/:id/card', (c) => {
  const id = c.req.param('id');
  const agent = getAgentById(id);

  if (!agent) {
    throw new HTTPException(404, { message: `Agent "${id}" not found` });
  }

  if (agent.agentCard) {
    return c.json({ success: true, data: agent.agentCard as AgentCard });
  }

  const teamNames: string[] =
    agent.teamIds.length > 0
      ? db
          .select({ name: teams.name })
          .from(teams)
          .where(inArray(teams.id, agent.teamIds))
          .all()
          .map((t) => t.name)
      : [];

  const projectNames: string[] =
    agent.projectIds.length > 0
      ? db
          .select({ name: projectGroups.name })
          .from(projectGroups)
          .where(inArray(projectGroups.id, agent.projectIds))
          .all()
          .map((p) => p.name)
      : [];

  const card: AgentCard = {
    name: agent.displayName ?? agent.name,
    description: 'Agent registered with SwarmRoom',
    version: '1.0.0',
    url: agent.url,
    skills: [],
    teams: teamNames,
    projectGroups: projectNames,
  };

  return c.json({ success: true, data: card });
});

export { wellKnown };
