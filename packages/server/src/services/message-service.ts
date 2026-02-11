import { eq, and, or, desc, asc, gt, type SQL } from 'drizzle-orm';
import { db, messages, agents } from '../db/index.js';
import type { SendMessageRequest } from '@swarmroom/shared';
import { MAX_MESSAGE_SIZE_BYTES } from '@swarmroom/shared';
import { pushMessageToRecipient, hasActiveConnections, sendToDaemons } from './ws-manager.js';

export function createMessage(input: SendMessageRequest) {
  const contentBytes = new TextEncoder().encode(input.content).length;
  if (contentBytes > MAX_MESSAGE_SIZE_BYTES) {
    throw new MessageSizeError(
      `Message content exceeds maximum size of ${MAX_MESSAGE_SIZE_BYTES} bytes (got ${contentBytes})`,
    );
  }

  if (input.replyTo) {
    const parent = db
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.id, input.replyTo))
      .get();
    if (!parent) {
      throw new InvalidReplyError(`Parent message "${input.replyTo}" not found`);
    }
  }

  const now = Date.now();

  if (input.to === 'broadcast') {
    const onlineAgents = db
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.status, 'online'))
      .all();

    const createdMessages = [];

    for (const agent of onlineAgents) {
      if (agent.id === input.from) continue;

      const id = crypto.randomUUID();
      db.insert(messages)
        .values({
          id,
          fromAgentId: input.from,
          toAgentId: agent.id,
          senderType: input.senderType ?? 'agent',
          content: input.content,
          type: input.type ?? 'notification',
          replyTo: input.replyTo ?? null,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          read: 0,
          createdAt: now,
        })
        .run();

      createdMessages.push(getMessageById(id)!);
    }

    for (const msg of createdMessages) {
      pushMessageToRecipient(msg.to, msg);

      // Notify daemons if recipient has no active WebSocket connections
      if (!hasActiveConnections(msg.to)) {
        const recipient = db
          .select({ name: agents.name })
          .from(agents)
          .where(eq(agents.id, msg.to))
          .get();

        if (recipient) {
          sendToDaemons('message_undelivered', {
            recipientAgentId: msg.to,
            recipientAgentName: recipient.name,
            message: msg,
          });
        }
      }
    }

    return createdMessages;
  }

  const id = crypto.randomUUID();
  db.insert(messages)
    .values({
      id,
      fromAgentId: input.from,
      toAgentId: input.to,
      senderType: input.senderType ?? 'agent',
      content: input.content,
      type: input.type ?? 'notification',
      replyTo: input.replyTo ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      read: 0,
      createdAt: now,
    })
    .run();

  const created = getMessageById(id)!;
  pushMessageToRecipient(created.to, created);

  if (!hasActiveConnections(created.to)) {
    const recipient = db
      .select({ name: agents.name })
      .from(agents)
      .where(eq(agents.id, created.to))
      .get();

    if (recipient) {
      sendToDaemons('message_undelivered', {
        recipientAgentId: created.to,
        recipientAgentName: recipient.name,
        message: created,
      });
    }
  }

  return created;
}

export function getMessagesForAgent(
  agentId: string,
  options?: { since?: string; limit?: number; type?: string },
) {
  const conditions: SQL[] = [eq(messages.toAgentId, agentId)];

  if (options?.since) {
    const sinceTs = Number(options.since);
    if (!Number.isNaN(sinceTs)) {
      conditions.push(gt(messages.createdAt, sinceTs));
    }
  }

  if (options?.type) {
    conditions.push(eq(messages.type, options.type));
  }

  const limit = options?.limit ?? 50;

  const rows = db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .all();

  return rows.map(formatMessage);
}

export function getMessageById(id: string) {
  const row = db.select().from(messages).where(eq(messages.id, id)).get();
  if (!row) return null;
  return formatMessage(row);
}

export function markMessageAsRead(id: string) {
  const existing = db.select().from(messages).where(eq(messages.id, id)).get();
  if (!existing) return null;

  db.update(messages).set({ read: 1 }).where(eq(messages.id, id)).run();

  return getMessageById(id)!;
}

export function getConversation(agentA: string, agentB: string, limit = 100) {
  const rows = db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.fromAgentId, agentA), eq(messages.toAgentId, agentB)),
        and(eq(messages.fromAgentId, agentB), eq(messages.toAgentId, agentA)),
      ),
    )
    .orderBy(asc(messages.createdAt))
    .limit(limit)
    .all();

  return rows.map(formatMessage);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMessage(row: typeof messages.$inferSelect) {
  return {
    id: row.id,
    from: row.fromAgentId,
    to: row.toAgentId,
    senderType: row.senderType,
    content: row.content,
    type: row.type,
    replyTo: row.replyTo ?? undefined,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    read: row.read === 1,
    createdAt: row.createdAt,
  };
}

// ─── Custom Errors ──────────────────────────────────────────────────────────

export class MessageSizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessageSizeError';
  }
}

export class InvalidReplyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidReplyError';
  }
}
