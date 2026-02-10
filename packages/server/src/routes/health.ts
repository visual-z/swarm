import { Hono } from 'hono';

const health = new Hono();

const startTime = Date.now();

health.get('/health', (c) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return c.json({
    status: 'ok',
    version: '0.1.0',
    uptime: uptimeSeconds,
    agentCount: 0,
  });
});

export { health };
