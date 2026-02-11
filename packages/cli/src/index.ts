import { Command } from 'commander';
import { makeSetupCommand } from './commands/setup.js';
import { makeStatusCommand } from './commands/status.js';
import { makeAgentsCommand } from './commands/agents.js';
import { makeDaemonCommand } from './commands/daemon.js';
import { makeStartCommand } from './commands/start.js';

const program = new Command();

program
  .name('swarmroom')
  .description('SwarmRoom CLI — orchestrate AI agents on your local network')
  .version('0.1.0');

program.addCommand(makeSetupCommand());
program.addCommand(makeStatusCommand());
program.addCommand(makeAgentsCommand());
program.addCommand(makeDaemonCommand());
program.addCommand(makeStartCommand());

program.parse();
