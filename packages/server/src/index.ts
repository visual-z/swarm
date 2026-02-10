import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { DEFAULT_PORT } from '@swarmroom/shared';
import { app } from './app.js';
import { registerWsRoute } from './routes/ws.js';
import {
  startHeartbeatChecker,
  stopHeartbeatChecker,
} from './services/heartbeat-service.js';
import { startMdns, stopMdns } from './services/mdns-service.js';
import { startBrowsing, stopBrowsing } from './services/mdns-browser.js';

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

registerWsRoute(app, upgradeWebSocket);

const port = Number(process.env.PORT) || DEFAULT_PORT;

console.log(`Starting SwarmRoom Hub on port ${port}...`);

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`SwarmRoom Hub listening on http://localhost:${info.port}`);
    startHeartbeatChecker();
    startMdns(info.port);
    startBrowsing();
  },
);

injectWebSocket(server);

async function shutdown(): Promise<void> {
  stopBrowsing();
  await stopMdns();
  stopHeartbeatChecker();
  process.exit(0);
}

process.on('SIGTERM', () => { shutdown(); });
process.on('SIGINT', () => { shutdown(); });
