import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_BASE_URL } from "@/lib/api";
import {
  getInitials,
  getAvatarColor,
  statusConfig,
} from "@/features/agents/utils";
import {
  Loader2,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  X,
} from "lucide-react";
import { AddAgentDialog } from "./add-agent-dialog";

interface TeamAgent {
  id: string;
  name: string;
  displayName: string;
  status: string;
  url: string;
}

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: number;
  agents: TeamAgent[];
}

interface TeamDetailViewProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamDetailView({
  teamId,
  open,
  onOpenChange,
}: TeamDetailViewProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColor, setEditColor] = useState("");
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const teamQuery = useQuery<TeamDetail>({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/teams/${teamId}`);
      if (!res.ok) throw new Error("Failed to fetch team");
      const json = await res.json();
      return json.data;
    },
    enabled: open && !!teamId,
    staleTime: 10_000,
  });

  const team = teamQuery.data;

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      name?: string;
      description?: string;
      color?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(
          json?.error?.message ?? `Failed to update team (${res.status})`
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      toast.success("Team updated");
      setEditing(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete team");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team deleted");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const removeAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(
        `${API_BASE_URL}/teams/${teamId}/agents/${agentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove agent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      toast.success("Agent removed from team");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function startEditing() {
    if (!team) return;
    setEditName(team.name);
    setEditDesc(team.description ?? "");
    setEditColor(team.color ?? "#6366f1");
    setEditing(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) return;
    updateMutation.mutate({
      name: editName.trim(),
      description: editDesc.trim() || undefined,
      color: editColor,
    });
  }

  const COLOR_PRESETS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#10b981", "#06b6d4", "#3b82f6", "#64748b",
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          {teamQuery.isLoading ? (
            <div className="flex flex-col gap-4 py-8">
              <div className="h-6 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
              <div className="h-px bg-border" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : !team ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Team not found
            </div>
          ) : editing ? (
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>Edit Team</DialogTitle>
              </DialogHeader>
              <div className="mt-4 flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Name
                  </label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-desc"
                    className="text-sm font-medium text-foreground"
                  >
                    Description
                  </label>
                  <Input
                    id="edit-desc"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Color
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className="relative size-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        style={{ backgroundColor: c }}
                      >
                        {editColor === c && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="size-2 rounded-full bg-white" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!editName.trim() || updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="animate-spin" />
                  )}
                  Save
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="size-4 shrink-0 rounded-full"
                    style={{ backgroundColor: team.color ?? "#6366f1" }}
                  />
                  <DialogTitle className="truncate">{team.name}</DialogTitle>
                </div>
                {team.description && (
                  <DialogDescription>{team.description}</DialogDescription>
                )}
              </DialogHeader>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startEditing}
                >
                  <Pencil />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddAgentOpen(true)}
                >
                  <UserPlus />
                  Add Agent
                </Button>
                <div className="flex-1" />
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-destructive font-medium">
                      Delete?
                    </span>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Yes"
                      )}
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setConfirmDelete(false)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>

              <Separator />

              <div className="space-y-1">
                <h4 className="text-sm font-medium">
                  Members
                  <Badge variant="secondary" className="ml-2 tabular-nums">
                    {team.agents.length}
                  </Badge>
                </h4>
              </div>

              <ScrollArea className="max-h-64">
                {team.agents.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground italic">
                    No agents in this team yet
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {team.agents.map((agent) => {
                      const status =
                        statusConfig[agent.status] ?? statusConfig.offline;
                      return (
                        <div
                          key={agent.id}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50"
                        >
                          <Avatar size="sm">
                            <AvatarFallback
                              className="text-[9px] font-semibold text-white"
                              style={{
                                backgroundColor: getAvatarColor(
                                  agent.displayName
                                ),
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
                          </div>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              removeAgentMutation.mutate(agent.id)
                            }
                            disabled={removeAgentMutation.isPending}
                          >
                            <UserMinus className="size-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddAgentDialog
        open={addAgentOpen}
        onOpenChange={setAddAgentOpen}
        teamId={teamId}
        currentAgentIds={team?.agents.map((a) => a.id) ?? []}
      />
    </>
  );
}
