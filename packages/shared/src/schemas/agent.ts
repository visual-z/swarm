import { z } from 'zod';

export const AgentStatusSchema = z.enum([
  'online',
  'offline',
  'busy',
  'idle',
]);

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
});

export const AgentCardSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  url: z.string(),
  skills: z.array(SkillSchema).default([]),
  teams: z.array(z.string()).default([]),
  projectGroups: z.array(z.string()).default([]),
});

export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  displayName: z.string(),
  url: z.string(),
  status: AgentStatusSchema,
  agentCard: AgentCardSchema.optional(),
  createdAt: z.string(),
  lastHeartbeat: z.string().optional(),
});

export const RegisterAgentRequestSchema = z.object({
  name: z.string(),
  url: z.string(),
  agentCard: AgentCardSchema.optional(),
  teamIds: z.array(z.string()).optional(),
});

export const HeartbeatRequestSchema = z.object({
  status: AgentStatusSchema.optional(),
});
