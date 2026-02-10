import { z } from 'zod';

export const WSMessageTypeSchema = z.enum([
  'register',
  'message',
  'agent_online',
  'agent_offline',
  'heartbeat',
  'error',
]);

export const WSMessageSchema = z.object({
  type: WSMessageTypeSchema,
  payload: z.unknown(),
  timestamp: z.string(),
});
