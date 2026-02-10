import { useQuery } from "@tanstack/react-query";
import { Hexagon } from "lucide-react";
import {
  fetchAgents,
  fetchTeams,
  fetchProjects,
  fetchMessages,
  type Agent,
  type Message,
} from "@/lib/api";
import { StatsCards } from "./stats-cards";
import { AgentGrid } from "./agent-grid";
import { RecentMessages } from "./recent-messages";
import { ActivityChart } from "./activity-chart";
import { QuickActions } from "./quick-actions";

const REFETCH_INTERVAL = 10_000;

export function Dashboard() {
  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    refetchInterval: REFETCH_INTERVAL,
  });

  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
    refetchInterval: REFETCH_INTERVAL,
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    refetchInterval: REFETCH_INTERVAL,
  });

  const agents: Agent[] = agentsQuery.data ?? [];

  const messagesQuery = useQuery({
    queryKey: ["dashboard-messages", agents.map((a) => a.id)],
    queryFn: async () => {
      if (agents.length === 0) return [];
      const results = await Promise.allSettled(
        agents.map((a) => fetchMessages(a.id, 5)),
      );
      const allMessages: Message[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          allMessages.push(...result.value);
        }
      }
      const unique = Array.from(
        new Map(allMessages.map((m) => [m.id, m])).values(),
      );
      unique.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return unique.slice(0, 10);
    },
    enabled: agents.length > 0,
    refetchInterval: REFETCH_INTERVAL,
  });

  const isLoading =
    agentsQuery.isLoading || teamsQuery.isLoading || projectsQuery.isLoading;
  const messages = messagesQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const onlineCount = agents.filter((a) => a.status === "online").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Hexagon className="size-5 text-brand-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Agent orchestration overview
            </p>
          </div>
        </div>
        <QuickActions />
      </div>

      <StatsCards
        agentCount={agents.length}
        messageCount={messages.length}
        teamCount={teams.length}
        projectCount={projects.length}
        onlineCount={onlineCount}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AgentGrid agents={agents} teams={teams} isLoading={agentsQuery.isLoading} />
        <RecentMessages
          messages={messages}
          agents={agents}
          isLoading={messagesQuery.isLoading && agents.length > 0}
        />
      </div>

      <ActivityChart
        messages={messages}
        isLoading={messagesQuery.isLoading && agents.length > 0}
      />
    </div>
  );
}
