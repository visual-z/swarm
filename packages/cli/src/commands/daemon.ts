import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { DaemonWatcher } from '../daemon/watcher.js';
import {
  loadDaemonConfig,
  saveDaemonConfig,
  getDefaultConfig,
} from '../daemon/config.js';
import {
  banner,
  keyValue,
  info,
  success,
  error,
  warn,
  table,
} from '../utils/display.js';

const PID_FILE = join(homedir(), '.swarmroom', 'daemon.pid');

function makeStartCommand(): Command {
  return new Command('start')
    .description('Start the SwarmRoom daemon')
    .option('--hub-url <url>', 'Override hub URL')
    .option('--verbose', 'Enable verbose logging')
    .option('--background', 'Run as detached background process')
    .action(async (options: { hubUrl?: string; verbose?: boolean; background?: boolean }) => {
      banner('SwarmRoom Daemon');

      const config = loadDaemonConfig();
      const hubUrl = options.hubUrl ?? config.hubUrl;

      if (options.background) {
        const args = [process.argv[1]!, 'daemon', 'start', '--hub-url', hubUrl];
        if (options.verbose) {
          args.push('--verbose');
        }

        const child = spawn(process.argv[0]!, args, {
          detached: true,
          stdio: 'ignore',
        });

        child.unref();

        const pid = child.pid;
        if (pid) {
          const pidDir = join(homedir(), '.swarmroom');
          if (!existsSync(pidDir)) {
            const { mkdirSync } = await import('node:fs');
            mkdirSync(pidDir, { recursive: true });
          }
          writeFileSync(PID_FILE, String(pid), 'utf-8');
          success(`Daemon started in background (PID: ${chalk.bold(String(pid))})`);
          keyValue('Hub URL', chalk.cyan(hubUrl));
          keyValue('PID file', chalk.gray(PID_FILE));
        } else {
          error('Failed to start daemon process.');
        }
        return;
      }

      info(`Starting daemon in foreground...`);
      keyValue('Hub URL', chalk.cyan(hubUrl));
      console.log('');

      const watcher = new DaemonWatcher({
        hubUrl,
        verbose: options.verbose ?? false,
        workdir: process.cwd(),
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
    });
}

function makeStopCommand(): Command {
  return new Command('stop')
    .description('Stop the SwarmRoom daemon')
    .action(() => {
      banner('SwarmRoom Daemon');

      if (!existsSync(PID_FILE)) {
        error('No daemon PID file found. Daemon may not be running.');
        return;
      }

      const pidStr = readFileSync(PID_FILE, 'utf-8').trim();
      const pid = parseInt(pidStr, 10);

      if (isNaN(pid)) {
        error(`Invalid PID in ${PID_FILE}: "${pidStr}"`);
        unlinkSync(PID_FILE);
        return;
      }

      try {
        process.kill(pid, 'SIGTERM');
        unlinkSync(PID_FILE);
        success(`Daemon stopped (PID: ${chalk.bold(String(pid))})`);
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'ESRCH') {
          warn('Daemon process not found (may have already stopped).');
          unlinkSync(PID_FILE);
        } else {
          error(`Failed to stop daemon (PID: ${pid}): ${(err as Error).message}`);
        }
      }
    });
}

function makeStatusSubcommand(): Command {
  return new Command('status')
    .description('Show daemon status')
    .action(() => {
      banner('SwarmRoom Daemon');

      let daemonRunning = false;
      let daemonPid: number | null = null;

      if (existsSync(PID_FILE)) {
        const pidStr = readFileSync(PID_FILE, 'utf-8').trim();
        const pid = parseInt(pidStr, 10);

        if (!isNaN(pid)) {
          try {
            process.kill(pid, 0);
            daemonRunning = true;
            daemonPid = pid;
          } catch {
          }
        }
      }

      const config = loadDaemonConfig();

      keyValue('Status', daemonRunning
        ? chalk.green('● running')
        : chalk.gray('● stopped'));

      if (daemonPid !== null) {
        keyValue('PID', chalk.white(String(daemonPid)));
      }

      keyValue('Hub URL', chalk.cyan(config.hubUrl));
      console.log('');

      const agentNames = Object.keys(config.agents);
      if (agentNames.length > 0) {
        info('Agent wakeup configuration:');
        console.log('');

        const headers = ['Agent', 'Headless Wakeup', 'Command'];
        const rows = agentNames.map((name) => {
          const agent = config.agents[name]!;
          const wakeup = agent.headlessWakeup
            ? chalk.green('enabled')
            : chalk.gray('disabled');
          const cmd = chalk.white(`${agent.command} ${agent.args.join(' ')}`);
          return [name, wakeup, cmd];
        });

        table(headers, rows);
      } else {
        info('No agents configured.');
      }

      console.log('');
    });
}

function makeConfigSubcommand(): Command {
  return new Command('config')
    .description('Configure the daemon')
    .action(async () => {
      banner('SwarmRoom Daemon');

      let running = true;
      while (running) {
        const config = loadDaemonConfig();

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Daemon configuration:',
            choices: [
              { name: 'Show current config', value: 'show' },
              { name: 'Toggle headless wakeup for an agent', value: 'toggle' },
              { name: 'Set hub URL', value: 'hub-url' },
              { name: 'Set workdir for an agent', value: 'workdir' },
              { name: 'Reset to defaults', value: 'reset' },
              { name: 'Exit', value: 'exit' },
            ],
          },
        ]) as { action: string };

        switch (action) {
          case 'show': {
            console.log('');
            keyValue('Hub URL', chalk.cyan(config.hubUrl));
            console.log('');

            const agentNames = Object.keys(config.agents);
            if (agentNames.length > 0) {
              const headers = ['Agent', 'Headless Wakeup', 'Command', 'Workdir'];
              const rows = agentNames.map((name) => {
                const agent = config.agents[name]!;
                const wakeup = agent.headlessWakeup
                  ? chalk.green('enabled')
                  : chalk.gray('disabled');
                const cmd = `${agent.command} ${agent.args.join(' ')}`;
                const workdir = agent.workdir ?? chalk.gray('(default)');
                return [name, wakeup, cmd, workdir];
              });
              table(headers, rows);
            } else {
              info('No agents configured.');
            }
            console.log('');
            break;
          }

          case 'toggle': {
            const agentNames = Object.keys(config.agents);
            if (agentNames.length === 0) {
              warn('No agents configured.');
              break;
            }

            const { agent } = await inquirer.prompt([
              {
                type: 'list',
                name: 'agent',
                message: 'Select agent to toggle:',
                choices: agentNames.map((name) => {
                  const agentConf = config.agents[name]!;
                  const status = agentConf.headlessWakeup
                    ? chalk.green('enabled')
                    : chalk.gray('disabled');
                  return { name: `${name} (${status})`, value: name };
                }),
              },
            ]) as { agent: string };

            const agentConfig = config.agents[agent];
            if (agentConfig) {
              agentConfig.headlessWakeup = !agentConfig.headlessWakeup;
              saveDaemonConfig(config);
              const newStatus = agentConfig.headlessWakeup ? 'enabled' : 'disabled';
              success(`Headless wakeup for ${chalk.bold(agent)} is now ${newStatus}.`);
            }
            break;
          }

          case 'hub-url': {
            const { url } = await inquirer.prompt([
              {
                type: 'input',
                name: 'url',
                message: 'Enter new hub URL:',
                default: config.hubUrl,
              },
            ]) as { url: string };

            config.hubUrl = url;
            saveDaemonConfig(config);
            success(`Hub URL set to ${chalk.cyan(url)}`);
            break;
          }

          case 'workdir': {
            const agentNames = Object.keys(config.agents);
            if (agentNames.length === 0) {
              warn('No agents configured.');
              break;
            }

            const { agent } = await inquirer.prompt([
              {
                type: 'list',
                name: 'agent',
                message: 'Select agent:',
                choices: agentNames,
              },
            ]) as { agent: string };

            const { dir } = await inquirer.prompt([
              {
                type: 'input',
                name: 'dir',
                message: `Working directory for ${agent}:`,
                default: config.agents[agent]?.workdir ?? process.cwd(),
              },
            ]) as { dir: string };

            const agentConfig = config.agents[agent];
            if (agentConfig) {
              agentConfig.workdir = dir;
              saveDaemonConfig(config);
              success(`Workdir for ${chalk.bold(agent)} set to ${chalk.cyan(dir)}`);
            }
            break;
          }

          case 'reset': {
            const { confirm } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirm',
                message: 'Reset daemon config to defaults?',
                default: false,
              },
            ]) as { confirm: boolean };

            if (confirm) {
              saveDaemonConfig(getDefaultConfig());
              success('Config reset to defaults.');
            }
            break;
          }

          case 'exit':
            running = false;
            break;
        }
      }
    });
}

export function makeDaemonCommand(): Command {
  const cmd = new Command('daemon')
    .description('Manage the SwarmRoom daemon');

  cmd.addCommand(makeStartCommand());
  cmd.addCommand(makeStopCommand());
  cmd.addCommand(makeStatusSubcommand());
  cmd.addCommand(makeConfigSubcommand());

  return cmd;
}
