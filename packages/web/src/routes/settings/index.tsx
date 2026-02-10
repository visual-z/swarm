import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Configure your SwarmRoom instance
        </p>
      </div>
    </div>
  );
}
