import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { DaemonConfigSchema, type DaemonConfig } from '@swarmroom/shared';

const CONFIG_DIR = join(homedir(), '.swarmroom');
const CONFIG_PATH = join(CONFIG_DIR, 'daemon.json');

/**
 * Returns the path to the daemon config file.
 */
export function getConfigPath(): string {
  return CONFIG_PATH;
}

/**
 * Returns the default daemon configuration.
 * All agents have headlessWakeup disabled by default.
 */
export function getDefaultConfig(): DaemonConfig {
  return {
    hubUrl: 'http://localhost:39187',
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
  };
}

/**
 * Load daemon config from ~/.swarmroom/daemon.json.
 * Returns default config if file doesn't exist.
 * Validates with Zod schema and merges with defaults for missing fields.
 */
export function loadDaemonConfig(): DaemonConfig {
  if (!existsSync(CONFIG_PATH)) {
    return getDefaultConfig();
  }

  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);

    // Merge with defaults: user config overrides defaults
    const defaults = getDefaultConfig();
    const merged = {
      ...defaults,
      ...parsed,
      agents: {
        ...defaults.agents,
        ...(parsed.agents ?? {}),
      },
    };

    return DaemonConfigSchema.parse(merged);
  } catch (error) {
    console.warn(`[daemon] Failed to load config from ${CONFIG_PATH}, using defaults:`, error);
    return getDefaultConfig();
  }
}

/**
 * Save daemon config to ~/.swarmroom/daemon.json.
 * Creates the ~/.swarmroom/ directory if it doesn't exist.
 */
export function saveDaemonConfig(config: DaemonConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Ensure the config file exists. If not, write defaults.
 * Returns the loaded (or newly created) config.
 */
export function ensureConfig(): DaemonConfig {
  if (!existsSync(CONFIG_PATH)) {
    const config = getDefaultConfig();
    saveDaemonConfig(config);
    return config;
  }
  return loadDaemonConfig();
}
