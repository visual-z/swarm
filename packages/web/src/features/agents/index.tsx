import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AgentFilters,
  type ViewMode,
  type StatusFilter,
  type SortField,
  type SortDirection,
} from "./agent-filters";
import { AgentTable } from "./agent-table";
import { AgentCard } from "./agent-card";

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export interface AgentCardData {
  name: string;
  description: string;
  version: string;
  url: string;
  skills: AgentSkill[];
  teams: string[];
  projectGroups: string[];
}

export interface Agent {
  id: string;
  name: string;
  displayName: string;
  url: string;
  status: string;
  agentCard?: AgentCardData;
  createdAt: string;
  lastHeartbeat?: string;
}

interface Team {
  id: string;
  name: string;
  color: string;
}

const VIEW_MODE_KEY = "swarmroom:agents:viewMode";

function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_MODE_KEY);
    if (stored === "grid" || stored === "table") return stored;
  } catch {
    // localStorage unavailable
  }
  return "grid";
}

export function AgentsList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const agentsQuery = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/agents`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    refetchInterval: 10_000,
    retry: 1,
  });

  const teamsQuery = useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/teams`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      const json = await res.json();
      return json.data;
    },
    staleTime: 60_000,
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const res = await fetch(`${API_BASE_URL}/agents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove agent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent removed");
    },
    onError: () => {
      toast.error("Failed to remove agent");
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleSortChange = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  const filteredAgents = useMemo(() => {
    let result = agentsQuery.data ?? [];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.displayName.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (teamFilter) {
      result = result.filter((a) =>
        a.agentCard?.teams?.some((t) => t === teamFilter)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.displayName.localeCompare(b.displayName);
          break;
        case "status": {
          const order: Record<string, number> = {
            online: 0,
            busy: 1,
            idle: 2,
            offline: 3,
          };
          cmp = (order[a.status] ?? 9) - (order[b.status] ?? 9);
          break;
        }
        case "lastSeen": {
          const aTime = a.lastHeartbeat
            ? new Date(a.lastHeartbeat).getTime()
            : 0;
          const bTime = b.lastHeartbeat
            ? new Date(b.lastHeartbeat).getTime()
            : 0;
          cmp = bTime - aTime;
          break;
        }
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [agentsQuery.data, search, statusFilter, teamFilter, sortField, sortDirection]);

  const totalCount = agentsQuery.data?.length ?? 0;

  if (agentsQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor and manage your AI agents across the swarm
        </p>
      </div>

      <AgentFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        teamFilter={teamFilter}
        onTeamFilterChange={setTeamFilter}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        teams={teamsQuery.data ?? []}
        totalCount={totalCount}
        filteredCount={filteredAgents.length}
      />

      {totalCount === 0 ? (
        <EmptyState />
      ) : filteredAgents.length === 0 ? (
        <NoResults onClear={() => { setSearch(""); setStatusFilter("all"); setTeamFilter(null); }} />
      ) : viewMode === "table" ? (
        <AgentTable
          agents={filteredAgents}
          onDelete={(id) => deleteMutation.mutate(id)}
          deletingId={deletingId}
        />
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {filteredAgents.map((agent) => (
            <motion.div
              key={agent.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } }}
            >
              <AgentCard
                agent={agent}
                onDelete={(id) => deleteMutation.mutate(id)}
                isDeleting={deletingId === agent.id}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-20">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Bot className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">No agents registered</h2>
      <p className="mt-1.5 max-w-sm text-center text-sm text-muted-foreground">
        Agents self-register when they connect to the swarm. Start an agent with
        the SDK or CLI to see it appear here.
      </p>
      <div className="mt-6 rounded-lg bg-muted/60 px-4 py-3">
        <code className="font-mono text-xs text-muted-foreground">
          npx @swarmroom/cli agent start
        </code>
      </div>
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-sm text-muted-foreground">
        No agents match your filters.
      </p>
      <button
        onClick={onClear}
        className="mt-2 text-sm font-medium text-primary hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
