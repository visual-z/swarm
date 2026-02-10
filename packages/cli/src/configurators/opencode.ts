import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import type { AgentConfigurator, ConfiguratorResult } from './index.js';

export class OpenCodeConfigurator implements AgentConfigurator {
  readonly name = 'OpenCode';

  async configure(hubUrl: string, configPath: string, dryRun: boolean): Promise<ConfiguratorResult> {
    try {
      let existing: Record<string, unknown> = {};
      let before = '{}';

      if (existsSync(configPath)) {
        const raw = readFileSync(configPath, 'utf-8');
        before = raw;
        existing = JSON.parse(raw) as Record<string, unknown>;
      }

      const mcp = (existing.mcp ?? {}) as Record<string, unknown>;
      const merged = {
        ...existing,
        mcp: {
          ...mcp,
          swarmroom: {
            type: 'remote',
            url: `${hubUrl}/mcp`,
          },
        },
      };

      const after = JSON.stringify(merged, null, 2) + '\n';

      if (dryRun) {
        return {
          success: true,
          configPath,
          backedUp: false,
          before,
          after,
        };
      }

      let backedUp = false;
      let backupPath: string | undefined;

      if (existsSync(configPath)) {
        backupPath = configPath + '.bak';
        copyFileSync(configPath, backupPath);
        backedUp = true;
      }

      writeFileSync(configPath, after, 'utf-8');

      return {
        success: true,
        configPath,
        backedUp,
        backupPath,
        before,
        after,
      };
    } catch (err) {
      return {
        success: false,
        configPath,
        backedUp: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
