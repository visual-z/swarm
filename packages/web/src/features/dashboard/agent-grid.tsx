import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Agent, AgentStatus, Team } from "@/lib/api";

interface AgentGridProps {
  agents: Agent[];
  teams: Team[];
  isLoading: boolean;
}

const statusConfig: Record<
  AgentStatus,
  { dot: string; pulse: boolean; label: string }
> = {
  online: { dot: "bg-emerald-500", pulse: true, label: "Online" },
  busy: { dot: "bg-amber-500", pulse: false, label: "Busy" },
  idle: { dot: "bg-sky-400", pulse: false, label: "Idle" },
  offline: { dot: "bg-zinc-400 dark:bg-zinc-600", pulse: false, label: "Offline" },
};

function AgentChip({ agent }: { agent: Agent }) {
  const cfg = statusConfig[agent.status];

  return (
    <Link
      to="/agents/$agentId"
      params={{ agentId: agent.id }}
      className="group flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-sm hover:border-brand-300 dark:hover:border-brand-600"
    >
      <span className="relative flex size-2.5 shrink-0">
        <span
          className={`absolute inset-0 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-ping opacity-60" : ""}`}
        />
        <span className={`relative inline-flex size-2.5 rounded-full ${cfg.dot}`} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {agent.displayName}
        </p>
      </div>
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {cfg.label}
      </span>
    </Link>
  );
}

function AgentGridSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentGrid({ agents, teams, isLoading }: AgentGridProps) {
  if (isLoading) return <AgentGridSkeleton />;

  if (agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No agents registered yet. Start an agent to see it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const grouped = new Map<string, Agent[]>();
  const ungrouped: Agent[] = [];

  for (const agent of agents) {
    const teamIds = agent.agentCard?.teams ?? [];
    if (teamIds.length > 0) {
      const teamId = teamIds[0];
      const bucket = grouped.get(teamId) ?? [];
      bucket.push(agent);
      grouped.set(teamId, bucket);
    } else {
      ungrouped.push(agent);
    }
  }

  const sortByStatus = (a: Agent, b: Agent) => {
    const order: Record<AgentStatus, number> = { online: 0, busy: 1, idle: 2, offline: 3 };
    return order[a.status] - order[b.status];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from(grouped.entries()).map(([teamId, teamAgents]) => {
          const team = teamMap.get(teamId);
          return (
            <div key={teamId}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {team?.name ?? teamId}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {teamAgents.sort(sortByStatus).map((agent) => (
                  <AgentChip key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          );
        })}

        {ungrouped.length > 0 && (
          <div>
            {grouped.size > 0 && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Unassigned
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ungrouped.sort(sortByStatus).map((agent) => (
                <AgentChip key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
