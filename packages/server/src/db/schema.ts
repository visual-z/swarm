import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Agents ─────────────────────────────────────────────────────────────────

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  displayName: text("display_name"),
  url: text("url").notNull(),
  status: text("status").default("online"),
  agentCard: text("agent_card"), // JSON blob
  lastHeartbeat: integer("last_heartbeat"),
  createdAt: integer("created_at").default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at"),
});

// ─── Messages ───────────────────────────────────────────────────────────────

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  fromAgentId: text("from_agent_id").notNull(),
  toAgentId: text("to_agent_id").notNull(),
  senderType: text("sender_type").default("agent"),
  content: text("content").notNull(),
  type: text("type").default("notification"),
  replyTo: text("reply_to"),
  metadata: text("metadata"), // JSON blob
  read: integer("read").default(0),
  createdAt: integer("created_at").default(sql`(unixepoch() * 1000)`),
});

// ─── Teams ──────────────────────────────────────────────────────────────────

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"),
  createdAt: integer("created_at").default(sql`(unixepoch() * 1000)`),
});

// ─── Project Groups ─────────────────────────────────────────────────────────

export const projectGroups = sqliteTable("project_groups", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  repository: text("repository"),
  createdAt: integer("created_at").default(sql`(unixepoch() * 1000)`),
});

// ─── Agent ↔ Team (Junction) ───────────────────────────────────────────────

export const agentTeams = sqliteTable(
  "agent_teams",
  {
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),
  },
  (table) => [primaryKey({ columns: [table.agentId, table.teamId] })],
);

// ─── Agent ↔ Project (Junction) ────────────────────────────────────────────

export const agentProjects = sqliteTable(
  "agent_projects",
  {
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id),
    projectId: text("project_id")
      .notNull()
      .references(() => projectGroups.id),
  },
  (table) => [primaryKey({ columns: [table.agentId, table.projectId] })],
);
