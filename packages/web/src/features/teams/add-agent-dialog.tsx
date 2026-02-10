import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_BASE_URL, type Agent } from "@/lib/api";
import {
  getInitials,
  getAvatarColor,
  statusConfig,
} from "@/features/agents/utils";
import { Loader2, Plus, Search } from "lucide-react";

interface AddAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  currentAgentIds: string[];
}

export function AddAgentDialog({
  open,
  onOpenChange,
  teamId,
  currentAgentIds,
}: AddAgentDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const agentsQuery = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/agents`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      const json = await res.json();
      return json.data;
    },
    enabled: open,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(`${API_BASE_URL}/teams/${teamId}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(
          json?.error?.message ?? `Failed to add agent (${res.status})`
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      toast.success("Agent added to team");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const available = useMemo(() => {
    const agents = agentsQuery.data ?? [];
    const memberSet = new Set(currentAgentIds);
    let filtered = agents.filter((a) => !memberSet.has(a.id));
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.displayName.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [agentsQuery.data, currentAgentIds, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Agent</DialogTitle>
          <DialogDescription>
            Select an agent to add to this team.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-64">
          {agentsQuery.isLoading ? (
            <div className="flex flex-col gap-2 p-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : available.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {(agentsQuery.data?.length ?? 0) === 0
                ? "No agents available"
                : search
                  ? "No matching agents"
                  : "All agents are already in this team"}
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-1">
              {available.map((agent) => {
                const status =
                  statusConfig[agent.status] ?? statusConfig.offline;
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
                  >
                    <Avatar size="sm">
                      <AvatarFallback
                        className="text-[9px] font-semibold text-white"
                        style={{
                          backgroundColor: getAvatarColor(agent.displayName),
                        }}
                      >
                        {getInitials(agent.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {agent.displayName}
                        </span>
                        <span
                          className={`inline-block size-1.5 shrink-0 rounded-full ${status.dot}`}
                        />
                      </div>
                      <p className="truncate text-xs text-muted-foreground font-mono">
                        {agent.name}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => addMutation.mutate(agent.id)}
                      disabled={addMutation.isPending}
                    >
                      <Plus className="size-3" />
                      Add
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
