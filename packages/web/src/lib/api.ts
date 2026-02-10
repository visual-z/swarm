export const API_BASE_URL = "/api";
export const WS_BASE_URL = "/ws";
export const MCP_BASE_URL = "/mcp";

// ── Types (mirrored from @swarmroom/shared to avoid module resolution issues) ──

export type AgentStatus = "online" | "offline" | "busy" | "idle";

export interface Agent {
  id: string;
  name: string;
  displayName: string;
  url: string;
  status: AgentStatus;
  agentCard?: {
    name: string;
    description: string;
    version: string;
    url: string;
    skills: { id: string; name: string; description: string; tags: string[] }[];
    teams: string[];
    projectGroups: string[];
  };
  createdAt: string;
  lastHeartbeat?: string;
}

export type MessageType = "notification" | "query" | "response" | "broadcast";
export type SenderType = "agent" | "person";

export interface Message {
  id: string;
  from: string;
  to: string;
  senderType: SenderType;
  content: string;
  type: MessageType;
  replyTo?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  agentIds: string[];
  createdAt: string;
}

export interface ProjectGroup {
  id: string;
  name: string;
  description?: string;
  agentIds: string[];
  createdAt: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  uptime: number;
  agentCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

// ── Fetch helpers ──

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? "Unknown API error");
  }
  return json.data;
}

export async function fetchAgents(): Promise<Agent[]> {
  return apiFetch<Agent[]>("/agents");
}

export async function fetchTeams(): Promise<Team[]> {
  return apiFetch<Team[]>("/teams");
}

export async function fetchProjects(): Promise<ProjectGroup[]> {
  return apiFetch<ProjectGroup[]>("/projects");
}

export async function fetchMessages(
  agentId: string,
  limit = 10,
): Promise<Message[]> {
  return apiFetch<Message[]>(`/messages?agentId=${agentId}&limit=${limit}`);
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch("/health");
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}
