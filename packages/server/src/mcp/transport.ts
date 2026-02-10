import { Hono } from 'hono';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { mcpServer } from './server.js';

const transports = new Map<string, WebStandardStreamableHTTPServerTransport>();

function createSessionTransport(): WebStandardStreamableHTTPServerTransport {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (sessionId) => {
      transports.set(sessionId, transport);
    },
    onsessionclosed: (sessionId) => {
      transports.delete(sessionId);
    },
  });
  return transport;
}

export const mcpRoute = new Hono();

mcpRoute.all('/', async (c) => {
  const sessionId = c.req.header('mcp-session-id');

  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    return transport.handleRequest(c.req.raw);
  }

  const transport = createSessionTransport();
  await mcpServer.connect(transport);
  return transport.handleRequest(c.req.raw);
});
