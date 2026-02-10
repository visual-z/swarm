import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Projects
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your project workspaces
        </p>
      </div>
    </div>
  );
}
