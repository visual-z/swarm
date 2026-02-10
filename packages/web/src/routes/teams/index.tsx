import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/")({
  component: TeamsPage,
});

function TeamsPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Teams
        </h1>
        <p className="mt-2 text-muted-foreground">
          Organize agents into collaborative teams
        </p>
      </div>
    </div>
  );
}
