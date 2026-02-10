import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { AgentDetector, DetectionResult } from './index.js';

export class ClaudeCodeDetector implements AgentDetector {
  readonly name = 'Claude Code';

  async detect(): Promise<DetectionResult> {
    const installed = this.checkInstalled();
    const { configExists, configPath } = this.findConfig();

    return {
      installed,
      configExists,
      configPath,
      name: this.name,
    };
  }

  private checkInstalled(): boolean {
    try {
      execSync('which claude', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private findConfig(): { configExists: boolean; configPath: string } {
    // Check cwd first, then home directory
    const cwdPath = join(process.cwd(), '.mcp.json');
    if (existsSync(cwdPath)) {
      return { configExists: true, configPath: cwdPath };
    }

    const homePath = join(homedir(), '.mcp.json');
    if (existsSync(homePath)) {
      return { configExists: true, configPath: homePath };
    }

    // Default to cwd path even if not found
    return { configExists: false, configPath: cwdPath };
  }
}
