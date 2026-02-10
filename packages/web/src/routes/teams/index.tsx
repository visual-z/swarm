import { createFileRoute } from "@tanstack/react-router";
import { TeamsList } from "@/features/teams";

export const Route = createFileRoute("/teams/")({
  component: TeamsPage,
});

function TeamsPage() {
  return <TeamsList />;
}
