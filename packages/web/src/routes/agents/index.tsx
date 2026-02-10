import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/agents/")({
  component: AgentsPage,
});

function AgentsPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Agents
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage and monitor your AI agents
        </p>
      </div>
    </div>
  );
}
