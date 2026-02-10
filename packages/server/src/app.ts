import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/error-handler.js';
import { health } from './routes/health.js';
import { agentsRoute } from './routes/agents.js';
import { messagesRoute } from './routes/messages.js';
import { wellKnown } from './routes/well-known.js';

const app = new Hono();

app.use('*', corsMiddleware);
app.onError(errorHandler);
app.route('/', health);
app.route('/', wellKnown);
app.route('/api/agents', agentsRoute);
app.route('/api/messages', messagesRoute);

app.get('/', (c) => {
  return c.json({
    name: 'SwarmRoom Hub',
    version: '0.1.0',
    description: 'Multi-agent coordination hub for local AI agents',
  });
});

export { app };
