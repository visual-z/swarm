import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/messages/")({
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Messages
        </h1>
        <p className="mt-2 text-muted-foreground">
          View message streams and conversations
        </p>
      </div>
    </div>
  );
}
