import WebSocket from 'ws';
import { spawn } from 'node:child_process';
import {
  WS_RECONNECT_DELAY_MS,
  DAEMON_SPAWN_COOLDOWN_MS,
  DAEMON_SPAWN_TIMEOUT_MS,
} from '@swarmroom/shared';
import type { WSMessage, DaemonConfig, MessageUndeliveredPayload } from '@swarmroom/shared';
import { loadDaemonConfig } from './config.js';
import { isAgentProcessRunning } from './process-detector.js';

const MAX_RECONNECT_DELAY_MS = 30_000;

export interface DaemonWatcherOptions {
  hubUrl?: string;            // Override config's hubUrl
  workdir?: string;           // Default workdir for spawned processes (defaults to process.cwd())
  verbose?: boolean;          // Enable verbose logging
}

export class DaemonWatcher {
  private readonly hubUrl: string;
  private readonly workdir: string;
  private readonly verbose: boolean;
  private config: DaemonConfig;

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private intentionalDisconnect = false;

  private spawnCooldowns = new Map<string, number>();
  private spawnTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(options: DaemonWatcherOptions = {}) {
    this.config = loadDaemonConfig();
    this.hubUrl = options.hubUrl ?? this.config.hubUrl;
    this.workdir = options.workdir ?? process.cwd();
    this.verbose = options.verbose ?? false;
  }

  /** Start the daemon — connect to Hub WebSocket */
  start(): void {
    this.intentionalDisconnect = false;
    this.log('Starting daemon watcher...');
    this.log(`Hub URL: ${this.hubUrl}`);
    this.log(`Working directory: ${this.workdir}`);
    this.connectWebSocket();
  }

  /** Stop the daemon — disconnect and clean up */
  stop(): void {
    this.intentionalDisconnect = true;
    this.clearReconnectTimer();
    this.clearAllSpawnTimeouts();

    if (this.ws) {
      this.ws.close(1000, 'daemon stopping');
      this.ws = null;
    }

    this.log('Daemon watcher stopped.');
  }

  /** Reload config from disk */
  reloadConfig(): void {
    this.config = loadDaemonConfig();
    this.log('Config reloaded.');
  }

  private connectWebSocket(): void {
    const wsUrl = this.hubUrl.replace(/^http/, 'ws') + '/ws';
    this.log(`Connecting to ${wsUrl}...`);

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      this.reconnectAttempts = 0;
      this.sendRegister();
      this.log('Connected to Hub. Registered as daemon.');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.handleMessage(String(data));
    });

    this.ws.on('close', () => {
      if (!this.intentionalDisconnect) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (err: Error) => {
      this.log(`WebSocket error: ${err.message}`);
      // Error is followed by close event, which handles reconnection
    });
  }

  private sendRegister(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const msg: WSMessage = {
      type: 'register',
      payload: { clientType: 'daemon' },
      timestamp: new Date().toISOString(),
    };
    this.ws.send(JSON.stringify(msg));
  }

  private handleMessage(raw: string): void {
    let msg: WSMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'message_undelivered': {
        const payload = msg.payload as MessageUndeliveredPayload;
        this.handleUndeliveredMessage(payload);
        break;
      }
      case 'heartbeat': {
        // Respond to server pings
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
        this.log('Registration confirmed by hub.');
        break;
      default:
        // Ignore other message types (agent_online, agent_offline, etc.)
        break;
    }
  }

  private handleUndeliveredMessage(payload: MessageUndeliveredPayload): void {
    const { recipientAgentId, recipientAgentName, message } = payload;
    this.log(`Undelivered message for agent "${recipientAgentName}" (${recipientAgentId})`);

    // Find which agent config matches this agent name
    const agentType = this.findAgentType(recipientAgentName);
    if (!agentType) {
      this.log(`No config found for agent "${recipientAgentName}", ignoring.`);
      return;
    }

    const agentConfig = this.config.agents[agentType];
    if (!agentConfig) {
      this.log(`No agent config for type "${agentType}", ignoring.`);
      return;
    }

    // Check if headless wakeup is enabled
    if (!agentConfig.headlessWakeup) {
      this.log(`Headless wakeup disabled for "${agentType}", message stored in DB for later retrieval.`);
      return;
    }

    // Check if the agent process is already running
    if (isAgentProcessRunning(agentType)) {
      this.log(`Agent "${agentType}" process is running but not connected. Message stored in DB.`);
      return;
    }

    // Check cooldown
    if (this.isOnCooldown(agentType)) {
      this.log(`Agent "${agentType}" is on spawn cooldown, skipping.`);
      return;
    }

    // Spawn headless process
    this.spawnHeadless(agentType, agentConfig, message);
  }

  /**
   * Find which agent type (config key) matches the given agent name.
   * The agent name from the hub may be "claude-code", "opencode", "gemini-cli",
   * or a custom name. We try exact match first, then partial matching.
   */
  private findAgentType(agentName: string): string | null {
    const normalized = agentName.toLowerCase();

    // Exact match against config keys
    if (this.config.agents[normalized]) {
      return normalized;
    }

    // Check if the agent name contains any known agent type
    for (const key of Object.keys(this.config.agents)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return key;
      }
    }

    return null;
  }

  private isOnCooldown(agentType: string): boolean {
    const lastSpawn = this.spawnCooldowns.get(agentType);
    if (!lastSpawn) return false;
    return Date.now() - lastSpawn < DAEMON_SPAWN_COOLDOWN_MS;
  }

  private spawnHeadless(
    agentType: string,
    agentConfig: DaemonConfig['agents'][string],
    message: unknown,
  ): void {
    this.spawnCooldowns.set(agentType, Date.now());

    const messageContent = typeof message === 'object' && message !== null
      ? (message as Record<string, unknown>).content ?? JSON.stringify(message)
      : String(message);

    const args = agentConfig.args.map((arg: string) =>
      arg.replace('{message}', String(messageContent)),
    );

    const workdir = agentConfig.workdir ?? this.workdir;

    const fullCommand = `${agentConfig.command} ${args.join(' ')}`;
    this.log(`Spawning headless: ${fullCommand}`);
    this.log(`  Working directory: ${workdir}`);

    const timeoutTimer = setTimeout(() => {
      this.log(`[${agentType}] Spawn timeout after ${DAEMON_SPAWN_TIMEOUT_MS / 1000}s - process may still be running`);
      this.spawnTimeouts.delete(agentType);
    }, DAEMON_SPAWN_TIMEOUT_MS);

    this.spawnTimeouts.set(agentType, timeoutTimer);

    try {
      const child = spawn(agentConfig.command, args, {
        cwd: workdir,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      let stderrBuffer = '';

      child.stdout?.on('data', (data: Buffer) => {
        this.log(`[${agentType}:stdout] ${data.toString().trim()}`);
      });

      child.stderr?.on('data', (data: Buffer) => {
        const output = data.toString().trim();
        stderrBuffer += output + '\n';
        this.log(`[${agentType}:stderr] ${output}`);
      });

      child.on('exit', (code: number | null) => {
        const timer = this.spawnTimeouts.get(agentType);
        if (timer) {
          clearTimeout(timer);
          this.spawnTimeouts.delete(agentType);
        }

        if (code !== 0) {
          this.log(`[${agentType}] Process exited with non-zero code ${code}`);
          if (stderrBuffer.trim()) {
            this.log(`[${agentType}] stderr output:\n${stderrBuffer.trim()}`);
          }
        } else {
          this.log(`[${agentType}] Process exited with code ${code}`);
        }
      });

      child.on('error', (err: Error) => {
        this.log(`[${agentType}] Failed to spawn: ${err.message}`);
        const timer = this.spawnTimeouts.get(agentType);
        if (timer) {
          clearTimeout(timer);
          this.spawnTimeouts.delete(agentType);
        }
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.log(`Failed to spawn ${agentType}: ${errMsg}`);
      const timer = this.spawnTimeouts.get(agentType);
      if (timer) {
        clearTimeout(timer);
        this.spawnTimeouts.delete(agentType);
      }
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    const delay = Math.min(
      WS_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts++;

    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

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

  private clearAllSpawnTimeouts(): void {
    for (const timer of this.spawnTimeouts.values()) {
      clearTimeout(timer);
    }
    this.spawnTimeouts.clear();
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[daemon ${timestamp}] ${message}`);
  }
}
