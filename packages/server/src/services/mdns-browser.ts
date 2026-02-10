import { createSocket, type Socket } from 'dgram';
import { MDNS_SERVICE_TYPE } from '@swarmroom/shared';

const MDNS_ADDRESS = '224.0.0.251';
const MDNS_PORT = 5353;

let socket: Socket | null = null;
let running = false;

export function startBrowsing(): void {
  if (process.env.SWARMROOM_DISABLE_MDNS === 'true') {
    return;
  }

  try {
    socket = createSocket({ type: 'udp4', reuseAddr: true });

    socket.on('message', (msg) => {
      const content = msg.toString('utf8');
      if (content.includes(MDNS_SERVICE_TYPE.replace(/^_/, '').replace(/\._tcp$/, ''))) {
        console.log(`[mdns-browser] Detected ${MDNS_SERVICE_TYPE} service activity on the network`);
      }
    });

    socket.on('error', (err) => {
      console.warn('[mdns-browser] Socket error:', err.message);
      stopBrowsing();
    });

    socket.bind(MDNS_PORT, () => {
      try {
        socket?.addMembership(MDNS_ADDRESS);
        running = true;
        console.log(`[mdns-browser] Browsing for ${MDNS_SERVICE_TYPE} services on the network`);
      } catch (error) {
        console.warn('[mdns-browser] Failed to join multicast group:', error);
        stopBrowsing();
      }
    });
  } catch (error) {
    console.warn('[mdns-browser] Failed to start browsing — continuing without mDNS browsing:', error);
    socket = null;
  }
}

export function stopBrowsing(): void {
  if (socket) {
    try {
      socket.close();
    } catch {
    }
    socket = null;
  }
  if (running) {
    running = false;
    console.log('[mdns-browser] Stopped browsing');
  }
}
