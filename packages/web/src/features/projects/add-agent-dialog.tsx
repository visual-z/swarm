import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInitials, getAvatarColor, statusConfig } from "@/features/agents/utils";

interface Agent {
  id: string;
  name: string;
  displayName: string;
  status: string;
}

interface AddAgentDialogProps {
  projectId: string;
  existingAgentIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAgentDialog({
  projectId,
  existingAgentIds,
  open,
  onOpenChange,
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
    staleTime: 30_000,
    retry: 1,
  });

  const addMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (!res.ok) throw new Error("Failed to add agent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Agent added to project");
    },
    onError: () => {
      toast.error("Failed to add agent");
    },
  });

  const availableAgents = useMemo(() => {
    const all = agentsQuery.data ?? [];
    const filtered = all.filter((a) => !existingAgentIds.includes(a.id));
    if (!search) return filtered;
    const q = search.toLowerCase();
    return filtered.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
    );
  }, [agentsQuery.data, existingAgentIds, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add agent</DialogTitle>
          <DialogDescription>
            Select an agent to add to this project.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents…"
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-64">
          {availableAgents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {agentsQuery.isLoading
                ? "Loading agents…"
                : "No available agents found"}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {availableAgents.map((agent) => {
                const statusInfo =
                  statusConfig[agent.status] ?? statusConfig.offline;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => {
                      addMutation.mutate(agent.id);
                      onOpenChange(false);
                      setSearch("");
                    }}
                    disabled={addMutation.isPending}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent disabled:opacity-50"
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
                      <p className="truncate text-sm font-medium">
                        {agent.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {agent.name}
                      </p>
                    </div>
                    <span
                      className={`size-2 shrink-0 rounded-full ${statusInfo.dot}`}
                      title={statusInfo.label}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
