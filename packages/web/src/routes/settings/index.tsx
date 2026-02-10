import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/settings";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/settings/")({
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <ErrorBoundary featureName="Settings">
      <SettingsPage />
    </ErrorBoundary>
  );
}
