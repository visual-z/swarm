import { execSync } from 'node:child_process';
import { platform } from 'node:os';

/**
 * Check if a process matching the given name/pattern is currently running.
 * Uses `pgrep -f` on Linux/macOS or `tasklist` on Windows.
 */
export function isProcessRunning(processPattern: string): boolean {
  const os = platform();
  try {
    if (os === 'win32') {
      const output = execSync(`tasklist /FI "IMAGENAME eq ${processPattern}*"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      return !output.includes('No tasks are running');
    } else {
      // Linux / macOS — pgrep -f matches full command line
      execSync(`pgrep -f "${processPattern}"`, {
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      return true; // pgrep exits 0 = found
    }
  } catch {
    return false; // pgrep exits 1 = not found, or command failed
  }
}

/** Check if any Claude Code process is running */
export function isClaudeCodeRunning(): boolean {
  return isProcessRunning('claude');
}

/** Check if any OpenCode process is running */
export function isOpenCodeRunning(): boolean {
  return isProcessRunning('opencode');
}

/** Check if any Gemini CLI process is running */
export function isGeminiCliRunning(): boolean {
  return isProcessRunning('gemini');
}

/**
 * Map of agent type names to their process detection functions.
 * Agent type names match the keys used in DaemonConfig.agents.
 */
export const AGENT_PROCESS_DETECTORS: Record<string, () => boolean> = {
  'claude-code': isClaudeCodeRunning,
  'opencode': isOpenCodeRunning,
  'gemini-cli': isGeminiCliRunning,
};

/**
 * Check if the agent of the given type has a running process.
 * Returns false for unknown agent types.
 */
export function isAgentProcessRunning(agentType: string): boolean {
  const detector = AGENT_PROCESS_DETECTORS[agentType];
  if (!detector) return false;
  return detector();
}
