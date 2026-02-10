import { ClaudeCodeDetector } from './claude-code.js';
import { OpenCodeDetector } from './opencode.js';
import { GeminiCliDetector } from './gemini-cli.js';

export interface DetectionResult {
  installed: boolean;
  configExists: boolean;
  configPath: string;
  name: string;
}

export interface AgentDetector {
  name: string;
  detect(): Promise<DetectionResult>;
}

const allDetectors: AgentDetector[] = [
  new ClaudeCodeDetector(),
  new OpenCodeDetector(),
  new GeminiCliDetector(),
];

export async function detectAllAgents(): Promise<DetectionResult[]> {
  return Promise.all(allDetectors.map((d) => d.detect()));
}

export { ClaudeCodeDetector, OpenCodeDetector, GeminiCliDetector };
