import { z } from 'zod';

// Config for a single agent's wakeup settings
export const AgentWakeupConfigSchema = z.object({
  headlessWakeup: z.boolean().default(false),
  command: z.string(),           // e.g., "claude", "opencode", "gemini"
  args: z.array(z.string()),     // e.g., ["-p", "{message}"]
  workdir: z.string().optional(), // Working directory for spawned process; defaults to daemon start cwd
});

export type AgentWakeupConfig = z.infer<typeof AgentWakeupConfigSchema>;

// Full daemon configuration
export const DaemonConfigSchema = z.object({
  hubUrl: z.string().default('http://localhost:3000'),
  agents: z.record(z.string(), AgentWakeupConfigSchema).default({}),
});

export type DaemonConfig = z.infer<typeof DaemonConfigSchema>;

// Payload for message_undelivered WS event
export const MessageUndeliveredPayloadSchema = z.object({
  recipientAgentId: z.string(),
  recipientAgentName: z.string(),
  message: z.unknown(),
});

export type MessageUndeliveredPayload = z.infer<typeof MessageUndeliveredPayloadSchema>;
