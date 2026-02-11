import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { vi, beforeEach } from 'vitest';

const SQL_INIT = `
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'online',
    agent_card TEXT,
    last_heartbeat INTEGER,
    created_at INTEGER DEFAULT (unixepoch() * 1000),
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    from_agent_id TEXT NOT NULL,
    to_agent_id TEXT NOT NULL,
    sender_type TEXT DEFAULT 'agent',
    content TEXT NOT NULL,
    type TEXT DEFAULT 'notification',
    reply_to TEXT,
    metadata TEXT,
    read INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    created_at INTEGER DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS project_groups (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    repository TEXT,
    created_at INTEGER DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS agent_teams (
    agent_id TEXT NOT NULL REFERENCES agents(id),
    team_id TEXT NOT NULL REFERENCES teams(id),
    PRIMARY KEY (agent_id, team_id)
  );

  CREATE TABLE IF NOT EXISTS agent_projects (
    agent_id TEXT NOT NULL REFERENCES agents(id),
    project_id TEXT NOT NULL REFERENCES project_groups(id),
    PRIMARY KEY (agent_id, project_id)
  );
`;

export function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(SQL_INIT);
  return drizzle(sqlite, { schema });
}

export let testDb: ReturnType<typeof createTestDb>;

vi.mock(import('../db/index.js'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get db() {
      return testDb;
    },
  };
});

vi.mock('../services/ws-manager.js', () => ({
  pushMessageToRecipient: vi.fn(),
  broadcastAgentOnline: vi.fn(),
  broadcastAgentOffline: vi.fn(),
  broadcast: vi.fn(),
  sendToClient: vi.fn(),
  sendToDashboards: vi.fn(),
  sendToDaemons: vi.fn(),
  hasActiveConnections: vi.fn(() => false),
}));

beforeEach(() => {
  testDb = createTestDb();
});
