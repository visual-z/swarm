import { describe, it, expect, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from '../../__tests__/setup.js';
import { agents } from '../../db/schema.js';

function seedAgent(id: string, name: string, heartbeatAge: number) {
  const now = Date.now();
  testDb
    .insert(agents)
    .values({
      id,
      name,
      displayName: name,
      url: `http://${name}`,
      status: 'online',
      lastHeartbeat: now - heartbeatAge,
      createdAt: now,
      updatedAt: now,
    })
    .run();
}

describe('HeartbeatService', () => {
  it('heartbeat update changes lastHeartbeat timestamp', () => {
    seedAgent('a1', 'agent-fresh', 0);

    const before = testDb
      .select({ lastHeartbeat: agents.lastHeartbeat })
      .from(agents)
      .where(eq(agents.id, 'a1'))
      .get();

    const newTs = Date.now() + 5000;
    testDb
      .update(agents)
      .set({ lastHeartbeat: newTs, updatedAt: newTs })
      .where(eq(agents.id, 'a1'))
      .run();

    const after = testDb
      .select({ lastHeartbeat: agents.lastHeartbeat })
      .from(agents)
      .where(eq(agents.id, 'a1'))
      .get();

    expect(after!.lastHeartbeat).toBe(newTs);
    expect(after!.lastHeartbeat).not.toBe(before!.lastHeartbeat);
  });

  it('stale agents are marked offline when heartbeat exceeds timeout', async () => {
    const STALE_TIMEOUT_MS = 90_000;
    seedAgent('stale-1', 'stale-agent', STALE_TIMEOUT_MS + 10_000);
    seedAgent('fresh-1', 'fresh-agent', 5_000);

    const { lt, and, ne } = await import('drizzle-orm');
    const cutoff = Date.now() - STALE_TIMEOUT_MS;

    const staleAgents = testDb
      .select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(
        and(
          lt(agents.lastHeartbeat, cutoff),
          ne(agents.status, 'offline'),
        ),
      )
      .all();

    expect(staleAgents).toHaveLength(1);
    expect(staleAgents[0].name).toBe('stale-agent');

    for (const agent of staleAgents) {
      testDb
        .update(agents)
        .set({ status: 'offline', updatedAt: Date.now() })
        .where(eq(agents.id, agent.id))
        .run();
    }

    const staleRecord = testDb
      .select({ status: agents.status })
      .from(agents)
      .where(eq(agents.id, 'stale-1'))
      .get();
    expect(staleRecord!.status).toBe('offline');

    const freshRecord = testDb
      .select({ status: agents.status })
      .from(agents)
      .where(eq(agents.id, 'fresh-1'))
      .get();
    expect(freshRecord!.status).toBe('online');
  });
});
