import mdns from 'multicast-dns';
import { MDNS_SERVICE_TYPE, DEFAULT_PORT } from '@swarmroom/shared';

const SERVICE_NAME = `${MDNS_SERVICE_TYPE}.local`;
const QUERY_INTERVAL_MS = 30_000;

type TxtData = string | Buffer | Array<string | Buffer>;

interface SrvData {
  target: string;
  port: number;
}

interface MdnsRecord {
  type: string;
  name: string;
  data: SrvData | TxtData | string;
}

interface MdnsResponse {
  answers?: MdnsRecord[];
  additionals?: MdnsRecord[];
}

let browser: ReturnType<typeof mdns> | null = null;
let queryTimer: ReturnType<typeof setInterval> | null = null;
let running = false;
let lastDiscoveredUrl: string | null = null;

function normalizeName(name: string): string {
  return name.endsWith('.') ? name.slice(0, -1) : name;
}

function isServiceRecordName(name: string): boolean {
  return normalizeName(name).endsWith(SERVICE_NAME);
}

function parseTxtEntries(data: TxtData): string[] {
  const entries = Array.isArray(data) ? data : [data];
  return entries
    .map((entry) => (Buffer.isBuffer(entry) ? entry.toString('utf8') : String(entry)))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function findTxtUrl(records: MdnsRecord[]): string | null {
  for (const record of records) {
    if (record.type !== 'TXT' || !isServiceRecordName(record.name)) continue;
    const entries = parseTxtEntries(record.data as TxtData);
    for (const entry of entries) {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex === -1) continue;
      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      if (key === 'url' && value) {
        return value;
      }
    }
  }
  return null;
}

function findSrvRecord(records: MdnsRecord[]): MdnsRecord | null {
  for (const record of records) {
    if (record.type === 'SRV' && isServiceRecordName(record.name)) {
      return record;
    }
  }
  return null;
}

function resolveTargetIp(target: string, records: MdnsRecord[]): string | null {
  const normalizedTarget = normalizeName(target);
  let fallbackIpv6: string | null = null;
  for (const record of records) {
    if (record.type !== 'A' && record.type !== 'AAAA') continue;
    if (normalizeName(record.name) !== normalizedTarget) continue;
    if (record.type === 'A' && typeof record.data === 'string') {
      return record.data;
    }
    if (record.type === 'AAAA' && typeof record.data === 'string') {
      fallbackIpv6 = record.data;
    }
  }
  return fallbackIpv6;
}

function extractHubUrl(records: MdnsRecord[]): string | null {
  const txtUrl = findTxtUrl(records);
  if (txtUrl) return txtUrl;

  const srvRecord = findSrvRecord(records);
  if (!srvRecord) return null;

  const srvData = srvRecord.data as SrvData;
  const targetIp = resolveTargetIp(srvData.target, records);
  if (!targetIp) return null;

  const port = srvData.port ?? DEFAULT_PORT;
  return `http://${targetIp}:${port}`;
}

function sendQuery(): void {
  if (!browser) return;
  browser.query({ questions: [{ name: SERVICE_NAME, type: 'PTR' }] });
}

export function startBrowsing(): void {
  if (process.env.SWARMROOM_DISABLE_MDNS === 'true') {
    return;
  }
  if (running) return;

  try {
    browser = mdns();
    running = true;
    console.log(`[mdns-browser] Browsing for ${MDNS_SERVICE_TYPE} services on the network`);

    browser.on('response', (response: MdnsResponse) => {
      const records = [...(response.answers ?? []), ...(response.additionals ?? [])];
      const url = extractHubUrl(records);
      if (!url) return;
      if (url === lastDiscoveredUrl) return;
      lastDiscoveredUrl = url;
      console.log(`[mdns-browser] Discovered SwarmRoom hub at ${url}`);
    });

    browser.on('error', (error: Error) => {
      console.warn('[mdns-browser] mDNS error:', error.message);
    });

    sendQuery();
    queryTimer = setInterval(sendQuery, QUERY_INTERVAL_MS);
  } catch (error) {
    console.warn('[mdns-browser] Failed to start browsing — continuing without mDNS browsing:', error);
    stopBrowsing();
  }
}

export function stopBrowsing(): void {
  if (queryTimer) {
    clearInterval(queryTimer);
    queryTimer = null;
  }
  if (browser) {
    browser.removeAllListeners();
    browser.destroy();
    browser = null;
  }
  if (running) {
    running = false;
    lastDiscoveredUrl = null;
    console.log('[mdns-browser] Stopped browsing');
  }
}
