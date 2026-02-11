import { Command } from 'commander';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import chalk from 'chalk';
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

function startHubProcess(port: number): ChildProcess {
  const serverEntry = resolveServerEntry();

  if (!existsSync(serverEntry)) {
    error(`Server entry not found at: ${serverEntry}`);
    error('Make sure the server is built: npm run build -w packages/server');
    process.exit(1);
  }

  const hubProcess = spawn('node', [serverEntry], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(port) },
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
    .option('--hub-only', 'Start only the hub server')
    .option('--daemon-only', 'Start only the daemon watcher')
    .option('--hub-url <url>', 'Hub URL for daemon connection')
    .option('--port <port>', 'Server port (default: 3000)', '3000')
    .option('--verbose', 'Enable verbose logging')
    .action(async (options: {
      hubOnly?: boolean;
      daemonOnly?: boolean;
      hubUrl?: string;
      port: string;
      verbose?: boolean;
    }) => {
      const port = parseInt(options.port, 10);
      const verbose = options.verbose ?? false;

      if (options.hubOnly && options.daemonOnly) {
        error('Cannot use --hub-only and --daemon-only together.');
        process.exit(1);
      }

      if (options.hubOnly) {
        banner('SwarmRoom Hub');
        info('Starting hub server only...');
        keyValue('Port', chalk.cyan(String(port)));
        console.log('');

        const hubProcess = startHubProcess(port);

        const shutdown = () => {
          console.log('');
          info('Shutting down hub...');
          hubProcess.kill('SIGTERM');
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        return;
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

      banner('SwarmRoom', 'Hub + Daemon');
      info('Starting hub server and daemon watcher...');
      keyValue('Port', chalk.cyan(String(port)));
      keyValue('Hub URL', chalk.cyan(hubUrl));
      if (verbose) {
        keyValue('Verbose', chalk.yellow('enabled'));
      }
      console.log('');

      const hubProcess = startHubProcess(port);

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
