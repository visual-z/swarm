import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Agent } from "./conversation-list";

const statusLabels: Record<Agent["status"], string> = {
  online: "Online",
  idle: "Idle",
  busy: "Busy",
  offline: "Offline",
};

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

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  onSelect: (agentId: string) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  agents,
  onSelect,
}: NewConversationDialogProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return agents;
    const q = search.toLowerCase();
    return agents.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q),
    );
  }, [agents, search]);

  const grouped = useMemo(() => {
    const online = filtered.filter((a) => a.status === "online");
    const idle = filtered.filter((a) => a.status === "idle");
    const busy = filtered.filter((a) => a.status === "busy");
    const offline = filtered.filter((a) => a.status === "offline");
    return [
      { label: "Online", agents: online },
      { label: "Idle", agents: idle },
      { label: "Busy", agents: busy },
      { label: "Offline", agents: offline },
    ].filter((g) => g.agents.length > 0);
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Select an agent to start a conversation
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2",
              "transition-colors focus-within:border-ring focus-within:bg-background",
            )}
          >
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] px-3 pb-4">
          <div className="flex flex-col gap-1">
            {grouped.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label} ({group.agents.length})
                </div>
                {group.agents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => {
                      onSelect(agent.id);
                      onOpenChange(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                      "transition-colors hover:bg-accent/60",
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
                          "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background",
                          statusColors[agent.status],
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {agent.displayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {statusLabels[agent.status]}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No agents found
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
