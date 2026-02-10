import WebSocket from 'ws';
import {
  HEARTBEAT_INTERVAL_MS,
  WS_RECONNECT_DELAY_MS,
} from '@swarmroom/shared';
import type { Agent, WSMessage } from '@swarmroom/shared';
import type {
  SwarmRoomClientOptions,
  ConnectionStatus,
  MessageHandler,
  QueryHandler,
  StatusChangeHandler,
  IncomingMessage,
  SendMessageOptions,
} from './types.js';

const MAX_RECONNECT_DELAY_MS = 30_000;

export class SwarmRoomClient {
  private readonly hubUrl: string;
  private readonly _agentName: string;
  private readonly agentCardPayload?: SwarmRoomClientOptions['agentCard'];
  private readonly autoHeartbeat: boolean;
  private readonly autoReconnect: boolean;
  private readonly heartbeatInterval: number;
  private readonly reconnectDelay: number;

  private ws: WebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private intentionalDisconnect = false;

  private _agentId: string | null = null;
  private _status: ConnectionStatus = 'disconnected';

  private messageHandlers: MessageHandler[] = [];
  private queryHandlers: QueryHandler[] = [];
  private statusChangeHandlers: StatusChangeHandler[] = [];

  get isConnected(): boolean {
    return this._status === 'connected';
  }

  get agentId(): string | null {
    return this._agentId;
  }

  get agentName(): string {
    return this._agentName;
  }

  constructor(options: SwarmRoomClientOptions) {
    this.hubUrl = options.hubUrl.replace(/\/+$/, '');
    this._agentName = options.name;
    this.agentCardPayload = options.agentCard;
    this.autoHeartbeat = options.autoHeartbeat ?? true;
    this.autoReconnect = options.autoReconnect ?? true;
    this.heartbeatInterval = options.heartbeatInterval ?? HEARTBEAT_INTERVAL_MS;
    this.reconnectDelay = options.reconnectDelay ?? WS_RECONNECT_DELAY_MS;
  }

  async connect(): Promise<void> {
    this.intentionalDisconnect = false;
    this.setStatus('connecting');

    const agent = await this.registerAgent();
    this._agentId = agent.id;

    this.connectWebSocket();
    this.startHeartbeat();
  }

  async disconnect(): Promise<void> {
    this.intentionalDisconnect = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this._agentId) {
      try {
        await this.httpRequest('DELETE', `/api/agents/${this._agentId}`);
      } catch {
      }
    }

    if (this.ws) {
      this.ws.close(1000, 'client disconnect');
      this.ws = null;
    }

    this._agentId = null;
    this.setStatus('disconnected');
  }

  async sendMessage(opts: SendMessageOptions): Promise<unknown> {
    if (!this._agentId) {
      throw new Error('Client not connected. Call connect() first.');
    }

    const body = {
      from: this._agentId,
      to: opts.to,
      senderType: 'agent' as const,
      content: opts.content,
      type: opts.type ?? 'notification',
    };

    return this.httpRequest('POST', '/api/messages', body);
  }

  async listAgents(): Promise<Agent[]> {
    const response = await this.httpRequest<{ success: boolean; data: Agent[] }>('GET', '/api/agents');
    return response.data;
  }

  async getAgent(id: string): Promise<Agent> {
    const response = await this.httpRequest<{ success: boolean; data: Agent }>('GET', `/api/agents/${id}`);
    return response.data;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  onQuery(handler: QueryHandler): () => void {
    this.queryHandlers.push(handler);
    return () => {
      this.queryHandlers = this.queryHandlers.filter((h) => h !== handler);
    };
  }

  onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusChangeHandlers.push(handler);
    return () => {
      this.statusChangeHandlers = this.statusChangeHandlers.filter((h) => h !== handler);
    };
  }

  private async registerAgent(): Promise<Agent> {
    const body: Record<string, unknown> = { name: this._agentName };
    if (this.agentCardPayload) {
      body.agentCard = this.agentCardPayload;
    }

    const response = await this.httpRequest<{ success: boolean; data: Agent }>('POST', '/api/agents', body);
    return response.data;
  }

  private connectWebSocket(): void {
    const wsUrl = this.hubUrl.replace(/^http/, 'ws') + '/ws';
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      this.reconnectAttempts = 0;
      this.sendWsRegister();
      this.setStatus('connected');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.handleWsMessage(String(data));
    });

    this.ws.on('close', () => {
      if (!this.intentionalDisconnect && this.autoReconnect) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', () => {
      // Error is followed by close event, which handles reconnection
    });
  }

  private sendWsRegister(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this._agentId) return;

    const msg: WSMessage = {
      type: 'register',
      payload: { agentId: this._agentId },
      timestamp: new Date().toISOString(),
    };
    this.ws.send(JSON.stringify(msg));
  }

  private handleWsMessage(raw: string): void {
    let msg: WSMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'message': {
        const message = msg.payload as IncomingMessage;
        this.dispatchMessage(message);
        break;
      }
      case 'heartbeat': {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const pong: WSMessage = {
            type: 'heartbeat',
            payload: { pong: true },
            timestamp: new Date().toISOString(),
          };
          this.ws.send(JSON.stringify(pong));
        }
        break;
      }
      case 'register':
      case 'agent_online':
      case 'agent_offline':
      case 'error':
        break;
    }
  }

  private dispatchMessage(message: IncomingMessage): void {
    if (message.type === 'query' && this.queryHandlers.length > 0) {
      const handler = this.queryHandlers[0];
      handler(message)
        .then((responseContent) => {
          this.sendMessage({
            to: message.from,
            content: responseContent,
            type: 'response',
          }).catch(() => {});
        })
        .catch(() => {});
      return;
    }

    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }

  private startHeartbeat(): void {
    if (!this.autoHeartbeat) return;
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(async () => {
      if (!this._agentId) return;
      try {
        await this.httpRequest('POST', `/api/agents/${this._agentId}/heartbeat`, {});
      } catch {
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.setStatus('reconnecting');

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this._status === status) return;
    this._status = status;
    for (const handler of this.statusChangeHandlers) {
      handler(status);
    }
  }

  private async httpRequest<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.hubUrl}${path}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorBody = (await response.json()) as { error?: { message?: string } };
        if (errorBody.error?.message) {
          errorMessage = errorBody.error.message;
        }
      } catch {
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  }
}
