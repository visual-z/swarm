import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/error-handler.js';
import { health } from './routes/health.js';
import { agentsRoute } from './routes/agents.js';
import { messagesRoute } from './routes/messages.js';
import { teamsRoute } from './routes/teams.js';
import { projectsRoute } from './routes/projects.js';
import { wellKnown } from './routes/well-known.js';
import { mcpRoute } from './mcp/transport.js';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const webDistPath = resolve(__dirname, '../../web/dist');
const webDistExists = existsSync(webDistPath);

const app = new Hono();

app.use('*', corsMiddleware);
app.onError(errorHandler);
app.route('/', health);
app.route('/', wellKnown);
app.route('/api/agents', agentsRoute);
app.route('/api/messages', messagesRoute);
app.route('/api/teams', teamsRoute);
app.route('/api/projects', projectsRoute);
app.route('/mcp', mcpRoute);

if (webDistExists) {
  app.use('*', serveStatic({ root: webDistPath }));
  app.get('*', serveStatic({ root: webDistPath, path: '/index.html' }));
} else {
  app.get('/', (c) => {
    return c.json({
      name: 'SwarmRoom Hub',
      version: '0.1.0',
      description: 'Multi-agent coordination hub for local AI agents',
    });
  });
}

export { app };
