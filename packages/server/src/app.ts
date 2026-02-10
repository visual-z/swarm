import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/error-handler.js';
import { health } from './routes/health.js';
import { agentsRoute } from './routes/agents.js';

const app = new Hono();

app.use('*', corsMiddleware);
app.onError(errorHandler);
app.route('/', health);
app.route('/api/agents', agentsRoute);

app.get('/', (c) => {
  return c.json({
    name: 'SwarmRoom Hub',
    version: '0.1.0',
    description: 'Multi-agent coordination hub for local AI agents',
  });
});

export { app };
