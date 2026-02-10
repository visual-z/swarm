import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/projects";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/projects/")({
  component: ProjectsRoute,
});

function ProjectsRoute() {
  return (
    <ErrorBoundary featureName="Projects">
      <ProjectsPage />
    </ErrorBoundary>
  );
}
