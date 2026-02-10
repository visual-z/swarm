import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { DEFAULT_PORT } from '@swarmroom/shared';
import {
  banner,
  successBox,
  info,
  warn,
} from '../utils/display.js';

interface HealthResponse {
  status: string;
  version: string;
  uptime: number;
  agentCount: number;
}

interface AgentInfo {
  name: string;
  description: string;
  detected: boolean;
}

async function tryMdnsDiscovery(): Promise<string | null> {
  try {
    const { discoverHub } = await import('@swarmroom/sdk');
    return await discoverHub(5000);
  } catch {
    return null;
  }
}

async function testHubConnection(hubUrl: string): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${hubUrl}/health`);
    if (!response.ok) return null;
    return (await response.json()) as HealthResponse;
  } catch {
    return null;
  }
}

// TODO: Task 30 — Replace with real agent detection (scan Claude Desktop, Cursor, VS Code, Windsurf configs)
function detectInstalledAgents(): AgentInfo[] {
  return [
    { name: 'Claude Desktop', description: 'Anthropic Claude desktop app', detected: false },
    { name: 'Cursor', description: 'AI-powered code editor', detected: false },
    { name: 'VS Code + Continue', description: 'VS Code with Continue extension', detected: false },
    { name: 'Windsurf', description: 'Codeium Windsurf editor', detected: false },
  ];
}

// TODO: Task 31 — Replace with real MCP config file generation per agent type
function generateMcpConfig(agentName: string, hubUrl: string): Record<string, unknown> {
  return {
    mcpServers: {
      swarmroom: {
        command: 'npx',
        args: ['-y', '@swarmroom/cli', 'mcp-serve'],
        env: {
          SWARMROOM_HUB_URL: hubUrl,
          SWARMROOM_AGENT_NAME: agentName,
        },
      },
    },
  };
}

export function makeSetupCommand(): Command {
  const cmd = new Command('setup')
    .description('Interactive setup wizard for SwarmRoom')
    .option('--hub-url <url>', 'Hub URL (skip mDNS discovery)')
    .option('--dry-run', 'Show what would be configured without writing files')
    .option('--yes', 'Skip confirmations (non-interactive)')
    .action(async (options: { hubUrl?: string; dryRun?: boolean; yes?: boolean }) => {
      banner('SwarmRoom Setup', 'Configure your AI agents to collaborate');

      const dryRun = options.dryRun ?? false;
      const nonInteractive = options.yes ?? false;

      if (dryRun) {
        warn('Dry run mode — no files will be written');
        console.log('');
      }

      let hubUrl = options.hubUrl ?? null;

      if (!hubUrl) {
        const mdnsSpinner = ora('Searching for SwarmRoom Hub via mDNS...').start();
        hubUrl = await tryMdnsDiscovery();

        if (hubUrl) {
          mdnsSpinner.succeed(`Found Hub at ${chalk.cyan(hubUrl)}`);
        } else {
          mdnsSpinner.info('No Hub found via mDNS');

          if (nonInteractive) {
            hubUrl = `http://localhost:${DEFAULT_PORT}`;
            info(`Using default Hub URL: ${chalk.cyan(hubUrl)}`);
          } else {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'hubUrl',
                message: 'Enter Hub URL:',
                default: `http://localhost:${DEFAULT_PORT}`,
              },
            ]);
            hubUrl = answers.hubUrl as string;
          }
        }
      }

      const connectionSpinner = ora(`Testing connection to ${chalk.cyan(hubUrl)}...`).start();
      const health = await testHubConnection(hubUrl);

      if (health) {
        connectionSpinner.succeed(`Hub is ${chalk.green('online')} (v${health.version}, ${health.agentCount} agents)`);
      } else {
        connectionSpinner.warn(`Hub at ${chalk.cyan(hubUrl)} is ${chalk.red('offline')}`);
        warn('Setup will continue, but some features may not work until the Hub is running.');
        console.log('');
      }

      const detectSpinner = ora('Detecting installed AI agents...').start();
      const agents = detectInstalledAgents();
      const detectedAgents = agents.filter((a) => a.detected);

      if (detectedAgents.length > 0) {
        detectSpinner.succeed(`Found ${detectedAgents.length} installed agent(s)`);
      } else {
        detectSpinner.info('No agents auto-detected (stub — real detection in Task 30)');
      }

      console.log('');

      let selectedAgents: string[];

      if (nonInteractive) {
        selectedAgents = agents.map((a) => a.name);
        info(`Auto-selecting all ${selectedAgents.length} agents`);
      } else {
        const answers = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'agents',
            message: 'Select agents to configure:',
            choices: agents.map((a) => ({
              name: `${a.name} — ${a.description}${a.detected ? chalk.green(' (detected)') : ''}`,
              value: a.name,
              checked: a.detected,
            })),
          },
        ]);
        selectedAgents = answers.agents as string[];
      }

      if (selectedAgents.length === 0) {
        info('No agents selected. You can run setup again later.');
        return;
      }

      console.log('');

      const configs: Array<{ agent: string; config: Record<string, unknown> }> = [];

      for (const agentName of selectedAgents) {
        const config = generateMcpConfig(agentName, hubUrl);
        configs.push({ agent: agentName, config });
      }

      if (dryRun) {
        info('Would generate MCP configurations for:');
        console.log('');
        for (const { agent, config } of configs) {
          console.log(chalk.bold(`  ${agent}:`));
          console.log(chalk.gray(JSON.stringify(config, null, 2).split('\n').map((l) => `    ${l}`).join('\n')));
          console.log('');
        }
      } else {
        // TODO: Task 31 — Write actual config files to disk
        info('Config writing is stubbed — real implementation in Task 31');
        console.log('');
      }

      const summaryLines = [
        `Hub: ${hubUrl}`,
        `Agents configured: ${selectedAgents.length}`,
        ...selectedAgents.map((a) => `  ${chalk.green('✔')} ${a}`),
      ];

      if (dryRun) {
        summaryLines.push('', chalk.yellow('(dry run — no files were written)'));
      }

      successBox('Setup Complete', summaryLines);

      if (!dryRun) {
        info('Run ' + chalk.cyan('swarmroom status') + ' to verify your configuration.');
      }
    });

  return cmd;
}
