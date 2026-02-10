import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { DEFAULT_PORT } from '@swarmroom/shared';
import {
  banner,
  keyValue,
  error,
  formatUptime,
  statusIndicator,
} from '../utils/display.js';

interface HealthResponse {
  status: string;
  version: string;
  uptime: number;
  agentCount: number;
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

export function makeStatusCommand(): Command {
  const cmd = new Command('status')
    .description('Show SwarmRoom Hub status')
    .option('--hub-url <url>', 'Hub URL (or discover via mDNS)')
    .action(async (options: { hubUrl?: string }) => {
      banner('SwarmRoom Status');

      const hubUrl = await resolveHubUrl(options.hubUrl);
      const spinner = ora(`Connecting to ${chalk.cyan(hubUrl)}...`).start();

      try {
        const response = await fetch(`${hubUrl}/health`);

        if (!response.ok) {
          spinner.fail(`Hub returned HTTP ${response.status}`);
          return;
        }

        const health = (await response.json()) as HealthResponse;
        spinner.stop();

        console.log('');
        keyValue('Hub URL', chalk.cyan(hubUrl));
        keyValue('Status', statusIndicator(health.status === 'ok' ? 'online' : 'offline'));
        keyValue('Version', chalk.white(health.version));
        keyValue('Uptime', chalk.white(formatUptime(health.uptime)));
        keyValue('Agents', chalk.white(String(health.agentCount)));
        console.log('');
      } catch {
        spinner.fail(`Cannot connect to Hub at ${chalk.cyan(hubUrl)}`);
        console.log('');
        error('Hub is offline or unreachable.');
        console.log('');
        keyValue('Hub URL', chalk.cyan(hubUrl));
        keyValue('Status', statusIndicator('offline'));
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
