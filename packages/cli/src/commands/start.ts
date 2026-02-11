import { Command } from 'commander';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import chalk from 'chalk';
import { DEFAULT_PORT } from '@swarmroom/shared';
import { DaemonWatcher } from '../daemon/watcher.js';
import { banner, keyValue, info, error } from '../utils/display.js';

const HUB_STARTUP_DELAY_MS = 2000;

function resolveServerEntry(): string {
  const require = createRequire(import.meta.url);
  return require.resolve('@swarmroom/server/dist/index.js');
}

function prefixLines(prefix: string, data: Buffer): void {
  const text = data.toString().trim();
  if (!text) return;
  for (const line of text.split('\n')) {
    console.log(`${prefix} ${line}`);
  }
}

function startHubProcess(port: number, noWeb = false): ChildProcess {
  const serverEntry = resolveServerEntry();

  if (!existsSync(serverEntry)) {
    error(`Server entry not found at: ${serverEntry}`);
    error('Make sure the server is built: npm run build -w packages/server');
    process.exit(1);
  }

  const env = { ...process.env, PORT: String(port), ...(noWeb ? { SWARMROOM_NO_WEB: '1' } : {}) };

  const hubProcess = spawn('node', [serverEntry], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
  });

  const hubPrefix = chalk.blue('[hub]');
  const hubErrPrefix = chalk.red('[hub]');

  hubProcess.stdout?.on('data', (data: Buffer) => {
    prefixLines(hubPrefix, data);
  });

  hubProcess.stderr?.on('data', (data: Buffer) => {
    prefixLines(hubErrPrefix, data);
  });

  hubProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      error(`Hub process exited with code ${code}`);
    }
  });

  hubProcess.on('error', (err) => {
    error(`Failed to start hub: ${err.message}`);
  });

  return hubProcess;
}

export function makeStartCommand(): Command {
  const cmd = new Command('start')
    .description('Start SwarmRoom (hub + daemon)')
    .option('--server-only', 'Start hub API only (no web dashboard) + daemon')
    .option('--daemon-only', 'Start only the daemon watcher')
    .option('--hub-url <url>', 'Hub URL for daemon connection')
    .option('--port <port>', `Server port (default: ${DEFAULT_PORT})`, String(DEFAULT_PORT))
    .option('--verbose', 'Enable verbose logging')
    .action(async (options: {
      serverOnly?: boolean;
      daemonOnly?: boolean;
      hubUrl?: string;
      port: string;
      verbose?: boolean;
    }) => {
      const port = parseInt(options.port, 10);
      const verbose = options.verbose ?? false;

      if (options.serverOnly && options.daemonOnly) {
        error('Cannot use --server-only and --daemon-only together.');
        process.exit(1);
      }

      if (options.daemonOnly) {
        const hubUrl = options.hubUrl ?? `http://localhost:${port}`;

        banner('SwarmRoom Daemon');
        info('Starting daemon watcher only...');
        keyValue('Hub URL', chalk.cyan(hubUrl));
        console.log('');

        const watcher = new DaemonWatcher({
          hubUrl,
          workdir: process.cwd(),
          verbose,
        });

        watcher.start();

        const shutdown = () => {
          console.log('');
          info('Shutting down daemon...');
          watcher.stop();
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        return;
      }

      const hubUrl = options.hubUrl ?? `http://localhost:${port}`;
      const noWeb = options.serverOnly ?? false;

      banner('SwarmRoom', 'Hub + Daemon');
      keyValue('Hub API', chalk.cyan(`http://localhost:${port}`));
      keyValue('Web Dashboard', noWeb ? chalk.dim('disabled') : chalk.cyan(`http://localhost:${port}`));
      if (verbose) {
        keyValue('Verbose', chalk.yellow('enabled'));
      }
      console.log('');

      const hubProcess = startHubProcess(port, noWeb);

      const watcher = new DaemonWatcher({
        hubUrl,
        workdir: process.cwd(),
        verbose,
      });

      const daemonTimer = setTimeout(() => {
        info('Starting daemon watcher...');
        watcher.start();
      }, HUB_STARTUP_DELAY_MS);

      const shutdown = () => {
        console.log('');
        info('Shutting down SwarmRoom...');
        clearTimeout(daemonTimer);
        watcher.stop();
        hubProcess.kill('SIGTERM');
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    });

  return cmd;
}
