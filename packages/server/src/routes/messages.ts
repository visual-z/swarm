import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { SendMessageRequestSchema } from '@swarmroom/shared';
import {
  createMessage,
  getMessagesForAgent,
  getMessageById,
  markMessageAsRead,
  getConversation,
  MessageSizeError,
  InvalidReplyError,
} from '../services/message-service.js';

const messagesRoute = new Hono();

messagesRoute.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = SendMessageRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPException(400, {
      message: `Invalid request body: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    });
  }

  try {
    const result = createMessage(parsed.data);
    return c.json({ success: true, data: result }, 201);
  } catch (err: unknown) {
    if (err instanceof MessageSizeError) {
      throw new HTTPException(400, { message: err.message });
    }
    if (err instanceof InvalidReplyError) {
      throw new HTTPException(400, { message: err.message });
    }
    throw err;
  }
});

messagesRoute.get('/', (c) => {
  const agentId = c.req.query('agentId');

  if (!agentId) {
    throw new HTTPException(400, { message: 'Query parameter "agentId" is required' });
  }

  const since = c.req.query('since');
  const limitParam = c.req.query('limit');
  const type = c.req.query('type');

  const limit = limitParam ? Number(limitParam) : 50;
  if (Number.isNaN(limit) || limit < 1) {
    throw new HTTPException(400, { message: 'Query parameter "limit" must be a positive integer' });
  }

  const result = getMessagesForAgent(agentId, { since: since ?? undefined, limit, type: type ?? undefined });
  return c.json({ success: true, data: result });
});

messagesRoute.get('/conversation/:agentA/:agentB', (c) => {
  const agentA = c.req.param('agentA');
  const agentB = c.req.param('agentB');

  const result = getConversation(agentA, agentB);
  return c.json({ success: true, data: result });
});

messagesRoute.get('/:id', (c) => {
  const id = c.req.param('id');
  const message = getMessageById(id);

  if (!message) {
    throw new HTTPException(404, { message: `Message "${id}" not found` });
  }

  return c.json({ success: true, data: message });
});

messagesRoute.patch('/:id/read', (c) => {
  const id = c.req.param('id');
  const message = markMessageAsRead(id);

  if (!message) {
    throw new HTTPException(404, { message: `Message "${id}" not found` });
  }

  return c.json({ success: true, data: message });
});

export { messagesRoute };
