import { ClaudeCodeConfigurator } from './claude-code.js';
import { OpenCodeConfigurator } from './opencode.js';
import { GeminiCliConfigurator } from './gemini-cli.js';

export interface ConfiguratorResult {
  success: boolean;
  configPath: string;
  backedUp: boolean;
  backupPath?: string;
  error?: string;
  before?: string;
  after?: string;
}

export interface AgentConfigurator {
  name: string;
  configure(hubUrl: string, configPath: string, dryRun: boolean): Promise<ConfiguratorResult>;
}

const configurators: Record<string, AgentConfigurator> = {
  'Claude Code': new ClaudeCodeConfigurator(),
  'OpenCode': new OpenCodeConfigurator(),
  'Gemini CLI': new GeminiCliConfigurator(),
};

export async function configureAgent(
  agentName: string,
  hubUrl: string,
  configPath: string,
  dryRun: boolean,
): Promise<ConfiguratorResult> {
  const configurator = configurators[agentName];

  if (!configurator) {
    return {
      success: false,
      configPath,
      backedUp: false,
      error: `No configurator found for agent: ${agentName}`,
    };
  }

  return configurator.configure(hubUrl, configPath, dryRun);
}

export { ClaudeCodeConfigurator, OpenCodeConfigurator, GeminiCliConfigurator };
