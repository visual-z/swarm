import { createFileRoute } from "@tanstack/react-router";
import { MessagingPage } from "@/features/messages";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/messages/")({
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <ErrorBoundary featureName="Messages">
      <MessagingPage />
    </ErrorBoundary>
  );
}
