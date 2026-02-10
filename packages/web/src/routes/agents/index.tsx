import { createFileRoute } from "@tanstack/react-router";
import { AgentsList } from "@/features/agents";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/agents/")({
  component: AgentsPage,
});

function AgentsPage() {
  return (
    <ErrorBoundary featureName="Agents">
      <AgentsList />
    </ErrorBoundary>
  );
}
