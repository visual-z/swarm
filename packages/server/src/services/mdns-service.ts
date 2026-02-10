import { getResponder, type CiaoService, type Responder } from '@homebridge/ciao';
import { MDNS_SERVICE_TYPE } from '@swarmroom/shared';
import { networkInterfaces } from 'os';

let responder: Responder | null = null;
let service: CiaoService | null = null;

function getLocalIpAddress(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netInfos = nets[name];
    if (!netInfos) continue;
    for (const net of netInfos) {
      if (!net.internal && net.family === 'IPv4') {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

export async function startMdns(port: number): Promise<void> {
  if (process.env.SWARMROOM_DISABLE_MDNS === 'true') {
    console.log('[mdns] mDNS disabled via SWARMROOM_DISABLE_MDNS');
    return;
  }

  try {
    responder = getResponder();

    const ip = getLocalIpAddress();
    const serviceType = MDNS_SERVICE_TYPE.replace(/^_/, '').replace(/\._tcp$/, '');

    service = responder.createService({
      name: 'SwarmRoom Hub',
      type: serviceType,
      port,
      txt: {
        version: '0.1.0',
        hub: 'true',
        url: `http://${ip}:${port}`,
      },
    });

    service.on('name-change', (newName: string) => {
      console.log(`[mdns] Service name changed to "${newName}" (conflict resolution)`);
    });

    await service.advertise();
    console.log(`[mdns] Advertising ${MDNS_SERVICE_TYPE} on port ${port} (url: http://${ip}:${port})`);
  } catch (error) {
    console.warn('[mdns] Failed to start mDNS advertisement — continuing without mDNS:', error);
    responder = null;
    service = null;
  }
}

export async function stopMdns(): Promise<void> {
  try {
    if (service) {
      await service.end();
      service = null;
    }
    if (responder) {
      await responder.shutdown();
      responder = null;
    }
    console.log('[mdns] Stopped mDNS advertisement');
  } catch (error) {
    console.warn('[mdns] Error stopping mDNS:', error);
  }
}
