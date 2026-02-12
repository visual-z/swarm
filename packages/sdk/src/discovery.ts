import mdns from 'multicast-dns';
import { MDNS_SERVICE_TYPE, DEFAULT_PORT } from '@swarmroom/shared';

const SERVICE_NAME = `${MDNS_SERVICE_TYPE}.local`;

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

export async function discoverHub(timeoutMs = 5000): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const client = mdns();
    let settled = false;

    const finalize = (result: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.removeListener('response', handleResponse);
      client.removeListener('error', handleError);
      client.destroy();
      resolve(result);
    };

    const handleError = () => {
      finalize(null);
    };

    const handleResponse = (response: MdnsResponse) => {
      const records = [...(response.answers ?? []), ...(response.additionals ?? [])];

      const txtUrl = findTxtUrl(records);
      if (txtUrl) {
        finalize(txtUrl);
        return;
      }

      const srvRecord = findSrvRecord(records);
      if (!srvRecord) return;

      const srvData = srvRecord.data as SrvData;
      const targetIp = resolveTargetIp(srvData.target, records);
      if (!targetIp) return;

      const port = srvData.port ?? DEFAULT_PORT;
      finalize(`http://${targetIp}:${port}`);
    };

    const timer = setTimeout(() => finalize(null), timeoutMs);

    client.on('response', handleResponse);
    client.on('error', handleError);
    client.query({ questions: [{ name: SERVICE_NAME, type: 'PTR' }] });
  });
}
