import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import {
  createMessage,
  getMessagesForAgent,
  getMessageById,
  getConversation,
  MessageSizeError,
} from '../../services/message-service.js';
import { testDb } from '../../__tests__/setup.js';
import { agents } from '../../db/schema.js';

function seedAgent(id: string, name: string) {
  testDb
    .insert(agents)
    .values({
      id,
      name,
      displayName: name,
      url: `http://${name}`,
      status: 'online',
      lastHeartbeat: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    .run();
}

describe('MessageService', () => {
  it('createMessage stores and returns a message', () => {
    seedAgent('a1', 'alice');
    seedAgent('a2', 'bob');

    const msg = createMessage({
      from: 'a1',
      to: 'a2',
      content: 'hello bob',
    });

    expect(msg).not.toBeInstanceOf(Array);
    const single = msg as Exclude<typeof msg, unknown[]>;
    expect(single.id).toBeDefined();
    expect(single.from).toBe('a1');
    expect(single.to).toBe('a2');
    expect(single.content).toBe('hello bob');
    expect(single.read).toBe(false);
  });

  it('getMessagesForAgent returns messages addressed to agent', () => {
    seedAgent('a1', 'alice');
    seedAgent('a2', 'bob');

    createMessage({ from: 'a1', to: 'a2', content: 'msg-1' });
    createMessage({ from: 'a1', to: 'a2', content: 'msg-2' });

    const msgs = getMessagesForAgent('a2');
    expect(msgs).toHaveLength(2);
    expect(msgs.every((m) => m.to === 'a2')).toBe(true);
  });

  it('broadcast creates messages for all online agents except sender', () => {
    seedAgent('a1', 'alice');
    seedAgent('a2', 'bob');
    seedAgent('a3', 'carol');

    const result = createMessage({
      from: 'a1',
      to: 'broadcast',
      content: 'hey everyone',
    });

    expect(Array.isArray(result)).toBe(true);
    const msgs = result as unknown[];
    expect(msgs).toHaveLength(2);
  });

  it('rejects oversized message content', () => {
    seedAgent('a1', 'alice');
    seedAgent('a2', 'bob');

    const bigContent = 'x'.repeat(1_048_577);

    expect(() =>
      createMessage({ from: 'a1', to: 'a2', content: bigContent }),
    ).toThrow(MessageSizeError);
  });

  it('getConversation returns messages between two agents in order', () => {
    seedAgent('a1', 'alice');
    seedAgent('a2', 'bob');

    createMessage({ from: 'a1', to: 'a2', content: 'hi bob' });
    createMessage({ from: 'a2', to: 'a1', content: 'hi alice' });
    createMessage({ from: 'a1', to: 'a2', content: 'how are you?' });

    const convo = getConversation('a1', 'a2');
    expect(convo).toHaveLength(3);
    expect(convo[0].content).toBe('hi bob');
    expect(convo[1].content).toBe('hi alice');
    expect(convo[2].content).toBe('how are you?');
  });

  it('getMessageById returns null for nonexistent message', () => {
    const result = getMessageById('nonexistent');
    expect(result).toBeNull();
  });
});
