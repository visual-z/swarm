import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AgentActions } from "./agent-actions";
import type { Agent } from "./index";
import { formatRelativeTime, getInitials, getAvatarColor, statusConfig } from "./utils";

interface AgentCardProps {
  agent: Agent;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function AgentCard({ agent, onDelete, isDeleting }: AgentCardProps) {
  const initials = getInitials(agent.displayName);
  const avatarColor = getAvatarColor(agent.displayName);
  const status = statusConfig[agent.status] ?? statusConfig.offline;

  return (
    <Card className="group relative gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${avatarColor}88, ${avatarColor}22)`,
        }}
      />
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between">
          <Link
            to="/agents/$agentId"
            params={{ agentId: agent.id }}
            className="flex items-center gap-3"
          >
            <Avatar size="lg">
              <AvatarFallback
                className="text-sm font-semibold text-white"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold leading-tight text-foreground">
                  {agent.displayName}
                </h3>
                <span
                  className={`inline-block size-2 shrink-0 rounded-full ${status.dot}`}
                  title={status.label}
                />
              </div>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                {agent.name}
              </p>
            </div>
          </Link>
          <AgentActions agent={agent} onDelete={onDelete} isDeleting={isDeleting} />
        </div>

        {agent.agentCard?.skills && agent.agentCard.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.agentCard.skills.slice(0, 4).map((skill) => (
              <Badge
                key={skill.id}
                variant="secondary"
                className="text-[10px] leading-tight"
              >
                {skill.name}
              </Badge>
            ))}
            {agent.agentCard.skills.length > 4 && (
              <Badge variant="outline" className="text-[10px] leading-tight">
                +{agent.agentCard.skills.length - 4}
              </Badge>
            )}
          </div>
        )}

        {agent.agentCard?.teams && agent.agentCard.teams.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.agentCard.teams.map((team) => (
              <Badge
                key={team}
                variant="outline"
                className="text-[10px] leading-tight"
              >
                {team}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
          <Badge variant={status.variant} className="text-[10px]">
            {status.label}
          </Badge>
          {agent.lastHeartbeat && (
            <span className="text-[10px] text-muted-foreground">
              {formatRelativeTime(agent.lastHeartbeat)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
