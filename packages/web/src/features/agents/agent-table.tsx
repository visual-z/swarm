import { Link } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AgentActions } from "./agent-actions";
import type { Agent } from "./index";
import {
  formatRelativeTime,
  getInitials,
  getAvatarColor,
  statusConfig,
  truncateUrl,
} from "./utils";

interface AgentTableProps {
  agents: Agent[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function AgentTable({ agents, onDelete, deletingId }: AgentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead>Agent</TableHead>
          <TableHead className="hidden md:table-cell">URL</TableHead>
          <TableHead className="hidden lg:table-cell">Teams</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Last Seen</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => {
          const status = statusConfig[agent.status] ?? statusConfig.offline;
          const initials = getInitials(agent.displayName);
          const avatarColor = getAvatarColor(agent.displayName);

          return (
            <TableRow key={agent.id}>
              <TableCell>
                <span
                  className={`inline-block size-2 rounded-full ${status.dot}`}
                  title={status.label}
                />
              </TableCell>
              <TableCell>
                <Link
                  to="/agents/$agentId"
                  params={{ agentId: agent.id }}
                  className="flex items-center gap-2.5"
                >
                  <Avatar size="sm">
                    <AvatarFallback
                      className="text-[10px] font-semibold text-white"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-tight">
                      {agent.displayName}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {agent.name}
                    </p>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="font-mono text-xs text-muted-foreground">
                  {truncateUrl(agent.url)}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {agent.agentCard?.teams?.map((team) => (
                    <Badge
                      key={team}
                      variant="outline"
                      className="text-[10px] leading-tight"
                    >
                      {team}
                    </Badge>
                  ))}
                  {(!agent.agentCard?.teams || agent.agentCard.teams.length === 0) && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={status.variant} className="text-[10px]">
                  {status.label}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <span className="text-xs text-muted-foreground">
                  {agent.lastHeartbeat
                    ? formatRelativeTime(agent.lastHeartbeat)
                    : "Never"}
                </span>
              </TableCell>
              <TableCell>
                <AgentActions
                  agent={agent}
                  onDelete={onDelete}
                  isDeleting={deletingId === agent.id}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
