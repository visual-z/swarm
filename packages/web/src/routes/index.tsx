import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Swarm<span className="text-primary">Room</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Local-first AI agent orchestration
        </p>
      </div>
    </div>
  );
}
