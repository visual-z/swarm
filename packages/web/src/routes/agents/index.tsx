import { createFileRoute } from "@tanstack/react-router";
import { AgentsList } from "@/features/agents";

export const Route = createFileRoute("/agents/")({
  component: AgentsPage,
});

function AgentsPage() {
  return <AgentsList />;
}
