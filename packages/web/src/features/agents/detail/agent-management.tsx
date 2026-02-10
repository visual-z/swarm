import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  X,
  Users,
  FolderOpen,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  API_BASE_URL,
  type Agent,
  type Team,
  type ProjectGroup,
} from "@/lib/api";

interface AgentManagementProps {
  agent: Agent;
}

export function AgentManagement({ agent }: AgentManagementProps) {
  const queryClient = useQueryClient();

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

  const projectsQuery = useQuery<ProjectGroup[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/projects`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const json = await res.json();
      return json.data;
    },
    staleTime: 60_000,
    retry: 1,
  });

  const allTeams = teamsQuery.data ?? [];
  const allProjects = projectsQuery.data ?? [];

  const agentTeams = allTeams.filter((t) => t.agentIds.includes(agent.id));
  const agentProjects = allProjects.filter((p) =>
    p.agentIds.includes(agent.id),
  );
  const availableTeams = allTeams.filter(
    (t) => !t.agentIds.includes(agent.id),
  );
  const availableProjects = allProjects.filter(
    (p) => !p.agentIds.includes(agent.id),
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <TeamSection
        agent={agent}
        agentTeams={agentTeams}
        availableTeams={availableTeams}
        isLoading={teamsQuery.isLoading}
      />
      <ProjectSection
        agent={agent}
        agentProjects={agentProjects}
        availableProjects={availableProjects}
        isLoading={projectsQuery.isLoading}
      />
    </div>
  );
}

function TeamSection({
  agent,
  agentTeams,
  availableTeams,
  isLoading,
}: {
  agent: Agent;
  agentTeams: Team[];
  availableTeams: Team[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const addToTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await fetch(`${API_BASE_URL}/teams/${teamId}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id }),
      });
      if (!res.ok) throw new Error("Failed to add agent to team");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Added to team");
      setAddOpen(false);
    },
    onError: () => toast.error("Failed to add to team"),
  });

  const removeFromTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await fetch(
        `${API_BASE_URL}/teams/${teamId}/agents/${agent.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to remove agent from team");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Removed from team");
    },
    onError: () => toast.error("Failed to remove from team"),
  });

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="size-4 text-violet-500" />
            Teams
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {agentTeams.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ) : agentTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not assigned to any teams.
            </p>
          ) : (
            <div className="space-y-2">
              {agentTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                >
                  <span className="text-sm font-medium">{team.name}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeFromTeam.mutate(team.id)}
                    disabled={removeFromTeam.isPending}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => setAddOpen(true)}
            disabled={availableTeams.length === 0}
          >
            <Plus className="size-4" />
            Add to Team
          </Button>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to team</DialogTitle>
            <DialogDescription>
              Select a team to add{" "}
              <span className="font-medium text-foreground">
                {agent.displayName}
              </span>{" "}
              to.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {availableTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => addToTeam.mutate(team.id)}
                disabled={addToTeam.isPending}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <Users className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{team.name}</p>
                  {team.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {team.description}
                    </p>
                  )}
                </div>
                {addToTeam.isPending && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProjectSection({
  agent,
  agentProjects,
  availableProjects,
  isLoading,
}: {
  agent: Agent;
  agentProjects: ProjectGroup[];
  availableProjects: ProjectGroup[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const addToProject = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(
        `${API_BASE_URL}/projects/${projectId}/agents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: agent.id }),
        },
      );
      if (!res.ok) throw new Error("Failed to add agent to project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Added to project");
      setAddOpen(false);
    },
    onError: () => toast.error("Failed to add to project"),
  });

  const removeFromProject = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(
        `${API_BASE_URL}/projects/${projectId}/agents/${agent.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to remove agent from project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Removed from project");
    },
    onError: () => toast.error("Failed to remove from project"),
  });

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FolderOpen className="size-4 text-teal-500" />
            Projects
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {agentProjects.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ) : agentProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not assigned to any projects.
            </p>
          ) : (
            <div className="space-y-2">
              {agentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                >
                  <span className="text-sm font-medium">{project.name}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeFromProject.mutate(project.id)}
                    disabled={removeFromProject.isPending}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => setAddOpen(true)}
            disabled={availableProjects.length === 0}
          >
            <Plus className="size-4" />
            Add to Project
          </Button>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to project</DialogTitle>
            <DialogDescription>
              Select a project to add{" "}
              <span className="font-medium text-foreground">
                {agent.displayName}
              </span>{" "}
              to.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {availableProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => addToProject.mutate(project.id)}
                disabled={addToProject.isPending}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{project.name}</p>
                  {project.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </div>
                {addToProject.isPending && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
