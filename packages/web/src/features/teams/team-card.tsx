import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { getInitials, getAvatarColor } from "@/features/agents/utils";
import type { TeamListItem } from "./index";

interface TeamCardProps {
  team: TeamListItem;
  onClick: () => void;
}

export function TeamCard({ team, onClick }: TeamCardProps) {
  const agentNames = team.topAgentNames ?? [];
  const overflow = team.agentCount - agentNames.length;

  return (
    <Card
      className="group relative cursor-pointer gap-0 overflow-hidden py-0 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      onClick={onClick}
    >
      <div
        className="absolute inset-y-0 left-0 w-1 transition-all duration-200 group-hover:w-1.5"
        style={{ backgroundColor: team.color ?? "#6366f1" }}
      />

      <CardContent className="flex flex-col gap-4 p-5 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold leading-tight text-foreground">
              {team.name}
            </h3>
            {team.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                {team.description}
              </p>
            )}
          </div>

          <Badge
            variant="secondary"
            className="shrink-0 gap-1 tabular-nums text-xs"
          >
            <Users className="size-3" />
            {team.agentCount}
          </Badge>
        </div>

        <div className="flex items-center gap-3 border-t border-border/40 pt-3">
          {agentNames.length > 0 ? (
            <AvatarGroup>
              {agentNames.slice(0, 5).map((name) => (
                <Avatar key={name} size="sm">
                  <AvatarFallback
                    className="text-[9px] font-semibold text-white"
                    style={{ backgroundColor: getAvatarColor(name) }}
                  >
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {overflow > 0 && (
                <AvatarGroupCount className="text-[10px] font-medium">
                  +{overflow}
                </AvatarGroupCount>
              )}
            </AvatarGroup>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              No members yet
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="absolute inset-y-0 left-0 w-1 bg-muted" />
      <CardContent className="flex flex-col gap-4 p-5 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="flex gap-1 border-t border-border/40 pt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="size-6 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
