import chalk from 'chalk';

export function banner(title: string, message?: string): void {
  const line = '─'.repeat(Math.max(title.length, message?.length ?? 0) + 4);
  console.log('');
  console.log(chalk.cyan(`  ╭${line}╮`));
  console.log(chalk.cyan(`  │  ${chalk.bold.white(title.padEnd(line.length - 4))}  │`));
  if (message) {
    console.log(chalk.cyan(`  │  ${chalk.gray(message.padEnd(line.length - 4))}  │`));
  }
  console.log(chalk.cyan(`  ╰${line}╯`));
  console.log('');
}

export function successBox(title: string, lines: string[]): void {
  const maxLen = Math.max(title.length, ...lines.map((l) => l.length));
  const width = maxLen + 4;
  const border = '─'.repeat(width);

  console.log('');
  console.log(chalk.green(`  ╭${border}╮`));
  console.log(chalk.green(`  │  ${chalk.bold.white(title.padEnd(width - 4))}  │`));
  console.log(chalk.green(`  │${' '.repeat(width)}│`));
  for (const line of lines) {
    console.log(chalk.green(`  │  ${line.padEnd(width - 4)}  │`));
  }
  console.log(chalk.green(`  ╰${border}╯`));
  console.log('');
}

export function table(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, (row[i] ?? '').length), 0);
    return Math.max(h.length, maxRow);
  });

  const headerLine = headers.map((h, i) => chalk.bold.white(h.padEnd(colWidths[i]!))).join('  ');
  const separator = colWidths.map((w) => '─'.repeat(w)).join('──');

  console.log(`  ${headerLine}`);
  console.log(chalk.gray(`  ${separator}`));

  for (const row of rows) {
    const line = row.map((cell, i) => cell.padEnd(colWidths[i]!)).join('  ');
    console.log(`  ${line}`);
  }
}

export function statusIndicator(status: string): string {
  switch (status) {
    case 'online':
      return chalk.green('●') + ' ' + chalk.green('online');
    case 'busy':
      return chalk.yellow('●') + ' ' + chalk.yellow('busy');
    case 'idle':
      return chalk.blue('●') + ' ' + chalk.blue('idle');
    case 'offline':
      return chalk.gray('●') + ' ' + chalk.gray('offline');
    default:
      return chalk.gray('●') + ' ' + chalk.gray(status);
  }
}

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function keyValue(key: string, value: string): void {
  console.log(`  ${chalk.gray(key + ':')} ${value}`);
}

export function error(message: string): void {
  console.error(chalk.red(`  ✖ ${message}`));
}

export function warn(message: string): void {
  console.log(chalk.yellow(`  ⚠ ${message}`));
}

export function info(message: string): void {
  console.log(chalk.blue(`  ℹ ${message}`));
}

export function success(message: string): void {
  console.log(chalk.green(`  ✔ ${message}`));
}
