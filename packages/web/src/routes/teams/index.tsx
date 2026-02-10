import { createFileRoute } from "@tanstack/react-router";
import { TeamsList } from "@/features/teams";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/teams/")({
  component: TeamsPage,
});

function TeamsPage() {
  return (
    <ErrorBoundary featureName="Teams">
      <TeamsList />
    </ErrorBoundary>
  );
}
