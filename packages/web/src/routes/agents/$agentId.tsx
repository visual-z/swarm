import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/agents/$agentId")({
  component: AgentDetailPage,
});

function AgentDetailPage() {
  const { agentId } = Route.useParams();

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Agent Detail
        </h1>
        <p className="mt-2 text-muted-foreground">
          Viewing agent <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{agentId}</code>
        </p>
      </div>
    </div>
  );
}
