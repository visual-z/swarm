import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'node:child_process';
import {
  isProcessRunning,
  isClaudeCodeRunning,
  isOpenCodeRunning,
  isGeminiCliRunning,
  isAgentProcessRunning,
  AGENT_PROCESS_DETECTORS,
} from '../process-detector.js';

const mockedExecSync = vi.mocked(execSync);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isProcessRunning', () => {
  it('returns true when pgrep succeeds (process found)', () => {
    mockedExecSync.mockReturnValue(Buffer.from('12345'));

    expect(isProcessRunning('claude')).toBe(true);
    expect(mockedExecSync).toHaveBeenCalledWith('pgrep -f "claude"', {
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  });

  it('returns false when pgrep throws (process not found)', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('exit code 1');
    });

    expect(isProcessRunning('claude')).toBe(false);
  });
});

describe('isClaudeCodeRunning', () => {
  it('checks for "claude" process', () => {
    mockedExecSync.mockReturnValue(Buffer.from('12345'));

    const result = isClaudeCodeRunning();

    expect(result).toBe(true);
    expect(mockedExecSync).toHaveBeenCalledWith('pgrep -f "claude"', expect.any(Object));
  });
});

describe('isOpenCodeRunning', () => {
  it('checks for "opencode" process', () => {
    mockedExecSync.mockReturnValue(Buffer.from('12345'));

    const result = isOpenCodeRunning();

    expect(result).toBe(true);
    expect(mockedExecSync).toHaveBeenCalledWith('pgrep -f "opencode"', expect.any(Object));
  });
});

describe('isGeminiCliRunning', () => {
  it('checks for "gemini" process', () => {
    mockedExecSync.mockReturnValue(Buffer.from('12345'));

    const result = isGeminiCliRunning();

    expect(result).toBe(true);
    expect(mockedExecSync).toHaveBeenCalledWith('pgrep -f "gemini"', expect.any(Object));
  });
});

describe('AGENT_PROCESS_DETECTORS', () => {
  it('has entries for claude-code, opencode, and gemini-cli', () => {
    expect(Object.keys(AGENT_PROCESS_DETECTORS)).toEqual(
      expect.arrayContaining(['claude-code', 'opencode', 'gemini-cli']),
    );
    expect(Object.keys(AGENT_PROCESS_DETECTORS)).toHaveLength(3);
  });

  it('maps to the correct detector functions', () => {
    expect(AGENT_PROCESS_DETECTORS['claude-code']).toBe(isClaudeCodeRunning);
    expect(AGENT_PROCESS_DETECTORS['opencode']).toBe(isOpenCodeRunning);
    expect(AGENT_PROCESS_DETECTORS['gemini-cli']).toBe(isGeminiCliRunning);
  });
});

describe('isAgentProcessRunning', () => {
  it('returns false for unknown agent type', () => {
    expect(isAgentProcessRunning('unknown-agent')).toBe(false);
    expect(mockedExecSync).not.toHaveBeenCalled();
  });

  it('delegates to the correct detector for known agent type', () => {
    mockedExecSync.mockReturnValue(Buffer.from('12345'));

    expect(isAgentProcessRunning('claude-code')).toBe(true);
    expect(mockedExecSync).toHaveBeenCalledWith('pgrep -f "claude"', expect.any(Object));
  });

  it('returns false when known agent process is not running', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('exit code 1');
    });

    expect(isAgentProcessRunning('opencode')).toBe(false);
  });
});
