import { createFileRoute } from "@tanstack/react-router";
import { AgentDetail } from "@/features/agents/detail";

export const Route = createFileRoute("/agents/$agentId")({
  component: AgentDetailPage,
});

function AgentDetailPage() {
  const { agentId } = Route.useParams();

  return <AgentDetail agentId={agentId} />;
}
