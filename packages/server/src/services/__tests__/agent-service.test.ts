import { describe, it, expect, vi } from 'vitest';
import {
  createAgent,
  listAgents,
  getAgentById,
  updateAgent,
  deregisterAgent,
  getAgentCount,
} from '../../services/agent-service.js';

describe('AgentService', () => {
  const validInput = { name: 'test-agent', url: 'http://localhost:3000' };

  it('createAgent returns agent with UUID and displayName', () => {
    const agent = createAgent(validInput);

    expect(agent).not.toBeNull();
    expect(agent!.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(agent!.name).toBe('test-agent');
    expect(agent!.displayName).toBeTruthy();
    expect(agent!.status).toBe('online');
    expect(agent!.teamIds).toEqual([]);
    expect(agent!.projectIds).toEqual([]);
  });

  it('listAgents filters by status', () => {
    createAgent({ name: 'agent-a', url: 'http://a' });
    const agentB = createAgent({ name: 'agent-b', url: 'http://b' });
    deregisterAgent(agentB!.id);

    const onlineAgents = listAgents({ status: 'online' });
    const offlineAgents = listAgents({ status: 'offline' });

    expect(onlineAgents).toHaveLength(1);
    expect(onlineAgents[0].name).toBe('agent-a');
    expect(offlineAgents).toHaveLength(1);
    expect(offlineAgents[0].name).toBe('agent-b');
  });

  it('resolves display name collision by appending suffix', () => {
    const generateDisplayName = vi.fn().mockReturnValue('SwiftFalcon');
    vi.doMock('../../lib/names.js', () => ({ generateDisplayName }));

    const agent1 = createAgent({ name: 'agent-1', url: 'http://1' });
    const agent2 = createAgent({ name: 'agent-2', url: 'http://2' });

    const names = [agent1!.displayName, agent2!.displayName];
    const unique = new Set(names);
    expect(unique.size).toBe(2);
  });

  it('deregisterAgent sets status to offline (soft delete)', () => {
    const agent = createAgent(validInput);
    const result = deregisterAgent(agent!.id);

    expect(result).not.toBeNull();
    expect(result!.status).toBe('offline');

    const fetched = getAgentById(agent!.id);
    expect(fetched!.status).toBe('offline');
  });

  it('getAgentById returns full agent detail or null', () => {
    const agent = createAgent(validInput);
    const fetched = getAgentById(agent!.id);

    expect(fetched).not.toBeNull();
    expect(fetched!.name).toBe('test-agent');
    expect(fetched!.teamIds).toEqual([]);
    expect(fetched!.projectIds).toEqual([]);

    const missing = getAgentById('nonexistent-id');
    expect(missing).toBeNull();
  });

  it('getAgentCount returns correct count', () => {
    expect(getAgentCount()).toBe(0);

    createAgent({ name: 'a1', url: 'http://a' });
    createAgent({ name: 'a2', url: 'http://b' });

    expect(getAgentCount()).toBe(2);
  });

  it('updateAgent modifies fields and returns updated agent', () => {
    const agent = createAgent(validInput);
    const updated = updateAgent(agent!.id, { name: 'renamed-agent' });

    expect(updated).not.toBeNull();
    expect(updated!.name).toBe('renamed-agent');

    const notFound = updateAgent('nonexistent', { name: 'x' });
    expect(notFound).toBeNull();
  });
});
