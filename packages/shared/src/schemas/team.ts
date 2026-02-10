import { z } from 'zod';

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  agentIds: z.array(z.string()),
  createdAt: z.string(),
});

export const CreateTeamRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  agentIds: z.array(z.string()).optional(),
});
