export type {
  Agent,
  AgentStatus,
  AgentCard,
  Skill,
  RegisterAgentRequest,
  HeartbeatRequest,
  Message,
  MessageType,
  SenderType,
  SendMessageRequest,
  WSMessage,
  WSMessageType,
  ApiResponse,
} from '@swarmroom/shared';

export interface SwarmRoomClientOptions {
  /** Hub URL, e.g. 'http://localhost:3000' */
  hubUrl: string;
  /** Agent name for registration */
  name: string;
  /** Optional agent card metadata */
  agentCard?: {
    description?: string;
    skills?: Array<{ id: string; name: string; description: string; tags: string[] }>;
  };
  /** Send heartbeats automatically (default: true) */
  autoHeartbeat?: boolean;
  /** Reconnect WebSocket on close (default: true) */
  autoReconnect?: boolean;
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
  /** Initial reconnect delay in ms (default: 3000) */
  reconnectDelay?: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type MessageHandler = (message: IncomingMessage) => void;
export type QueryHandler = (query: IncomingMessage) => Promise<string>;
export type StatusChangeHandler = (status: ConnectionStatus) => void;

export interface IncomingMessage {
  id: string;
  from: string;
  to: string;
  senderType: string;
  content: string;
  type: string;
  replyTo?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface SendMessageOptions {
  to: string;
  content: string;
  type?: string;
}
