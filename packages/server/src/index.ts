import { serve } from '@hono/node-server';
import { DEFAULT_PORT } from '@swarmroom/shared';
import { app } from './app.js';
import {
  startHeartbeatChecker,
  stopHeartbeatChecker,
} from './services/heartbeat-service.js';

const port = Number(process.env.PORT) || DEFAULT_PORT;

console.log(`Starting SwarmRoom Hub on port ${port}...`);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`SwarmRoom Hub listening on http://localhost:${info.port}`);
    startHeartbeatChecker();
  },
);

process.on('SIGTERM', () => {
  stopHeartbeatChecker();
  process.exit(0);
});

process.on('SIGINT', () => {
  stopHeartbeatChecker();
  process.exit(0);
});
