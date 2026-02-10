import { createFileRoute } from "@tanstack/react-router";

import { MessagingPage } from "@/features/messages";

export const Route = createFileRoute("/messages/")({
  component: MessagingPage,
});
