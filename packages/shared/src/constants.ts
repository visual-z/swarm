export const MDNS_SERVICE_TYPE = '_swarmroom._tcp';
export const DEFAULT_PORT = 3000;
export const HEARTBEAT_INTERVAL_MS = 30_000;
export const STALE_TIMEOUT_MS = 90_000;
export const MAX_MESSAGE_SIZE_BYTES = 1_048_576; // 1MB
export const WS_RECONNECT_DELAY_MS = 3_000;

export const MCP_TOOL_NAMES = {
  LIST_AGENTS: 'list_agents',
  GET_AGENT_INFO: 'get_agent_info',
  SEND_MESSAGE: 'send_message',
  GET_MESSAGES: 'get_messages',
  QUERY_AGENT: 'query_agent',
  LIST_TEAMS: 'list_teams',
  LIST_PROJECTS: 'list_projects',
} as const;
