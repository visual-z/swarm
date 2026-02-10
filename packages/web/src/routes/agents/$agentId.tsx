import { createFileRoute } from "@tanstack/react-router";
import { AgentDetail } from "@/features/agents/detail";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/agents/$agentId")({
  component: AgentDetailPage,
});

function AgentDetailPage() {
  const { agentId } = Route.useParams();

  return (
    <ErrorBoundary featureName="Agent Detail">
      <AgentDetail agentId={agentId} />
    </ErrorBoundary>
  );
}
