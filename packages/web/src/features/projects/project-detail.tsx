import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getInitials,
  getAvatarColor,
  statusConfig,
  truncateUrl,
} from "@/features/agents/utils";
import { AddAgentDialog } from "./add-agent-dialog";
import type { Project } from "./index";

interface Agent {
  id: string;
  name: string;
  displayName: string;
  status: string;
  lastHeartbeat?: string;
}

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const queryClient = useQueryClient();
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const removeMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(
        `${API_BASE_URL}/projects/${project.id}/agents/${agentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove agent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Agent removed from project");
    },
    onError: () => {
      toast.error("Failed to remove agent");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
      onBack();
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  const memberAgents = (agentsQuery.data ?? []).filter((a) =>
    project.agentIds.includes(a.id)
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground w-fit"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
          {project.repository && (
            <a
              href={project.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <GitBranch className="size-3.5" />
              <span>{truncateUrl(project.repository, 48)}</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Members</h2>
            <p className="text-sm text-muted-foreground">
              {memberAgents.length} agent{memberAgents.length !== 1 ? "s" : ""}{" "}
              assigned to this project
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddAgentOpen(true)}
          >
            <Plus className="size-3.5" />
            Add Agent
          </Button>
        </div>

        {memberAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12">
            <p className="text-sm text-muted-foreground">
              No agents assigned yet
            </p>
            <Button
              size="sm"
              variant="link"
              className="mt-1"
              onClick={() => setAddAgentOpen(true)}
            >
              Add your first agent
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            {memberAgents.map((agent) => {
              const statusInfo =
                statusConfig[agent.status] ?? statusConfig.offline;
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <Avatar>
                    <AvatarFallback
                      className="text-xs font-semibold text-white"
                      style={{
                        backgroundColor: getAvatarColor(agent.displayName),
                      }}
                    >
                      {getInitials(agent.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {agent.displayName}
                      </p>
                      <span
                        className={`size-2 shrink-0 rounded-full ${statusInfo.dot}`}
                        title={statusInfo.label}
                      />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {agent.name}
                    </p>
                  </div>
                  <Badge variant={statusInfo.variant} className="text-[10px]">
                    {statusInfo.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeMutation.mutate(agent.id)}
                    disabled={removeMutation.isPending}
                  >
                    <UserMinus className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddAgentDialog
        projectId={project.id}
        existingAgentIds={project.agentIds}
        open={addAgentOpen}
        onOpenChange={setAddAgentOpen}
      />

      <EditProjectDialog
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {project.name}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [repository, setRepository] = useState(project.repository ?? "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = { name };
      if (description.trim()) body.description = description.trim();
      else body.description = "";
      if (repository.trim()) body.repository = repository.trim();
      else body.repository = "";

      const res = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update project");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    updateMutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Update your project details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this project is about"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-repository" className="text-sm font-medium">
              Repository URL
            </label>
            <Input
              id="edit-repository"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              placeholder="https://github.com/org/repo"
              type="url"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
