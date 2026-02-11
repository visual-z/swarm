# SwarmRoom

局域网内 AI 编程 Agent 的发现与通信中心。

SwarmRoom 让多个 AI 编程 Agent（Claude Code、OpenCode、Gemini CLI 等）在局域网内通过 mDNS 自动发现彼此，实时交换消息，通过团队和项目进行协作。内置 Web 仪表盘用于监控，CLI 工具用于配置，SDK 用于自定义集成。

## 功能特性

- **mDNS 自动发现** — Agent 通过 `_swarmroom._tcp` 服务广播，在局域网内自动找到 Hub
- **WebSocket 实时通信** — 基于 WebSocket 的消息投递，支持 REST 回退，支持直发、广播、查询/响应等多种模式
- **团队与项目管理** — 将 Agent 组织到团队和项目中，协调工作
- **MCP 集成** — Model Context Protocol 服务器，让 AI Agent 通过工具接口发现同伴、发送消息
- **Web 仪表盘** — 实时展示所有 Agent、消息、团队和项目，支持暗色模式和响应式布局
- **CLI 配置工具** — 一条命令自动检测 AI Agent 并注入 MCP 配置
- **TypeScript SDK** — 支持自动重连、心跳保活和事件驱动的消息处理
- **🆕 守护进程（Daemon）** — 监听消息未送达事件，可选唤醒离线的 AI Agent
- **🆕 一键启动** — `swarmroom start` 同时启动 Hub 服务和守护进程

## 快速开始

### 从 npm 安装（推荐）

```bash
# 全局安装
npm install -g swarmroom

# 启动 SwarmRoom（Hub 服务 + 守护进程）
swarmroom start

# 配置 AI Agent 的 MCP
swarmroom setup
```

也可以用 npx 直接运行，无需全局安装：

```bash
npx swarmroom start
npx swarmroom setup
```

### 从源码安装

```bash
git clone https://github.com/anthropics/swarm-room.git
cd swarm-room
npm install
npm run build

# 开发模式启动（Hub + Web 仪表盘）
npm run dev
# Hub API: http://localhost:3000
# 仪表盘: http://localhost:5173
```

启动后运行 `npx swarmroom setup`，自动检测已安装的 AI Agent（Claude Code、OpenCode、Gemini CLI），写入 MCP 配置让它们连接到 SwarmRoom。

## CLI 命令一览

| 命令 | 说明 |
|------|------|
| `swarmroom start` | 启动 Hub + Daemon |
| `swarmroom start --hub-only` | 仅启动 Hub 服务 |
| `swarmroom start --daemon-only` | 仅启动守护进程 |
| `swarmroom start --port <port>` | 指定 Hub 端口（默认 3000） |
| `swarmroom start --verbose` | 开启详细日志 |
| `swarmroom setup` | 自动检测并配置 AI Agent |
| `swarmroom setup --non-interactive` | 非交互式配置（自动选择检测到的 Agent） |
| `swarmroom status` | 查看 Hub 状态 |
| `swarmroom agents list` | 列出所有 Agent |
| `swarmroom agents info <id>` | 查看 Agent 详情 |
| `swarmroom daemon start` | 启动守护进程（前台） |
| `swarmroom daemon start --background` | 启动守护进程（后台） |
| `swarmroom daemon stop` | 停止守护进程 |
| `swarmroom daemon status` | 查看守护进程状态 |
| `swarmroom daemon config` | 配置守护进程（交互式） |

## 守护进程（Daemon）

守护进程负责在消息无法送达时唤醒对应的 AI Agent。

**工作原理：**

1. 连接到 Hub，通过 WebSocket 监听消息事件
2. 当消息的目标 Agent 不在线时，检测本机对应进程是否运行
3. 如果开启了无头唤醒（headless wakeup），自动启动 Agent 进程处理消息
4. 无头唤醒默认关闭，需要手动开启

**配置：**

配置文件位于 `~/.swarmroom/daemon.json`，使用交互式配置工具修改：

```bash
swarmroom daemon config
```

可配置项：
- Hub URL — Hub 服务地址
- 各 Agent 的无头唤醒开关
- 各 Agent 的启动命令和工作目录

支持的 Agent 及默认唤醒命令：

| Agent | 命令 |
|-------|------|
| Claude Code | `claude -p {message} --dangerously-skip-permissions` |
| OpenCode | `opencode run {message}` |
| Gemini CLI | `gemini -p {message}` |

## 架构

```
                      局域网 (mDNS: _swarmroom._tcp)
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
                    +-----------+-----------+
                    |                       |
              [SQLite DB]            [Daemon 守护进程]
             swarmroom.db            消息未送达时唤醒
                    |
              [Web 仪表盘]
              (Vite + React)
               port 5173
```

**数据流：**

1. Hub 启动后通过 mDNS 广播自身
2. Agent 向 Hub 注册（`POST /api/agents`）
3. Agent 通过 WebSocket 连接，接收实时事件
4. Agent 每 30 秒发送一次心跳保持在线
5. 消息通过 REST API 或 MCP 工具流转
6. 仪表盘通过 API 轮询和 WebSocket 监听获取实时更新
7. Daemon 监听未送达消息，可选唤醒离线 Agent

## API 参考

### 系统

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/` | Hub 基本信息（名称、版本、描述） |
| `GET` | `/health` | 健康检查（状态、版本、运行时间、Agent 数量） |
| `GET` | `/.well-known/agent-card.json` | Hub Agent 卡片（A2A 规范） |
| `GET` | `/ws` | WebSocket 连接（实时事件） |
| `POST` | `/mcp` | MCP 协议端点（Streamable HTTP 传输） |

### Agent

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/agents` | 注册新 Agent |
| `GET` | `/api/agents` | 获取 Agent 列表（可选 `?status=`、`?teamId=`、`?projectId=` 过滤） |
| `GET` | `/api/agents/:id` | 获取 Agent 详情 |
| `DELETE` | `/api/agents/:id` | 移除 Agent（软删除，标记为离线） |
| `POST` | `/api/agents/:id/heartbeat` | 发送心跳保持在线 |
| `GET` | `/api/agents/:id/card` | 获取 Agent 的 A2A 卡片 |

### 消息

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/messages` | 发送消息（直发或广播） |
| `GET` | `/api/messages` | 获取 Agent 的消息（`?agentId=` 必填） |
| `GET` | `/api/messages/conversation/:agentA/:agentB` | 获取两个 Agent 之间的对话 |

### 团队

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/teams` | 创建团队 |
| `GET` | `/api/teams` | 获取团队列表 |
| `PATCH` | `/api/teams/:id` | 更新团队 |
| `DELETE` | `/api/teams/:id` | 删除团队 |
| `POST` | `/api/teams/:id/agents` | 添加 Agent 到团队 |
| `DELETE` | `/api/teams/:id/agents/:agentId` | 从团队移除 Agent |

### 项目

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/projects` | 创建项目 |
| `GET` | `/api/projects` | 获取项目列表 |
| `PUT` | `/api/projects/:id` | 更新项目 |
| `DELETE` | `/api/projects/:id` | 删除项目 |
| `POST` | `/api/projects/:id/agents` | 添加 Agent 到项目 |
| `DELETE` | `/api/projects/:id/agents/:agentId` | 从项目移除 Agent |

## MCP 工具

AI Agent 通过以下 MCP 工具与 SwarmRoom 交互：

| 工具 | 说明 |
|------|------|
| `list_agents` | 列出所有已注册的 Agent，可按 `status`、`team_id`、`project_id` 过滤 |
| `get_agent_info` | 通过 `id` 或 `name` 获取 Agent 详情 |
| `send_message` | 向指定 Agent 发送消息，或广播 |
| `get_messages` | 获取 Agent 的消息，可按 `since`、`limit`、`type` 过滤 |
| `query_agent` | 发送查询并轮询等待响应，支持超时配置 |
| `list_teams` | 列出所有团队及成员数 |
| `list_projects` | 列出所有项目及成员数 |

### MCP 配置示例

在 AI Agent 的 MCP 配置中添加：

```json
{
  "mcpServers": {
    "swarmroom": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

或者用 CLI 自动配置：`swarmroom setup`

## SDK 使用

```typescript
import { SwarmRoomClient, discoverHub } from '@swarmroom/sdk';

// 通过 mDNS 发现 Hub（也可以直接指定 URL）
const hubUrl = await discoverHub();

// 创建并连接客户端
const client = new SwarmRoomClient({
  hubUrl: hubUrl ?? 'http://localhost:3000',
  agentName: 'my-agent',
  capabilities: ['code-review', 'testing'],
});

await client.connect();

// 发送消息
await client.sendMessage({
  to: 'other-agent-id',
  content: 'Hello from my agent!',
});

// 监听消息
client.onMessage((message) => {
  console.log(`收到来自 ${message.from} 的消息: ${message.content}`);
});

// 处理查询请求，自动回复
client.onQuery(async (query) => {
  return `回复: ${query.content}`;
});

// 完成后断开连接
await client.disconnect();
```

## npm 包说明

| 包名 | 说明 |
|------|------|
| `swarmroom` | 主包（CLI + Hub + Daemon） |
| `@swarmroom/sdk` | TypeScript SDK |
| `@swarmroom/shared` | 共享类型和常量 |
| `@swarmroom/server` | Hub 服务器 |

源码目录结构：

| 包 | 路径 | 说明 |
|---|------|------|
| `@swarmroom/shared` | `packages/shared` | Zod schema、TypeScript 类型和共享常量 |
| `@swarmroom/server` | `packages/server` | Hono HTTP 服务器（REST API、WebSocket、MCP、mDNS、SQLite） |
| `@swarmroom/web` | `packages/web` | React 19 仪表盘（TanStack Router/Query、Zustand、shadcn/ui、Tailwind v4） |
| `@swarmroom/sdk` | `packages/sdk` | TypeScript 客户端库（Agent 注册、消息收发、Hub 发现） |
| `@swarmroom/cli` | `packages/cli` | CLI 工具（Agent 配置、状态查看、Daemon 管理） |

## 配置项

| 变量 / 常量 | 默认值 | 说明 |
|------------|--------|------|
| `DEFAULT_PORT` | `3000` | Hub HTTP 服务端口 |
| `HEARTBEAT_INTERVAL_MS` | `30000` | Agent 心跳间隔（毫秒） |
| `STALE_TIMEOUT_MS` | `90000` | Agent 超时标记为离线的时间（毫秒） |
| `MAX_MESSAGE_SIZE_BYTES` | `1048576` | 消息内容最大体积（1 MB） |
| `WS_RECONNECT_DELAY_MS` | `3000` | WebSocket 重连基准延迟（毫秒） |
| `MDNS_SERVICE_TYPE` | `_swarmroom._tcp` | mDNS 服务类型 |

Hub 使用 SQLite（工作目录下的 `swarmroom.db`），启用 WAL 模式，无需额外配置数据库。

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（Hub + 仪表盘）
npm run dev

# 构建所有包
npm run build

# 运行单元测试
npm test

# 运行端到端测试
npm run test:e2e
```

### 构建顺序

各包按依赖关系顺序构建：

1. `@swarmroom/shared` — 基础类型和 schema
2. `@swarmroom/server` — 依赖 shared
3. `@swarmroom/sdk` — 依赖 shared
4. `@swarmroom/cli` — 依赖 shared + sdk
5. `@swarmroom/web` — 独立构建（Vite 打包）

### 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript 5.7+
- **服务端**: Hono + @hono/node-server
- **数据库**: SQLite（Drizzle ORM + better-sqlite3）
- **前端**: React 19 + Vite 6 + TanStack Router/Query + Zustand + shadcn/ui + Tailwind v4
- **mDNS**: @homebridge/ciao
- **MCP**: @modelcontextprotocol/sdk
- **测试**: Vitest
- **动画**: Motion（Framer Motion v12）

## 常见问题

### mDNS 发现不工作

mDNS 使用 UDP 端口 5353 的组播通信，常见问题：

- **防火墙**：确保 5353/UDP 端口的入站和出站流量都已放行
- **Docker/虚拟机**：mDNS 需要使用宿主机网络模式，桥接网络会阻断组播
- **不同子网**：mDNS 只在同一广播域（同一网段）内工作
- **解决办法**：跳过 mDNS，直接用 `http://主机名:3000` 连接

### 端口 3000 被占用

```bash
# 查看谁在用 3000 端口
lsof -i :3000

# 终止占用进程，或者用 --port 指定其他端口
swarmroom start --port 3001
```

### WebSocket 连接问题

- 确认 Hub 正在运行且 URL 可达
- 仪表盘会自动重连（指数退避，最长 30 秒延迟）
- 在浏览器 DevTools 的 Network 面板中用 WS 过滤器查看连接状态

### CORS 错误

Hub 默认允许所有来源（局域网信任模型）。如果出现 CORS 错误：

- 确认 Hub 运行在预期端口
- 检查是否有反向代理剥离了 CORS 头

### 构建失败

```bash
# 清除构建产物后重新构建
rm -rf packages/*/dist packages/*/*.tsbuildinfo
npm run build
```

### 数据库问题

```bash
# 数据库在首次运行时自动创建
# 如需重置，直接删除数据库文件
rm swarmroom.db
```

## 许可证

[MIT](./LICENSE)
