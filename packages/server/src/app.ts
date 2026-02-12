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
import { skillsRoute } from './routes/skills.js';
import { wellKnown } from './routes/well-known.js';
import { mcpRoute } from './mcp/transport.js';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
// Try bundled location first (npm install), then monorepo location (dev)
const bundledWebPath = resolve(__dirname, 'public');
const monorepoWebPath = resolve(__dirname, '../../web/dist');
const webDistPath = existsSync(bundledWebPath) ? bundledWebPath : monorepoWebPath;
const webDistExists = existsSync(webDistPath) && !process.env.SWARMROOM_NO_WEB;

const app = new Hono();

app.use('*', corsMiddleware);
app.onError(errorHandler);
app.route('/', health);
app.route('/', wellKnown);
app.route('/api/agents', agentsRoute);
app.route('/api/messages', messagesRoute);
app.route('/api/teams', teamsRoute);
app.route('/api/projects', projectsRoute);
app.route('/api/skills', skillsRoute);
app.route('/mcp', mcpRoute);

if (webDistExists) {
  app.use(
    '*',
    serveStatic({
      root: '',
      rewriteRequestPath: (path) => `${webDistPath}${path}`,
    }),
  );
  app.get(
    '*',
    serveStatic({
      root: '',
      rewriteRequestPath: () => `${webDistPath}/index.html`,
    }),
  );
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
