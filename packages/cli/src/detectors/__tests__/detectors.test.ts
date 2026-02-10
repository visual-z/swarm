import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { homedir } from 'node:os';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  copyFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { ClaudeCodeDetector } from '../claude-code.js';
import { OpenCodeDetector } from '../opencode.js';
import { GeminiCliDetector } from '../gemini-cli.js';
import { detectAllAgents } from '../index.js';

const mockedExecSync = vi.mocked(execSync);
const mockedExistsSync = vi.mocked(existsSync);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ClaudeCodeDetector', () => {
  const detector = new ClaudeCodeDetector();

  it('detects when claude is installed and config exists in cwd', async () => {
    mockedExecSync.mockReturnValue(Buffer.from('/usr/bin/claude'));
    mockedExistsSync.mockReturnValueOnce(true);

    const result = await detector.detect();

    expect(result.installed).toBe(true);
    expect(result.configExists).toBe(true);
    expect(result.configPath).toBe(join(process.cwd(), '.mcp.json'));
    expect(result.name).toBe('Claude Code');
    expect(mockedExecSync).toHaveBeenCalledWith('which claude', { stdio: 'ignore' });
  });

  it('detects when claude is not installed and no config exists', async () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('not found');
    });
    mockedExistsSync.mockReturnValue(false);

    const result = await detector.detect();

    expect(result.installed).toBe(false);
    expect(result.configExists).toBe(false);
    expect(result.configPath).toBe(join(process.cwd(), '.mcp.json'));
    expect(result.name).toBe('Claude Code');
  });

  it('finds config in home directory when not in cwd', async () => {
    mockedExecSync.mockReturnValue(Buffer.from('/usr/bin/claude'));
    mockedExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);

    const result = await detector.detect();

    expect(result.installed).toBe(true);
    expect(result.configExists).toBe(true);
    expect(result.configPath).toBe(join(homedir(), '.mcp.json'));
  });
});

describe('OpenCodeDetector', () => {
  const detector = new OpenCodeDetector();

  it('detects when opencode is installed and config exists', async () => {
    mockedExecSync.mockReturnValue(Buffer.from('/usr/bin/opencode'));
    mockedExistsSync.mockReturnValue(true);

    const result = await detector.detect();

    expect(result.installed).toBe(true);
    expect(result.configExists).toBe(true);
    expect(result.configPath).toBe(join(process.cwd(), 'opencode.json'));
    expect(result.name).toBe('OpenCode');
  });

  it('detects when opencode is not installed', async () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('not found');
    });
    mockedExistsSync.mockReturnValue(false);

    const result = await detector.detect();

    expect(result.installed).toBe(false);
    expect(result.configExists).toBe(false);
  });
});

describe('GeminiCliDetector', () => {
  const detector = new GeminiCliDetector();

  it('detects when gemini is installed and config exists', async () => {
    mockedExecSync.mockReturnValue(Buffer.from('/usr/bin/gemini'));
    mockedExistsSync.mockReturnValue(true);

    const result = await detector.detect();

    expect(result.installed).toBe(true);
    expect(result.configExists).toBe(true);
    expect(result.configPath).toBe(join(homedir(), '.gemini', 'settings.json'));
    expect(result.name).toBe('Gemini CLI');
  });
});

describe('detectAllAgents', () => {
  it('returns results for all 3 agents', async () => {
    mockedExecSync.mockReturnValue(Buffer.from('/usr/bin/agent'));
    mockedExistsSync.mockReturnValue(true);

    const results = await detectAllAgents();

    expect(results).toHaveLength(3);
    const names = results.map((r) => r.name);
    expect(names).toContain('Claude Code');
    expect(names).toContain('OpenCode');
    expect(names).toContain('Gemini CLI');
    results.forEach((r) => {
      expect(r.installed).toBe(true);
      expect(r.configExists).toBe(true);
    });
  });
});
