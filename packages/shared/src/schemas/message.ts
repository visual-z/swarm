import { z } from 'zod';

export const MessageTypeSchema = z.enum([
  'notification',
  'query',
  'response',
  'broadcast',
]);

export const SenderTypeSchema = z.enum([
  'agent',
  'person',
]);

export const MessageSchema = z.object({
  id: z.string().uuid(),
  from: z.string(),
  to: z.string(),
  senderType: SenderTypeSchema,
  content: z.string(),
  type: MessageTypeSchema,
  replyTo: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  read: z.boolean().default(false),
  createdAt: z.string(),
});

export const SendMessageRequestSchema = z.object({
  from: z.string(),
  to: z.string(),
  senderType: SenderTypeSchema.default('agent'),
  content: z.string(),
  type: MessageTypeSchema.default('notification'),
  replyTo: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const GetMessagesQuerySchema = z.object({
  agentId: z.string(),
  since: z.string().optional(),
  limit: z.number().int().positive().default(50),
  type: MessageTypeSchema.optional(),
});
