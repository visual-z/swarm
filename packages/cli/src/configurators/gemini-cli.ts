import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AgentConfigurator, ConfiguratorResult } from './index.js';

export class GeminiCliConfigurator implements AgentConfigurator {
  readonly name = 'Gemini CLI';

  async configure(hubUrl: string, configPath: string, dryRun: boolean): Promise<ConfiguratorResult> {
    try {
      let existing: Record<string, unknown> = {};
      let before = '{}';

      if (existsSync(configPath)) {
        const raw = readFileSync(configPath, 'utf-8');
        before = raw;
        existing = JSON.parse(raw) as Record<string, unknown>;
      }

      const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
      const merged = {
        ...existing,
        mcpServers: {
          ...mcpServers,
          swarmroom: {
            httpUrl: `${hubUrl}/mcp`,
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

      mkdirSync(dirname(configPath), { recursive: true });

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
