import { Hono } from 'hono';
import { getAgentCount } from '../services/agent-service.js';

const health = new Hono();

const startTime = Date.now();

health.get('/health', (c) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return c.json({
    status: 'ok',
    version: '0.1.0',
    uptime: uptimeSeconds,
    agentCount: getAgentCount(),
  });
});

export { health };
