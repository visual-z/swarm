import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DaemonConfig } from '@swarmroom/shared';

const mockOn = vi.fn();
const mockSend = vi.fn();
const mockClose = vi.fn();

vi.mock('ws', () => {
  const MockWebSocket = vi.fn().mockImplementation(function (this: any) {
    this.on = mockOn;
    this.send = mockSend;
    this.close = mockClose;
    this.readyState = 1;
  });
  (MockWebSocket as any).OPEN = 1;
  return { default: MockWebSocket };
});

const mockLoadDaemonConfig = vi.fn();
vi.mock('../config.js', () => ({
  loadDaemonConfig: (...args: unknown[]) => mockLoadDaemonConfig(...args),
}));

const mockIsAgentProcessRunning = vi.fn();
vi.mock('../process-detector.js', () => ({
  isAgentProcessRunning: (...args: unknown[]) => mockIsAgentProcessRunning(...args),
}));

const mockSpawn = vi.fn();
vi.mock('node:child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}));

import WebSocket from 'ws';
import { DaemonWatcher } from '../watcher.js';

function makeDefaultConfig(overrides: Partial<DaemonConfig> = {}): DaemonConfig {
  return {
    hubUrl: 'http://localhost:3000',
    agents: {
      'claude-code': {
        headlessWakeup: false,
        command: 'claude',
        args: ['-p', '{message}', '--dangerously-skip-permissions'],
      },
      'opencode': {
        headlessWakeup: false,
        command: 'opencode',
        args: ['run', '{message}'],
      },
      'gemini-cli': {
        headlessWakeup: false,
        command: 'gemini',
        args: ['-p', '{message}'],
      },
    },
    ...overrides,
  };
}

function getEventHandler(eventName: string): ((...args: unknown[]) => void) | undefined {
  for (const call of mockOn.mock.calls) {
    if (call[0] === eventName) {
      return call[1] as (...args: unknown[]) => void;
    }
  }
  return undefined;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockLoadDaemonConfig.mockReturnValue(makeDefaultConfig());
  mockSpawn.mockReturnValue({
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
  });
});

describe('DaemonWatcher constructor', () => {
  it('uses config hubUrl when no override provided', () => {
    mockLoadDaemonConfig.mockReturnValue(makeDefaultConfig({ hubUrl: 'http://myhost:4000' }));

    const watcher = new DaemonWatcher();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    watcher.start();

    expect(WebSocket).toHaveBeenCalledWith('ws://myhost:4000/ws');
  });

  it('uses provided hubUrl over config hubUrl', () => {
    const watcher = new DaemonWatcher({ hubUrl: 'http://custom:5000' });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    watcher.start();

    expect(WebSocket).toHaveBeenCalledWith('ws://custom:5000/ws');
  });
});

describe('DaemonWatcher.start', () => {
  it('creates WebSocket with ws:// URL derived from http:// hubUrl', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const watcher = new DaemonWatcher();
    watcher.start();

    expect(WebSocket).toHaveBeenCalledWith('ws://localhost:3000/ws');
  });

  it('registers event handlers on the WebSocket', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const watcher = new DaemonWatcher();
    watcher.start();

    const registeredEvents = mockOn.mock.calls.map((c) => c[0]);
    expect(registeredEvents).toContain('open');
    expect(registeredEvents).toContain('message');
    expect(registeredEvents).toContain('close');
    expect(registeredEvents).toContain('error');
  });
});

describe('DaemonWatcher message handling', () => {
  function startWatcher(configOverrides: Partial<DaemonConfig> = {}): DaemonWatcher {
    mockLoadDaemonConfig.mockReturnValue(makeDefaultConfig(configOverrides));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const watcher = new DaemonWatcher();
    watcher.start();
    return watcher;
  }

  function sendMessage(msg: object): void {
    const handler = getEventHandler('message');
    expect(handler).toBeDefined();
    handler!(JSON.stringify(msg));
  }

  function makeUndeliveredMsg(agentName: string, content = 'hello'): object {
    return {
      type: 'message_undelivered',
      payload: {
        recipientAgentId: 'agent-123',
        recipientAgentName: agentName,
        message: { content },
      },
      timestamp: new Date().toISOString(),
    };
  }

  it('does NOT spawn when headless wakeup is disabled', () => {
    startWatcher();
    sendMessage(makeUndeliveredMsg('claude-code'));

    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('does NOT spawn when agent process is already running', () => {
    startWatcher({
      agents: {
        'claude-code': {
          headlessWakeup: true,
          command: 'claude',
          args: ['-p', '{message}'],
        },
      },
    });
    mockIsAgentProcessRunning.mockReturnValue(true);

    sendMessage(makeUndeliveredMsg('claude-code'));

    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('does NOT spawn when on cooldown', () => {
    startWatcher({
      agents: {
        'claude-code': {
          headlessWakeup: true,
          command: 'claude',
          args: ['-p', '{message}'],
        },
      },
    });
    mockIsAgentProcessRunning.mockReturnValue(false);

    sendMessage(makeUndeliveredMsg('claude-code'));
    expect(mockSpawn).toHaveBeenCalledTimes(1);
    mockSpawn.mockClear();

    sendMessage(makeUndeliveredMsg('claude-code'));
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('DOES spawn when headless enabled, process not running, no cooldown', () => {
    startWatcher({
      agents: {
        'opencode': {
          headlessWakeup: true,
          command: 'opencode',
          args: ['run', '{message}'],
        },
      },
    });
    mockIsAgentProcessRunning.mockReturnValue(false);

    sendMessage(makeUndeliveredMsg('opencode'));

    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(mockSpawn).toHaveBeenCalledWith(
      'opencode',
      ['run', 'hello'],
      expect.objectContaining({
        cwd: expect.any(String),
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
  });

  it('spawns with correct workdir from agent config', () => {
    startWatcher({
      agents: {
        'gemini-cli': {
          headlessWakeup: true,
          command: 'gemini',
          args: ['-p', '{message}'],
          workdir: '/my/project',
        },
      },
    });
    mockIsAgentProcessRunning.mockReturnValue(false);

    sendMessage(makeUndeliveredMsg('gemini-cli'));

    expect(mockSpawn).toHaveBeenCalledWith(
      'gemini',
      ['-p', 'hello'],
      expect.objectContaining({ cwd: '/my/project' }),
    );
  });

  it('replaces {message} template in args with message content', () => {
    startWatcher({
      agents: {
        'claude-code': {
          headlessWakeup: true,
          command: 'claude',
          args: ['-p', '{message}', '--flag'],
        },
      },
    });
    mockIsAgentProcessRunning.mockReturnValue(false);

    sendMessage(makeUndeliveredMsg('claude-code', 'fix the bug'));

    expect(mockSpawn).toHaveBeenCalledWith(
      'claude',
      ['-p', 'fix the bug', '--flag'],
      expect.any(Object),
    );
  });

  it('ignores unknown agent names', () => {
    startWatcher({
      agents: {
        'claude-code': {
          headlessWakeup: true,
          command: 'claude',
          args: ['-p', '{message}'],
        },
      },
    });

    sendMessage(makeUndeliveredMsg('totally-unknown'));

    expect(mockSpawn).not.toHaveBeenCalled();
  });
});

describe('DaemonWatcher heartbeat', () => {
  it('responds with pong when receiving heartbeat', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const watcher = new DaemonWatcher();
    watcher.start();

    const handler = getEventHandler('message');
    expect(handler).toBeDefined();

    handler!(JSON.stringify({
      type: 'heartbeat',
      payload: {},
      timestamp: new Date().toISOString(),
    }));

    expect(mockSend).toHaveBeenCalledWith(
      expect.stringContaining('"pong":true'),
    );
  });
});

describe('DaemonWatcher.stop', () => {
  it('closes the WebSocket', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const watcher = new DaemonWatcher();
    watcher.start();

    watcher.stop();

    expect(mockClose).toHaveBeenCalledWith(1000, 'daemon stopping');
  });
});

describe('DaemonWatcher.findAgentType (via message handling)', () => {
  function startWithAllHeadless(): DaemonWatcher {
    mockLoadDaemonConfig.mockReturnValue(makeDefaultConfig({
      agents: {
        'claude-code': { headlessWakeup: true, command: 'claude', args: ['-p', '{message}'] },
        'opencode': { headlessWakeup: true, command: 'opencode', args: ['run', '{message}'] },
        'gemini-cli': { headlessWakeup: true, command: 'gemini', args: ['-p', '{message}'] },
      },
    }));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    mockIsAgentProcessRunning.mockReturnValue(false);
    const watcher = new DaemonWatcher();
    watcher.start();
    return watcher;
  }

  it('matches exact agent name', () => {
    startWithAllHeadless();
    const handler = getEventHandler('message');

    handler!(JSON.stringify({
      type: 'message_undelivered',
      payload: {
        recipientAgentId: 'id-1',
        recipientAgentName: 'claude-code',
        message: { content: 'test' },
      },
      timestamp: new Date().toISOString(),
    }));

    expect(mockSpawn).toHaveBeenCalledWith('claude', expect.any(Array), expect.any(Object));
  });

  it('matches partial agent name containing config key', () => {
    startWithAllHeadless();
    const handler = getEventHandler('message');

    handler!(JSON.stringify({
      type: 'message_undelivered',
      payload: {
        recipientAgentId: 'id-2',
        recipientAgentName: 'my-claude-code-agent',
        message: { content: 'test' },
      },
      timestamp: new Date().toISOString(),
    }));

    expect(mockSpawn).toHaveBeenCalledWith('claude', expect.any(Array), expect.any(Object));
  });

  it('returns null for completely unmatched agent name', () => {
    startWithAllHeadless();
    const handler = getEventHandler('message');

    handler!(JSON.stringify({
      type: 'message_undelivered',
      payload: {
        recipientAgentId: 'id-3',
        recipientAgentName: 'cursor-agent',
        message: { content: 'test' },
      },
      timestamp: new Date().toISOString(),
    }));

    expect(mockSpawn).not.toHaveBeenCalled();
  });
});
