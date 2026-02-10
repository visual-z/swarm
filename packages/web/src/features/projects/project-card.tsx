import { useQuery } from "@tanstack/react-query";
import { ExternalLink, GitBranch, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { API_BASE_URL } from "@/lib/api";
import { getInitials, getAvatarColor, truncateUrl } from "@/features/agents/utils";
import type { Project } from "./index";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

function getProjectColor(name: string): string {
  const colors = [
    "#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899",
    "#f97316", "#10b981", "#14b8a6", "#f43f5e",
    "#84cc16", "#eab308", "#06b6d4", "#3b82f6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface AgentMini {
  id: string;
  displayName: string;
  status: string;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const color = getProjectColor(project.name);

  const agentsQuery = useQuery<AgentMini[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/agents`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  const memberAgents = (agentsQuery.data ?? []).filter((a) =>
    project.agentIds.includes(a.id)
  );
  const visibleAgents = memberAgents.slice(0, 5);
  const extraCount = memberAgents.length - 5;

  return (
    <Card
      className="group relative cursor-pointer gap-0 overflow-hidden py-0 transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={onClick}
    >
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}44)`,
        }}
      />

      <CardContent className="flex flex-col gap-3.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {project.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="truncate text-sm font-semibold leading-tight text-foreground">
                {project.name}
              </h3>
            </div>
            {project.description && (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {project.repository && (
          <a
            href={project.repository}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <GitBranch className="size-3 shrink-0" />
            <span className="truncate">{truncateUrl(project.repository)}</span>
            <ExternalLink className="ml-auto size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex items-center gap-2">
            {visibleAgents.length > 0 ? (
              <AvatarGroup>
                {visibleAgents.map((agent) => (
                  <Avatar key={agent.id} size="sm">
                    <AvatarFallback
                      className="text-[9px] font-semibold text-white"
                      style={{ backgroundColor: getAvatarColor(agent.displayName) }}
                    >
                      {getInitials(agent.displayName)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {extraCount > 0 && (
                  <AvatarGroupCount className="text-[10px]">
                    +{extraCount}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
            ) : null}
          </div>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Users className="size-3" />
            {project.agentIds.length}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
