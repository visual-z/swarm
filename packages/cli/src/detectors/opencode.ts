import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AgentDetector, DetectionResult } from './index.js';

export class OpenCodeDetector implements AgentDetector {
  readonly name = 'OpenCode';

  async detect(): Promise<DetectionResult> {
    const installed = this.checkInstalled();
    const configPath = join(process.cwd(), 'opencode.json');
    const configExists = existsSync(configPath);

    return {
      installed,
      configExists,
      configPath,
      name: this.name,
    };
  }

  private checkInstalled(): boolean {
    try {
      execSync('which opencode', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}
