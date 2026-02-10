import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/error-handler.js';
import { health } from './routes/health.js';
import { agentsRoute } from './routes/agents.js';
import { messagesRoute } from './routes/messages.js';
import { teamsRoute } from './routes/teams.js';
import { projectsRoute } from './routes/projects.js';
import { wellKnown } from './routes/well-known.js';
import { mcpRoute } from './mcp/transport.js';

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

app.get('/', (c) => {
  return c.json({
    name: 'SwarmRoom Hub',
    version: '0.1.0',
    description: 'Multi-agent coordination hub for local AI agents',
  });
});

export { app };
