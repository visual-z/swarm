import { z } from 'zod';

export const ProjectGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  agentIds: z.array(z.string()),
  createdAt: z.string(),
});

export const CreateProjectRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  agentIds: z.array(z.string()).optional(),
});
