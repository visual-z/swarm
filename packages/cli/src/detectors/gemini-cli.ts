import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { AgentDetector, DetectionResult } from './index.js';

export class GeminiCliDetector implements AgentDetector {
  readonly name = 'Gemini CLI';

  async detect(): Promise<DetectionResult> {
    const installed = this.checkInstalled();
    const configPath = join(homedir(), '.gemini', 'settings.json');
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
      execSync('which gemini', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}
