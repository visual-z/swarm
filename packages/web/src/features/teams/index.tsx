import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/lib/api";
import { TeamCard, TeamCardSkeleton } from "./team-card";
import { CreateTeamDialog } from "./create-team-dialog";
import { TeamDetailView } from "./team-detail";

export interface TeamListItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  agentCount: number;
  createdAt: number;
  topAgentNames?: string[];
}

export function TeamsList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const teamsQuery = useQuery<TeamListItem[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/teams`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    refetchInterval: 15_000,
    retry: 1,
  });

  if (teamsQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  const teams = teamsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize agents into collaborative teams
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Create Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <EmptyState onCreateClick={() => setCreateOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => setSelectedTeamId(team.id)}
            />
          ))}
        </div>
      )}

      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />

      {selectedTeamId && (
        <TeamDetailView
          teamId={selectedTeamId}
          open={!!selectedTeamId}
          onOpenChange={(open) => {
            if (!open) setSelectedTeamId(null);
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-20">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Users className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">No teams yet</h2>
      <p className="mt-1.5 max-w-sm text-center text-sm text-muted-foreground">
        Create your first team to organize agents into focused groups that
        collaborate on tasks together.
      </p>
      <Button className="mt-6" onClick={onCreateClick}>
        <Plus />
        Create Team
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <TeamCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
