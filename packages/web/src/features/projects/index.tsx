import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Plus } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "./project-card";
import { ProjectDetail } from "./project-detail";
import { CreateProjectDialog } from "./create-project-dialog";

export interface Project {
  id: string;
  name: string;
  description?: string;
  repository?: string;
  agentIds: string[];
  createdAt: string;
}

export function ProjectsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const projectsQuery = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/projects`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    refetchInterval: 10_000,
    retry: 1,
  });

  const selectedProject = projectsQuery.data?.find((p) => p.id === selectedId);

  if (projectsQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const projects = projectsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize agents into project workspaces with linked repositories
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="size-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState onCreateClick={() => setCreateOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedId(project.id)}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-20">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <FolderKanban className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">No projects yet</h2>
      <p className="mt-1.5 max-w-sm text-center text-sm text-muted-foreground">
        Create a project to group agents around a shared codebase or goal.
        Link a repository and assign team members.
      </p>
      <Button className="mt-6" size="sm" onClick={onCreateClick}>
        <Plus className="size-4" />
        Create your first project
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
