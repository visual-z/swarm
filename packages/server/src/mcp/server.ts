import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { MCP_TOOL_NAMES } from '@swarmroom/shared';
import {
  listAgents,
  getAgentById,
} from '../services/agent-service.js';
import {
  createMessage,
  getMessagesForAgent,
} from '../services/message-service.js';
import { listTeams } from '../services/team-service.js';
import { listProjects } from '../services/project-service.js';

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export const mcpServer = new McpServer({
  name: 'swarmroom',
  version: '0.1.0',
});

// ─── list_agents ─────────────────────────────────────────────────────────────

mcpServer.tool(
  MCP_TOOL_NAMES.LIST_AGENTS,
  'List all agents registered in SwarmRoom. Optionally filter by status or team.',
  {
    status: z.string().optional().describe('Filter by agent status (online, offline)'),
    team_id: z.string().optional().describe('Filter by team ID'),
    project_id: z.string().optional().describe('Filter by project ID'),
  },
  async ({ status, team_id, project_id }) => {
    const agents = listAgents({
      status: status ?? undefined,
      teamId: team_id ?? undefined,
      projectId: project_id ?? undefined,
    });
    return textResult(agents);
  },
);

// ─── get_agent_info ──────────────────────────────────────────────────────────

mcpServer.tool(
  MCP_TOOL_NAMES.GET_AGENT_INFO,
  'Get detailed information about a specific agent by ID or name.',
  {
    id: z.string().optional().describe('Agent UUID'),
    name: z.string().optional().describe('Agent name (exact match)'),
  },
  async ({ id, name }) => {
    if (!id && !name) {
      return textResult({ error: 'Provide either id or name' });
    }

    if (id) {
      const agent = getAgentById(id);
      if (!agent) {
        return textResult({ error: `Agent not found: ${id}` });
      }
      return textResult(agent);
    }

    const agents = listAgents();
    const match = agents.find((a) => a.name === name);
    if (!match) {
      return textResult({ error: `Agent not found with name: ${name}` });
    }
    const agent = getAgentById(match.id);
    return textResult(agent);
  },
);

// ─── send_message ────────────────────────────────────────────────────────────

mcpServer.tool(
  MCP_TOOL_NAMES.SEND_MESSAGE,
  'Send a message from one agent to another.',
  {
    from: z.string().describe('Sender agent ID'),
    to: z.string().describe('Recipient agent ID or "broadcast"'),
    content: z.string().describe('Message content'),
    type: z
      .enum(['notification', 'query', 'response', 'broadcast'])
      .optional()
      .describe('Message type (default: notification)'),
    reply_to: z.string().optional().describe('ID of message being replied to'),
    metadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Optional metadata object'),
  },
  async ({ from, to, content, type, reply_to, metadata }) => {
    try {
      const result = createMessage({
        from,
        to,
        senderType: 'agent',
        content,
        type: type ?? 'notification',
        replyTo: reply_to ?? undefined,
        metadata: metadata ?? undefined,
      });
      return textResult(result);
    } catch (err) {
      return textResult({ error: (err as Error).message });
    }
  },
);

// ─── get_messages ────────────────────────────────────────────────────────────

mcpServer.tool(
  MCP_TOOL_NAMES.GET_MESSAGES,
  'Get messages for a specific agent.',
  {
    agent_id: z.string().describe('Agent ID to get messages for'),
    since: z
      .string()
      .optional()
      .describe('Timestamp (ms since epoch) — only return messages after this time'),
    limit: z.number().optional().describe('Max number of messages to return (default 50)'),
    type: z
      .enum(['notification', 'query', 'response', 'broadcast'])
      .optional()
      .describe('Filter by message type'),
  },
  async ({ agent_id, since, limit, type }) => {
    const messages = getMessagesForAgent(agent_id, {
      since: since ?? undefined,
      limit: limit ?? undefined,
      type: type ?? undefined,
    });
    return textResult(messages);
  },
);

// ─── query_agent ─────────────────────────────────────────────────────────────

mcpServer.tool(
  MCP_TOOL_NAMES.QUERY_AGENT,
  'Send a query message to an agent and poll for a response. Returns the reply or times out.',
  {
    from: z.string().describe('Sender agent ID'),
    to: z.string().describe('Target agent ID to query'),
    content: z.string().describe('Query content'),
    timeout_seconds: z
      .number()
      .optional()
      .describe('How long to wait for a reply in seconds (default 30)'),
  },
  async ({ from, to, content, timeout_seconds }) => {
    try {
      const queryMsg = createMessage({
        from,
        to,
        senderType: 'agent',
        content,
        type: 'query',
      });

      const sentMsg = Array.isArray(queryMsg) ? queryMsg[0] : queryMsg;
      if (!sentMsg) {
        return textResult({ error: 'Failed to send query message' });
      }

      const timeout = (timeout_seconds ?? 30) * 1000;
      const pollInterval = 500;
      const deadline = Date.now() + timeout;

      while (Date.now() < deadline) {
        const replies = getMessagesForAgent(from, { type: 'response' });
        const reply = replies.find((m) => m.replyTo === sentMsg.id);
        if (reply) {
          return textResult({ query: sentMsg, reply });
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      return textResult({
        query: sentMsg,
        reply: null,
        error: `No response received within ${timeout_seconds ?? 30} seconds`,
      });
    } catch (err) {
      return textResult({ error: (err as Error).message });
    }
  },
);

// ─── list_teams ──────────────────────────────────────────────────────────────

mcpServer.tool(
  MCP_TOOL_NAMES.LIST_TEAMS,
  'List all teams with member counts.',
  {},
  async () => {
    const teams = listTeams();
    return textResult(teams);
  },
);

// ─── list_projects ───────────────────────────────────────────────────────────

mcpServer.tool(
  MCP_TOOL_NAMES.LIST_PROJECTS,
  'List all project groups with member counts.',
  {},
  async () => {
    const projects = listProjects();
    return textResult(projects);
  },
);
