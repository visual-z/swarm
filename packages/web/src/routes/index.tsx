import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/features/dashboard";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <ErrorBoundary featureName="Dashboard">
      <Dashboard />
    </ErrorBoundary>
  );
}
