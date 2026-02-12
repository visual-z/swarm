import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { DEFAULT_PORT } from '@swarmroom/shared';
import {
  banner,
  table,
  error,
  info,
  statusIndicator,
} from '../utils/display.js';

interface AgentCard {
  name?: string;
  description?: string;
  teams?: string[];
}

interface Agent {
  id: string;
  name: string;
  displayName?: string;
  status: string;
  agentCard?: AgentCard;
  lastHeartbeat?: string;
}

interface AgentsResponse {
  success: boolean;
  data: Agent[];
}

async function resolveHubUrl(providedUrl?: string): Promise<string> {
  if (providedUrl) return providedUrl;

  try {
    const { discoverHub } = await import('@swarmroom/sdk');
    const discovered = await discoverHub(3000);
    if (discovered) return discovered;
  } catch {
  }

  return `http://localhost:${DEFAULT_PORT}`;
}

export function makeAgentsCommand(): Command {
  const cmd = new Command('agents')
    .description('List all registered agents')
    .option('--hub-url <url>', 'Hub URL (or discover via mDNS)')
    .action(async (options: { hubUrl?: string }) => {
      banner('SwarmRoom Agents');

      const hubUrl = await resolveHubUrl(options.hubUrl);
      const spinner = ora(`Fetching agents from ${chalk.cyan(hubUrl)}...`).start();

      try {
        const response = await fetch(`${hubUrl}/api/agents`);

        if (!response.ok) {
          spinner.fail(`Hub returned HTTP ${response.status}`);
          return;
        }

        const result = (await response.json()) as AgentsResponse;
        const agents = result.data;
        spinner.stop();

        if (agents.length === 0) {
          console.log('');
          info('No agents registered yet.');
          console.log('');
          console.log(
            chalk.gray('  Tip: Connect an agent using the SDK or configure one with ') +
            chalk.cyan('swarmroom setup')
          );
          console.log('');
          return;
        }

        console.log('');
        info(`${agents.length} agent(s) registered`);
        console.log('');

        const headers = ['Name', 'Status', 'Teams', 'ID'];
        const rows = agents.map((agent) => {
          const name = agent.displayName ?? agent.name;
          const status = statusIndicator(agent.status);
          const teams = agent.agentCard?.teams?.join(', ') ?? chalk.gray('none');
          const id = chalk.gray(agent.id.slice(0, 8) + '…');
          return [name, status, teams, id];
        });

        table(headers, rows);
        console.log('');
      } catch {
        spinner.fail(`Cannot connect to Hub at ${chalk.cyan(hubUrl)}`);
        console.log('');
        error('Hub is offline or unreachable.');
        console.log('');
        console.log(
          chalk.gray('  Tip: Start the hub with ') +
          chalk.cyan('npm run dev -w packages/server') +
          chalk.gray(' or check the URL.')
        );
        console.log('');
      }
    });

  return cmd;
}
