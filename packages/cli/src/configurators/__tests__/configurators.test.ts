import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ClaudeCodeConfigurator } from '../claude-code.js';
import { OpenCodeConfigurator } from '../opencode.js';
import { GeminiCliConfigurator } from '../gemini-cli.js';
import { configureAgent } from '../index.js';

let tempDir: string;

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTempDir(): string {
  tempDir = mkdtempSync(join(tmpdir(), 'swarmroom-test-'));
  return tempDir;
}

describe('ClaudeCodeConfigurator', () => {
  const configurator = new ClaudeCodeConfigurator();
  const hubUrl = 'http://localhost:3000';

  it('writes correct JSON to new config file', async () => {
    const dir = createTempDir();
    const configPath = join(dir, '.mcp.json');

    const result = await configurator.configure(hubUrl, configPath, false);

    expect(result.success).toBe(true);
    expect(result.backedUp).toBe(false);

    const written = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(written.mcpServers.swarmroom).toEqual({
      type: 'http',
      url: 'http://localhost:3000/mcp',
    });
  });

  it('merges with existing config and creates backup', async () => {
    const dir = createTempDir();
    const configPath = join(dir, '.mcp.json');

    const existingConfig = {
      mcpServers: {
        other: { type: 'stdio', command: 'some-tool' },
      },
    };
    writeFileSync(configPath, JSON.stringify(existingConfig, null, 2), 'utf-8');

    const result = await configurator.configure(hubUrl, configPath, false);

    expect(result.success).toBe(true);
    expect(result.backedUp).toBe(true);
    expect(result.backupPath).toBe(configPath + '.bak');
    expect(existsSync(configPath + '.bak')).toBe(true);

    const merged = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(merged.mcpServers.other).toEqual({ type: 'stdio', command: 'some-tool' });
    expect(merged.mcpServers.swarmroom).toEqual({
      type: 'http',
      url: 'http://localhost:3000/mcp',
    });
  });

  it('does not write files in dry-run mode', async () => {
    const dir = createTempDir();
    const configPath = join(dir, '.mcp.json');

    const result = await configurator.configure(hubUrl, configPath, true);

    expect(result.success).toBe(true);
    expect(result.backedUp).toBe(false);
    expect(result.before).toBe('{}');
    expect(result.after).toContain('swarmroom');
    expect(existsSync(configPath)).toBe(false);
  });
});

describe('OpenCodeConfigurator', () => {
  const configurator = new OpenCodeConfigurator();
  const hubUrl = 'http://localhost:3000';

  it('writes config with mcp key (not mcpServers)', async () => {
    const dir = createTempDir();
    const configPath = join(dir, 'opencode.json');

    const result = await configurator.configure(hubUrl, configPath, false);

    expect(result.success).toBe(true);
    const written = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(written.mcp.swarmroom).toEqual({
      type: 'remote',
      url: 'http://localhost:3000/mcp',
    });
    expect(written.mcpServers).toBeUndefined();
  });
});

describe('GeminiCliConfigurator', () => {
  const configurator = new GeminiCliConfigurator();
  const hubUrl = 'http://localhost:3000';

  it('creates parent directories and writes httpUrl format', async () => {
    const dir = createTempDir();
    const configPath = join(dir, '.gemini', 'settings.json');

    const result = await configurator.configure(hubUrl, configPath, false);

    expect(result.success).toBe(true);
    const written = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(written.mcpServers.swarmroom).toEqual({
      httpUrl: 'http://localhost:3000/mcp',
    });
  });
});

describe('configureAgent', () => {
  it('returns error for unknown agent name', async () => {
    const result = await configureAgent('Unknown Agent', 'http://localhost:3000', '/tmp/fake', false);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No configurator found');
  });
});
