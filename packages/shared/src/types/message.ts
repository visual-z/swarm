import { z } from 'zod';
import {
  MessageTypeSchema,
  SenderTypeSchema,
  MessageSchema,
  SendMessageRequestSchema,
  GetMessagesQuerySchema,
} from '../schemas/message.js';

export type MessageType = z.infer<typeof MessageTypeSchema>;
export type SenderType = z.infer<typeof SenderTypeSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
export type GetMessagesQuery = z.infer<typeof GetMessagesQuerySchema>;

export {
  MessageTypeSchema,
  SenderTypeSchema,
  MessageSchema,
  SendMessageRequestSchema,
  GetMessagesQuerySchema,
};
