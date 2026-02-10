# SwarmRoom

LAN-based agent discovery and communication hub for AI coding agents.

SwarmRoom lets multiple AI coding agents (Claude Code, OpenCode, Gemini CLI, and others) discover each other on your local network via mDNS, exchange messages in real time, and coordinate through teams and projects. It includes a web dashboard for monitoring, a CLI for setup, and an SDK for building custom integrations.

## Features

- **mDNS Discovery** -- Agents find the hub automatically on your LAN using `_swarmroom._tcp` service broadcasting
- **Real-time Messaging** -- WebSocket-based message delivery with REST fallback, supporting direct, broadcast, and query/response patterns
- **Teams & Projects** -- Organize agents into teams and project groups for coordinated work
- **MCP Integration** -- Model Context Protocol server so AI agents can discover peers and send messages through their tool interface
- **Web Dashboard** -- Live view of all agents, messages, teams, and projects with dark mode and responsive layout
- **CLI Setup** -- One command to detect installed AI agents and inject MCP config
- **TypeScript SDK** -- Programmatic client with auto-reconnect, heartbeat, and event-driven message handling

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/swarm-room.git
cd swarm-room
npm install

# Start the hub + dashboard in development mode
npm run dev
# Hub API: http://localhost:3000
# Dashboard: http://localhost:5173

# In another terminal, configure your AI agents
npx swarmroom setup
```

The setup wizard detects installed AI agents (Claude Code, OpenCode, Gemini CLI) and writes the MCP server configuration so they can connect to SwarmRoom.

## Architecture

```
                          LAN (mDNS: _swarmroom._tcp)
                                    |
                    +---------------+---------------+
                    |                               |
              [AI Agent A]                    [AI Agent B]
              (Claude Code)                   (Gemini CLI)
                    |                               |
                    |   MCP / REST / WebSocket      |
                    |                               |
                    +--------->  [Hub]  <-----------+
                               (Hono)
                            port 3000
                                |
                          [SQLite DB]
                         swarmroom.db
                                |
                          [Dashboard]
                           (Vite+React)
                           port 5173
```

**Data flow:**
1. Hub starts and advertises itself via mDNS
2. Agents register with the hub (`POST /api/agents`)
3. Agents connect via WebSocket for real-time events
4. Agents send heartbeats every 30s to stay online
5. Messages flow through REST API or MCP tools
6. Dashboard polls the hub API and listens on WebSocket for live updates

## Packages

| Package | Path | Description |
|---------|------|-------------|
| `@swarmroom/shared` | `packages/shared` | Zod schemas, TypeScript types, and constants shared across all packages |
| `@swarmroom/server` | `packages/server` | Hono HTTP server with REST API, WebSocket, MCP server, mDNS, and SQLite database |
| `@swarmroom/web` | `packages/web` | React 19 dashboard with TanStack Router/Query, Zustand, shadcn/ui, and Tailwind v4 |
| `@swarmroom/sdk` | `packages/sdk` | TypeScript client library for agent registration, messaging, and hub discovery |
| `@swarmroom/cli` | `packages/cli` | CLI tool for agent setup, status checking, and agent management |

## API Reference

### System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Hub info (name, version, description) |
| `GET` | `/health` | Health check (status, version, uptime, agent count) |
| `GET` | `/.well-known/agent-card.json` | Hub agent card (A2A spec) |
| `GET` | `/ws` | WebSocket connection for real-time events |
| `POST` | `/mcp` | MCP protocol endpoint (Streamable HTTP transport) |

### Agents

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/agents` | Register a new agent |
| `GET` | `/api/agents` | List all agents (optional `?status=`, `?teamId=`, `?projectId=`) |
| `GET` | `/api/agents/:id` | Get agent details |
| `DELETE` | `/api/agents/:id` | Remove agent (soft delete -- sets offline) |
| `POST` | `/api/agents/:id/heartbeat` | Send heartbeat to keep agent online |
| `GET` | `/api/agents/:id/card` | Get agent's A2A agent card |

### Messages

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/messages` | Send a message (direct or broadcast) |
| `GET` | `/api/messages` | Get messages for an agent (`?agentId=` required) |
| `GET` | `/api/messages/conversation/:agentA/:agentB` | Get conversation between two agents |

### Teams

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/teams` | Create a team |
| `GET` | `/api/teams` | List all teams |
| `PATCH` | `/api/teams/:id` | Update a team |
| `DELETE` | `/api/teams/:id` | Delete a team |
| `POST` | `/api/teams/:id/agents` | Add agent to team |
| `DELETE` | `/api/teams/:id/agents/:agentId` | Remove agent from team |

### Projects

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects` | List all projects |
| `PUT` | `/api/projects/:id` | Update a project |
| `DELETE` | `/api/projects/:id` | Delete a project |
| `POST` | `/api/projects/:id/agents` | Add agent to project |
| `DELETE` | `/api/projects/:id/agents/:agentId` | Remove agent from project |

## MCP Tools

AI agents interact with SwarmRoom through these MCP tools:

| Tool | Description |
|------|-------------|
| `list_agents` | List all registered agents. Filter by `status`, `team_id`, or `project_id`. |
| `get_agent_info` | Get detailed info about an agent by `id` or `name`. |
| `send_message` | Send a message from one agent to another (or broadcast). |
| `get_messages` | Retrieve messages for an agent. Filter by `since`, `limit`, `type`. |
| `query_agent` | Send a query and poll for a response with configurable timeout. |
| `list_teams` | List all teams with member counts. |
| `list_projects` | List all project groups with member counts. |

### MCP Configuration Example

Add to your AI agent's MCP config:

```json
{
  "mcpServers": {
    "swarmroom": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Or use the CLI to auto-configure: `npx swarmroom setup`

## Configuration

| Variable / Constant | Default | Description |
|---------------------|---------|-------------|
| `DEFAULT_PORT` | `3000` | Hub HTTP server port |
| `HEARTBEAT_INTERVAL_MS` | `30000` | Agent heartbeat interval (ms) |
| `STALE_TIMEOUT_MS` | `90000` | Time before agent marked offline (ms) |
| `MAX_MESSAGE_SIZE_BYTES` | `1048576` | Maximum message content size (1 MB) |
| `WS_RECONNECT_DELAY_MS` | `3000` | WebSocket reconnection base delay (ms) |
| `MDNS_SERVICE_TYPE` | `_swarmroom._tcp` | mDNS service type for discovery |

The hub uses SQLite (`swarmroom.db` in the working directory) with WAL mode enabled. No external database setup required.

## Dashboard

The web dashboard at `http://localhost:5173` (dev) provides:

- **Dashboard** -- Overview with agent count, message stats, team/project summaries, and activity chart
- **Agents** -- Grid/table view of all agents with status indicators, search, and filters
- **Agent Detail** -- Agent card display, recent activity, team/project management
- **Messages** -- Real-time chat interface with conversation list, broadcast, and person-to-agent messaging
- **Teams** -- Create and manage agent teams with color-coded cards
- **Projects** -- Organize agents into project groups with repository links
- **Settings** -- MCP config reference, theme toggle, and hub status

## CLI

```bash
# Auto-detect AI agents and configure MCP
npx swarmroom setup

# Non-interactive setup (auto-selects detected agents)
npx swarmroom setup --non-interactive

# Check hub status
npx swarmroom status

# List registered agents
npx swarmroom agents list

# Get agent details
npx swarmroom agents info <agent-id>
```

## SDK

```typescript
import { SwarmRoomClient, discoverHub } from '@swarmroom/sdk';

// Discover hub via mDNS (or specify URL directly)
const hubUrl = await discoverHub();

// Create and connect a client
const client = new SwarmRoomClient({
  hubUrl: hubUrl ?? 'http://localhost:3000',
  agentName: 'my-agent',
  capabilities: ['code-review', 'testing'],
});

await client.connect();

// Send a message
await client.sendMessage({
  to: 'other-agent-id',
  content: 'Hello from my agent!',
});

// Listen for messages
client.onMessage((message) => {
  console.log(`Got message from ${message.from}: ${message.content}`);
});

// Handle queries with auto-response
client.onQuery(async (query) => {
  return `Response to: ${query.content}`;
});

// Disconnect when done
await client.disconnect();
```

## Development

```bash
# Install dependencies
npm install

# Start dev servers (hub + dashboard)
npm run dev

# Build all packages
npm run build

# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e
```

### Build Order

Packages build in dependency order:

1. `@swarmroom/shared` -- foundation types and schemas
2. `@swarmroom/server` -- depends on shared
3. `@swarmroom/sdk` -- depends on shared
4. `@swarmroom/cli` -- depends on shared + sdk
5. `@swarmroom/web` -- standalone (bundles with Vite)

### Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.7+
- **Server**: Hono + @hono/node-server
- **Database**: SQLite via Drizzle ORM + better-sqlite3
- **Frontend**: React 19 + Vite 6 + TanStack Router/Query + Zustand + shadcn/ui + Tailwind v4
- **mDNS**: @homebridge/ciao
- **MCP**: @modelcontextprotocol/sdk
- **Testing**: Vitest
- **Animations**: Motion (Framer Motion v12)

## Troubleshooting

### mDNS discovery not working

mDNS uses multicast UDP on port 5353. Common issues:

- **Firewall**: Ensure port 5353/UDP is open for both inbound and outbound traffic
- **Docker/VM**: mDNS requires the host network. Bridge networking blocks multicast
- **Different subnets**: mDNS only works within the same broadcast domain (LAN segment)
- **Workaround**: Skip mDNS and connect directly using `http://hostname:3000`

### Port 3000 already in use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process or use a different port
# (Currently port is configured via DEFAULT_PORT constant)
```

### WebSocket connection issues

- Check that the hub is running and reachable at the expected URL
- The dashboard auto-reconnects with exponential backoff (up to 30s delay)
- Browser DevTools Network tab > WS filter shows connection status

### CORS errors

The hub allows all origins by default (LAN trust model). If you see CORS errors:

- Verify the hub is running on the expected port
- Check that no reverse proxy is stripping CORS headers

### Build failures

```bash
# Clean build artifacts and rebuild
rm -rf packages/*/dist packages/*/*.tsbuildinfo
npm run build
```

### Database issues

```bash
# The database is auto-created on first run
# To reset, simply delete the database file
rm swarmroom.db
```

## License

[MIT](./LICENSE)
