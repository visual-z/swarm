import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { homedir } from 'node:os';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import {
  getDefaultConfig,
  loadDaemonConfig,
  saveDaemonConfig,
  ensureConfig,
  getConfigPath,
} from '../config.js';

const mockedExistsSync = vi.mocked(existsSync);
const mockedReadFileSync = vi.mocked(readFileSync);
const mockedWriteFileSync = vi.mocked(writeFileSync);
const mockedMkdirSync = vi.mocked(mkdirSync);

const CONFIG_DIR = join(homedir(), '.swarmroom');
const CONFIG_PATH = join(CONFIG_DIR, 'daemon.json');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getConfigPath', () => {
  it('returns the correct path under ~/.swarmroom/', () => {
    const path = getConfigPath();
    expect(path).toBe(CONFIG_PATH);
  });
});

describe('getDefaultConfig', () => {
  it('returns config with hubUrl and three agents', () => {
    const config = getDefaultConfig();

    expect(config.hubUrl).toBe('http://localhost:3000');
    expect(Object.keys(config.agents)).toHaveLength(3);
    expect(config.agents).toHaveProperty('claude-code');
    expect(config.agents).toHaveProperty('opencode');
    expect(config.agents).toHaveProperty('gemini-cli');
  });

  it('has all agents with headlessWakeup disabled by default', () => {
    const config = getDefaultConfig();

    for (const agent of Object.values(config.agents)) {
      expect(agent.headlessWakeup).toBe(false);
    }
  });

  it('has correct command for each agent', () => {
    const config = getDefaultConfig();

    expect(config.agents['claude-code'].command).toBe('claude');
    expect(config.agents['opencode'].command).toBe('opencode');
    expect(config.agents['gemini-cli'].command).toBe('gemini');
  });
});

describe('loadDaemonConfig', () => {
  it('returns defaults when config file does not exist', () => {
    mockedExistsSync.mockReturnValue(false);

    const config = loadDaemonConfig();

    expect(config).toEqual(getDefaultConfig());
    expect(mockedReadFileSync).not.toHaveBeenCalled();
  });

  it('parses valid config from file and merges with defaults', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        hubUrl: 'http://myhost:4000',
        agents: {
          'claude-code': {
            headlessWakeup: true,
            command: 'claude',
            args: ['-p', '{message}'],
          },
        },
      }),
    );

    const config = loadDaemonConfig();

    expect(config.hubUrl).toBe('http://myhost:4000');
    expect(config.agents['claude-code'].headlessWakeup).toBe(true);
    expect(config.agents['opencode']).toBeDefined();
    expect(config.agents['gemini-cli']).toBeDefined();
  });

  it('handles invalid JSON gracefully and returns defaults', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue('not valid json {{{');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const config = loadDaemonConfig();

    expect(config).toEqual(getDefaultConfig());
    warnSpy.mockRestore();
  });
});

describe('saveDaemonConfig', () => {
  it('writes JSON to the correct path', () => {
    mockedExistsSync.mockReturnValue(true);

    const config = getDefaultConfig();
    saveDaemonConfig(config);

    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      CONFIG_PATH,
      expect.stringContaining('"hubUrl"'),
      'utf-8',
    );
  });

  it('creates directory if it does not exist', () => {
    mockedExistsSync.mockReturnValue(false);

    saveDaemonConfig(getDefaultConfig());

    expect(mockedMkdirSync).toHaveBeenCalledWith(CONFIG_DIR, { recursive: true });
    expect(mockedWriteFileSync).toHaveBeenCalled();
  });

  it('does not create directory if it already exists', () => {
    mockedExistsSync.mockReturnValue(true);

    saveDaemonConfig(getDefaultConfig());

    expect(mockedMkdirSync).not.toHaveBeenCalled();
  });
});

describe('ensureConfig', () => {
  it('creates file with defaults when config does not exist', () => {
    mockedExistsSync.mockReturnValue(false);

    const config = ensureConfig();

    expect(config).toEqual(getDefaultConfig());
    expect(mockedWriteFileSync).toHaveBeenCalled();
  });

  it('loads existing config when file exists', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        hubUrl: 'http://custom:5000',
        agents: {
          'claude-code': {
            headlessWakeup: true,
            command: 'claude',
            args: ['-p', '{message}'],
          },
        },
      }),
    );

    const config = ensureConfig();

    expect(config.hubUrl).toBe('http://custom:5000');
    expect(mockedWriteFileSync).not.toHaveBeenCalled();
  });
});
