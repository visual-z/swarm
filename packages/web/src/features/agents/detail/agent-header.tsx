import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  Trash2,
  Clock,
  Wifi,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Agent } from "@/lib/api";
import {
  getInitials,
  getAvatarColor,
  statusConfig,
  formatRelativeTime,
  truncateUrl,
} from "../utils";

interface AgentHeaderProps {
  agent: Agent;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function AgentHeader({ agent, onDelete, isDeleting }: AgentHeaderProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const initials = getInitials(agent.displayName);
  const avatarColor = getAvatarColor(agent.displayName);
  const status = statusConfig[agent.status] ?? statusConfig.offline;

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card">
        <div
          className="h-24 w-full"
          style={{
            background: `linear-gradient(135deg, ${avatarColor}44 0%, ${avatarColor}18 40%, transparent 70%)`,
          }}
        />

        <div className="relative px-6 pb-6">
          <div className="-mt-10 flex items-end gap-5">
            <div
              className="flex size-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg ring-4 ring-card"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-4 pt-1">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
                    {agent.displayName}
                  </h1>
                  <Badge variant={status.variant} className="gap-1.5 text-xs">
                    <span
                      className={`inline-block size-1.5 rounded-full ${status.dot} ${agent.status === "online" ? "animate-pulse" : ""}`}
                    />
                    {status.label}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate font-mono text-sm text-muted-foreground">
                  {agent.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    navigate({
                      to: "/messages",
                      search: { to: agent.id },
                    })
                  }
                >
                  <MessageSquare className="size-4" />
                  Send Message
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {agent.url && (
              <a
                href={agent.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
                {truncateUrl(agent.url, 40)}
              </a>
            )}

            {agent.agentCard?.version && (
              <>
                <Separator orientation="vertical" className="!h-4" />
                <span className="font-mono text-xs">
                  v{agent.agentCard.version}
                </span>
              </>
            )}

            {agent.lastHeartbeat && (
              <>
                <Separator orientation="vertical" className="!h-4" />
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {formatRelativeTime(agent.lastHeartbeat)}
                </span>
              </>
            )}

            {agent.status === "online" && (
              <>
                <Separator orientation="vertical" className="!h-4" />
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Wifi className="size-3.5" />
                  Connected
                </span>
              </>
            )}
          </div>

          {((agent.agentCard?.teams?.length ?? 0) > 0 ||
            (agent.agentCard?.projectGroups?.length ?? 0) > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {agent.agentCard?.teams?.map((team) => (
                <Badge key={team} variant="secondary" className="text-xs">
                  {team}
                </Badge>
              ))}
              {agent.agentCard?.projectGroups?.map((project) => (
                <Badge key={project} variant="outline" className="text-xs">
                  {project}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Link
          to="/agents"
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-lg bg-card/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Agents
        </Link>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove agent</DialogTitle>
            <DialogDescription>
              This will set{" "}
              <span className="font-medium text-foreground">
                {agent.displayName}
              </span>{" "}
              to offline. The agent can re-register at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                onDelete();
                setConfirmOpen(false);
              }}
            >
              {isDeleting ? "Removing\u2026" : "Remove Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
