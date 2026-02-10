import { z } from 'zod';
import {
  WSMessageTypeSchema,
  WSMessageSchema,
} from '../schemas/ws.js';

export type WSMessageType = z.infer<typeof WSMessageTypeSchema>;
export type WSMessage = z.infer<typeof WSMessageSchema>;

export {
  WSMessageTypeSchema,
  WSMessageSchema,
};
