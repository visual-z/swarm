import { eq, lt, and, ne } from 'drizzle-orm';
import { db, agents } from '../db/index.js';
import { HEARTBEAT_INTERVAL_MS, STALE_TIMEOUT_MS } from '@swarmroom/shared';
import { broadcastAgentOffline } from './ws-manager.js';

let intervalId: ReturnType<typeof setInterval> | null = null;

function markStaleAgentsOffline(): void {
  const cutoff = Date.now() - STALE_TIMEOUT_MS;

  const staleAgents = db
    .select({ id: agents.id, name: agents.name, status: agents.status })
    .from(agents)
    .where(
      and(
        lt(agents.lastHeartbeat, cutoff),
        ne(agents.status, 'offline'),
      ),
    )
    .all();

  for (const agent of staleAgents) {
    console.log(
      `[heartbeat] Agent "${agent.name}" (${agent.id}) transitioned from "${agent.status}" to "offline" (stale heartbeat)`,
    );

    db.update(agents)
      .set({ status: 'offline', updatedAt: Date.now() })
      .where(eq(agents.id, agent.id))
      .run();

    broadcastAgentOffline({ id: agent.id, name: agent.name });
  }
}

export function startHeartbeatChecker(): void {
  if (intervalId !== null) {
    return;
  }

  console.log(
    `[heartbeat] Starting stale agent checker (interval: ${HEARTBEAT_INTERVAL_MS}ms, timeout: ${STALE_TIMEOUT_MS}ms)`,
  );

  intervalId = setInterval(markStaleAgentsOffline, HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeatChecker(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[heartbeat] Stopped stale agent checker');
  }
}
