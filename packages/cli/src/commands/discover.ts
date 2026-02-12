import { Command } from 'commander';
import chalk from 'chalk';
import { MDNS_SERVICE_TYPE } from '@swarmroom/shared';
import { banner, info, keyValue } from '../utils/display.js';

// Interfaces for multicast-dns response types
interface SrvData {
  target?: string;
  port?: number;
}

interface MdnsRecord {
  type: string;
  name: string;
  data?: SrvData | Buffer | Buffer[];
}

interface MdnsResponse {
  answers?: MdnsRecord[];
  additionals?: MdnsRecord[];
}

function isSrvData(data: unknown): data is SrvData {
  return typeof data === 'object' && data !== null && 'target' in data && 'port' in data;
}

export function makeDiscoverCommand(): Command {
  const cmd = new Command('discover')
    .description('Live mDNS service discovery — find SwarmRoom hubs on the network')
    .option('--timeout <seconds>', 'Stop after N seconds', '0')
    .action(async (options: { timeout: string }) => {
      banner('SwarmRoom Discovery');
      info('Searching for SwarmRoom hubs on the local network...');
      info('Press Ctrl+C to stop.\n');

      let mdnsModule: Record<string, unknown>;
      try {
        mdnsModule = await import('multicast-dns');
      } catch {
        console.error(chalk.red('✖ multicast-dns module not available'));
        process.exit(1);
      }

      const mdns = mdnsModule.default as (options?: unknown) => {
        on(event: string, listener: (response: MdnsResponse) => void): void;
        query(options: { questions: Array<{ name: string; type: string }> }): void;
        destroy(): void;
      };
      const m = mdns();
      const serviceType = MDNS_SERVICE_TYPE + '.local';
      const seen = new Set<string>();

      m.on('response', (response: MdnsResponse) => {
        const allRecords = [...(response.answers || []), ...(response.additionals || [])];

        // Look for PTR records matching our service type
        const ptrRecords = allRecords.filter((r) => r.type === 'PTR' && r.name === serviceType);
        if (ptrRecords.length === 0) return;

        // Extract SRV, TXT, and A records
        const srvRecords = allRecords.filter((r) => r.type === 'SRV');
        const txtRecords = allRecords.filter((r) => r.type === 'TXT');
        const aRecords = allRecords.filter((r) => r.type === 'A');

        for (const srv of srvRecords) {
          if (!isSrvData(srv.data)) continue;

          const target = srv.data.target;
          const port = srv.data.port;
          const key = `${target}:${port}`;

          // Parse TXT records for URL
          let url = '';
          for (const txt of txtRecords) {
            const buffers: Buffer[] = Array.isArray(txt.data)
              ? (txt.data as Buffer[])
              : txt.data instanceof Buffer
                ? [txt.data]
                : [];
            for (const buf of buffers) {
              const str = buf.toString();
              if (str.startsWith('url=')) {
                url = str.slice(4);
              }
            }
          }

          // Fallback: get IP from A records
          if (!url && aRecords.length > 0) {
            const ipRecord = aRecords[0];
            if (typeof ipRecord.data === 'string') {
              url = `http://${ipRecord.data}:${port}`;
            }
          }

          const isNew = !seen.has(key);
          seen.add(key);

          const timestamp = new Date().toLocaleTimeString();
          const prefix = isNew ? chalk.green('✦ NEW') : chalk.gray('  ↻  ');

          console.log(`${chalk.gray(timestamp)} ${prefix} ${chalk.bold(srv.name)}`);
          if (url) {
            keyValue('  URL', chalk.cyan(url));
          }
          keyValue('  Host', chalk.white(`${target}:${port}`));
          console.log('');
        }
      });

      // Send initial query
      m.query({ questions: [{ name: serviceType, type: 'PTR' }] });

      // Periodic re-query
      const interval = setInterval(() => {
        m.query({ questions: [{ name: serviceType, type: 'PTR' }] });
      }, 5000);

      const timeoutSeconds = parseInt(options.timeout, 10);
      if (timeoutSeconds > 0) {
        setTimeout(() => {
          clearInterval(interval);
          m.destroy();
          info(`\nDiscovery stopped after ${timeoutSeconds}s. Found ${seen.size} hub(s).`);
          process.exit(0);
        }, timeoutSeconds * 1000);
      }

      const shutdown = () => {
        console.log('');
        clearInterval(interval);
        m.destroy();
        info(`Discovery stopped. Found ${seen.size} hub(s).`);
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    });

  return cmd;
}
