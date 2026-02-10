import { useMemo, useState } from "react";
import { Search, Radio, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import type { Message } from "./message-bubble";

export interface Agent {
  id: string;
  name: string;
  displayName: string;
  url: string;
  status: "online" | "offline" | "busy" | "idle";
  createdAt: string;
  lastHeartbeat?: string;
}

interface ConversationEntry {
  agent: Agent;
  lastMessage?: Message;
  unreadCount: number;
}

const statusColors: Record<Agent["status"], string> = {
  online: "bg-emerald-500",
  idle: "bg-amber-400",
  busy: "bg-rose-500",
  offline: "bg-zinc-400",
};

const agentColors = [
  "bg-sky-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-emerald-600",
  "bg-cyan-600",
  "bg-fuchsia-600",
  "bg-lime-600",
];

function getAgentColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return agentColors[Math.abs(hash) % agentColors.length];
}

function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

interface ConversationListProps {
  agents: Agent[];
  messages: Message[];
  selectedAgentId: string | null;
  onSelect: (agentId: string | null) => void;
  isLoading?: boolean;
  dashboardId: string;
}

export function ConversationList({
  agents,
  messages,
  selectedAgentId,
  onSelect,
  isLoading,
  dashboardId,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const conversations = useMemo(() => {
    const entries: ConversationEntry[] = agents.map((agent) => {
      const agentMessages = messages.filter(
        (m) =>
          (m.from === agent.id && m.to === dashboardId) ||
          (m.from === dashboardId && m.to === agent.id),
      );
      const lastMessage = agentMessages.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
      const unreadCount = agentMessages.filter(
        (m) => !m.read && m.from === agent.id,
      ).length;

      return { agent, lastMessage, unreadCount };
    });

    entries.sort((a, b) => {
      const aTime = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const bTime = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return bTime - aTime;
    });

    return entries;
  }, [agents, messages, dashboardId]);

  const broadcastMessages = useMemo(
    () => messages.filter((m) => m.type === "broadcast"),
    [messages],
  );
  const lastBroadcast = broadcastMessages.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  const filtered = search
    ? conversations.filter((c) =>
        c.agent.displayName.toLowerCase().includes(search.toLowerCase()),
      )
    : conversations;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2",
            "transition-colors focus-within:border-ring focus-within:bg-background",
          )}
        >
          <Search className="size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 p-1.5">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={cn(
              "flex items-center gap-3 rounded-xl p-3 text-left transition-colors",
              "hover:bg-accent/60",
              selectedAgentId === null && "bg-accent",
            )}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white">
              <Radio className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  Broadcast
                </span>
                {lastBroadcast && (
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {relativeTime(lastBroadcast.createdAt)}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {lastBroadcast
                  ? lastBroadcast.content
                  : "Send to all online agents"}
              </p>
            </div>
          </button>

          {filtered.length === 0 && !search && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <MessageSquare className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No conversations yet
              </p>
            </div>
          )}

          {filtered.length === 0 && search && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{search}&rdquo;
            </div>
          )}

          {filtered.map(({ agent, lastMessage, unreadCount }) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelect(agent.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl p-3 text-left transition-colors",
                "hover:bg-accent/60",
                selectedAgentId === agent.id && "bg-accent",
              )}
            >
              <div className="relative">
                <Avatar>
                  <AvatarFallback
                    className={cn(
                      "text-xs font-bold text-white",
                      getAgentColor(agent.id),
                    )}
                  >
                    {initials(agent.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background",
                    statusColors[agent.status],
                  )}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      unreadCount > 0 ? "font-bold" : "font-medium",
                    )}
                  >
                    {agent.displayName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {lastMessage && (
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {relativeTime(lastMessage.createdAt)}
                      </span>
                    )}
                    {unreadCount > 0 && (
                      <Badge className="size-5 justify-center p-0 text-[10px]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
                <p
                  className={cn(
                    "truncate text-xs",
                    unreadCount > 0
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {lastMessage ? lastMessage.content : "No messages yet"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
