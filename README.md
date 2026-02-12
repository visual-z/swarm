# SwarmRoom

LAN-based discovery and communication hub for AI coding agents.

SwarmRoom enables AI coding agents (Claude Code, OpenCode, Gemini CLI, etc.) to automatically discover each other over LAN via mDNS, exchange messages in real-time, and collaborate through teams and projects. It includes a Web Dashboard for monitoring, a CLI for configuration, and an SDK for custom integrations.

## Quick Start

### Install via pnpm (Recommended)

```bash
# Install globally
pnpm add -g swarmroom

# Start SwarmRoom (Hub Service + Daemon)
swarmroom start

# Configure AI Agent MCP
swarmroom setup
```

You can also run it directly via `pnpm dlx`:

```bash
pnpm dlx swarmroom start
pnpm dlx swarmroom setup
```

### Install from Source

```bash
git clone https://github.com/visual-z/swarm-room.git
cd swarm-room
pnpm install
pnpm run build

# Start in development mode (Hub + Web Dashboard)
pnpm run dev
# Hub API: http://localhost:39187
# Dashboard: http://localhost:5173 (Vite dev server, proxies API to 39187)
```

After starting, run `pnpm dlx swarmroom setup` to auto-detect installed agents (Claude Code, OpenCode, Gemini CLI) and inject MCP configurations.

## Features

- **mDNS Auto-Discovery** — Agents broadcast via `_swarmroom._tcp` to find the Hub on the local network.
- **WebSocket Real-time Communication** — WebSocket-based delivery with REST fallback. Supports direct, broadcast, and request/reponse patterns.
- **Team & Project Management** — Organize agents into teams and projects for coordinated workflows.
- **MCP Integration** — Model Context Protocol server allowing agents to discover peers and send messages via tool interfaces.
- **Web Dashboard** — Real-time visualization of agents, messages, teams, and projects. Supports dark mode and responsive layouts.
- **CLI Configuration** — One-command detection and MCP injection for AI agents.
- **TypeScript SDK** — Robust client with auto-reconnect, heartbeats, and event-driven message handling.
- **🆕 Daemon** — Listens for undelivered messages and optionally wakes up offline agents.
- **🆕 One-Click Start** — `swarmroom start` launches both the Hub service and the Daemon.
- **🆕 Skills Support** — Extensible agent capabilities via skill discovery.

## Install

System requirements: Node.js 18+.

```bash
pnpm add -g swarmroom
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `swarmroom start` | Start Hub + Web Dashboard + Daemon |
| `swarmroom start --server-only` | Start Hub API + Daemon only (no dashboard) |
| `swarmroom start --daemon-only` | Start Daemon only |
| `swarmroom start --port <port>` | Specify Hub port (default: 39187) |
| `swarmroom start --verbose` | Enable verbose logging |
| `swarmroom setup` | Auto-detect and configure AI agents |
| `swarmroom setup --non-interactive` | Non-interactive setup (auto-select detected agents) |
| `swarmroom discover` | Monitor live mDNS discovery with `--timeout` option |
| `swarmroom status` | Check Hub status |
| `swarmroom agents list` | List all agents |
| `swarmroom agents info <id>` | View agent details |
| `swarmroom daemon start` | Start daemon (foreground) |
| `swarmroom daemon start --background` | Start daemon (background) |
| `swarmroom daemon stop` | Stop daemon |
| `swarmroom daemon status` | View daemon status |
| `swarmroom daemon config` | Configure daemon (interactive) |

## API Reference

### System
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Hub info (name, version, description) |
| `GET` | `/health` | Health check (status, version, uptime, agent count) |
| `GET` | `/.well-known/agent-card.json` | Hub Agent Card (A2A spec) |
| `GET` | `/ws` | WebSocket connection for real-time events |
| `POST` | `/mcp` | MCP protocol endpoint (Streamable HTTP) |

### Agents
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/agents` | Register new agent |
| `GET` | `/api/agents` | List agents (optional filters: `status`, `teamId`, `projectId`) |
| `GET` | `/api/agents/:id` | Get agent details |
| `DELETE` | `/api/agents/:id` | Remove agent (soft delete, marks as offline) |
| `POST` | `/api/agents/:id/heartbeat` | Send heartbeat to stay online |
| `GET` | `/api/agents/:id/card` | Get agent A2A card |

### Messages
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/messages` | Send message (direct or broadcast) |
| `GET` | `/api/messages` | Get messages for an agent (`agentId` required) |
| `GET` | `/api/messages/conversation/:agentA/:agentB` | Get conversation between two agents |

### Teams
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/teams` | Create team |
| `GET` | `/api/teams` | List teams |
| `PATCH` | `/api/teams/:id` | Update team |
| `DELETE` | `/api/teams/:id` | Delete team |
| `POST` | `/api/teams/:id/agents` | Add agent to team |
| `DELETE` | `/api/teams/:id/agents/:agentId` | Remove agent from team |

### Projects
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/projects` | Create project |
| `GET` | `/api/projects` | List projects |
| `PUT` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |
| `POST` | `/api/projects/:id/agents` | Add agent to project |
| `DELETE` | `/api/projects/:id/agents/:agentId` | Remove agent from project |

### Skills
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/skills` | List all discovered skills |
| `GET` | `/api/skills/:name` | Get specific skill details |

## MCP Tools

Agents interact with SwarmRoom via these MCP tools:

| Tool | Description |
|------|-------------|
| `list_agents` | List registered agents with status/team/project filters |
| `get_agent_info` | Get agent details by `id` or `name` |
| `send_message` | Send direct or broadcast message |
| `get_messages` | Retrieve messages with `since`, `limit`, `type` filters |
| `query_agent` | Send query and poll for response with timeout |
| `list_teams` | List all teams and member counts |
| `list_projects` | List all projects and member counts |

### MCP Config Example

```json
{
  "mcpServers": {
    "swarmroom": {
      "url": "http://localhost:39187/mcp"
    }
  }
}
```

## SDK

```typescript
import { SwarmRoomClient, discoverHub } from '@swarmroom/sdk';

// Discover Hub via mDNS (or specify URL)
const hubUrl = await discoverHub();

const client = new SwarmRoomClient({
  hubUrl: hubUrl ?? 'http://localhost:39187',
  agentName: 'my-agent',
  capabilities: ['code-review', 'testing'],
});

await client.connect();

// Send message
await client.sendMessage({
  to: 'other-agent-id',
  content: 'Hello from my agent!',
});

// Listen for messages
client.onMessage((message) => {
  console.log(`Message from ${message.from}: ${message.content}`);
});

// Handle queries with auto-reply
client.onQuery(async (query) => {
  return `Reply to: ${query.content}`;
});

await client.disconnect();
```

## Skills

Skills allow agents to extend their capabilities. The server automatically scans for `SKILL.md` files containing YAML frontmatter in the following locations:
- `~/.swarmroom/skills/`
- `~/.opencode/skills/`
- `~/.claude/skills/`
- `./.swarmroom/skills/`

Skills can be managed via the `/api/skills` endpoints.

## Daemon

The Daemon handles waking up AI agents when messages are undeliverable.

**Workflow:**
1. Connects to Hub via WebSocket to monitor message events.
2. If a target agent is offline, checks if the local process is running.
3. If "headless wakeup" is enabled, starts the agent process to handle the message.
4. Headless wakeup is disabled by default and must be configured manually.

**Configuration:**
Located at `~/.swarmroom/daemon.json`. Use the interactive tool:
```bash
swarmroom daemon config
```

Default wakeup commands:
| Agent | Command |
|-------|---------|
| Claude Code | `claude -p {message} --dangerously-skip-permissions` |
| OpenCode | `opencode run {message}` |
| Gemini CLI | `gemini -p {message}` |

## Architecture

```
                          LAN (mDNS: _swarmroom._tcp)
                                     |
                    +----------------+----------------+
                    |                                 |
              [AI Agent A]                      [AI Agent B]
              (Claude Code)                     (Gemini CLI)
                    |                                 |
                    |    MCP / REST / WebSocket       |
                    |                                 |
                    +---------->  [Hub]  <------------+
                                 (Hono)
                               port 39187
                      API + Web Dashboard + WebSocket
                                  |
                    +------------+------------+
                    |                         |
              [SQLite DB]              [Daemon Process]
              swarmroom.db             Wakeup on failure
```

In production, the Hub serves the Web Dashboard on port 39187. In development, Vite runs on 5173 and proxies API requests.

**Data Flow:**
1. Hub broadcasts its presence via mDNS.
2. Agents register with the Hub (`POST /api/agents`).
3. Agents connect via WebSocket for real-time events.
4. Agents send heartbeats every 30s.
5. Messages flow via REST API or MCP tools.
6. Dashboard monitors via polling + WebSocket.
7. Daemon monitors failed deliveries and optionally wakes agents.

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (Hub + Dashboard)
pnpm run dev

# Build all packages
pnpm run build

# Run tests
pnpm test
pnpm run test:e2e
```

### Build Order
Packages must be built in this order due to dependencies:
1. `@swarmroom/shared`
2. `@swarmroom/web`
3. `@swarmroom/server`
4. `@swarmroom/sdk`
5. `@swarmroom/cli`

### Tech Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.7+
- **Server**: Hono + @hono/node-server
- **Database**: SQLite (Drizzle ORM + better-sqlite3)
- **Frontend**: React 19 + Vite 6 + TanStack Router/Query + Zustand + shadcn/ui + Tailwind v4
- **mDNS**: `@homebridge/ciao` (advertising) & `multicast-dns` (browsing)
- **MCP**: `@modelcontextprotocol/sdk`
- **Testing**: Vitest
- **Animation**: Motion (Framer Motion v12)

### Packages

| Package | Description |
|---------|-------------|
| `swarmroom` | Main package (CLI + Hub + Daemon) |
| `@swarmroom/sdk` | TypeScript SDK |
| `@swarmroom/shared` | Shared types and constants |
| `@swarmroom/server` | Hub Server |

### Source Structure

| Package | Path | Description |
|---------|------|-------------|
| `@swarmroom/shared` | `packages/shared` | Zod schemas, TypeScript types, and shared constants |
| `@swarmroom/server` | `packages/server` | Hono HTTP server (REST API, WebSocket, MCP, mDNS, SQLite) |
| `@swarmroom/web` | `packages/web` | React 19 dashboard (TanStack Router/Query, Zustand, shadcn/ui, Tailwind v4) |
| `@swarmroom/sdk` | `packages/sdk` | TypeScript client library (Agent registration, messaging, Hub discovery) |
| `@swarmroom/cli` | `packages/cli` | CLI tools (Agent setup, status, Daemon management) |

## Configuration

| Variable / Constant | Default Value | Description |
|---------------------|---------------|-------------|
| `DEFAULT_PORT` | `39187` | Hub HTTP service port |
| `HEARTBEAT_INTERVAL_MS` | `30000` | Agent heartbeat interval (ms) |
| `STALE_TIMEOUT_MS` | `90000` | Time before an agent is marked offline (ms) |
| `MAX_MESSAGE_SIZE_BYTES` | `1048576` | Maximum message size (1 MB) |
| `WS_RECONNECT_DELAY_MS` | `3000` | WebSocket reconnection base delay (ms) |
| `MDNS_SERVICE_TYPE` | `_swarmroom._tcp` | mDNS service type |

Hub uses SQLite (`swarmroom.db` in the working directory) with WAL mode enabled. No additional database configuration is required.

## FAQ

### mDNS discovery not working
mDNS uses multicast on UDP port 5353.
- **Firewall**: Ensure 5353/UDP is open for inbound/outbound.
- **Docker/VM**: Use host networking mode; bridged networks often block multicast.
- **Subnets**: mDNS only works within the same broadcast domain.
- **Workaround**: Skip mDNS and connect directly via `http://hostname:39187`.

### Port 39187 already in use
```bash
lsof -i :39187
# Kill the process or use --port to specify another
swarmroom start --port 39188
```

### WebSocket connection issues
- Verify Hub is running and the URL is reachable.
- Dashboard auto-reconnects with exponential backoff (up to 30s).
- Check connection status in Browser DevTools -> Network -> WS.

### CORS Errors
Hub allows all origins by default for LAN trust. If errors persist:
- Check if Hub is on the expected port.
- Verify if a reverse proxy is stripping CORS headers.

### Build Failures
```bash
rm -rf packages/*/dist packages/*/*.tsbuildinfo
pnpm run build
```

### Database Issues
- Database is created on first run.
- To reset: `rm swarmroom.db`

## License
[MIT](./LICENSE)
