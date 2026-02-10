import { useRouterState, useNavigate } from "@tanstack/react-router";
import { SearchIcon, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWsStore, type ConnectionStatus } from "@/stores/ws-store";
import { API_BASE_URL } from "@/lib/api";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/agents": "Agents",
  "/messages": "Messages",
  "/teams": "Teams",
  "/projects": "Projects",
  "/settings": "Settings",
};

function getBreadcrumb(pathname: string): string[] {
  if (pathname === "/") return ["Dashboard"];

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: string[] = [];

  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    crumbs.push(routeLabels[path] || seg.charAt(0).toUpperCase() + seg.slice(1));
  }

  return crumbs;
}

const statusConfig: Record<
  ConnectionStatus,
  { color: string; pulse: string; label: string }
> = {
  connected: {
    color: "bg-emerald-500",
    pulse: "",
    label: "Connected",
  },
  connecting: {
    color: "bg-amber-500",
    pulse: "animate-pulse",
    label: "Reconnecting…",
  },
  disconnected: {
    color: "bg-red-500",
    pulse: "",
    label: "Disconnected",
  },
};

function ConnectionIndicator() {
  const status = useWsStore((s) => s.connectionStatus);
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-1.5" title={config.label}>
      <span
        className={`size-2 rounded-full ${config.color} ${config.pulse}`}
      />
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {config.label}
      </span>
    </div>
  );
}

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const crumbs = getBreadcrumb(routerState.location.pathname);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["a2p-unread"],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/messages?agentId=dashboard&limit=200`,
      );
      if (!res.ok) return 0;
      const json = await res.json();
      const msgs: { to: string; senderType: string; read: boolean; type: string }[] =
        json.data ?? [];
      return msgs.filter(
        (m) =>
          m.to === "dashboard" &&
          m.senderType === "agent" &&
          !m.read &&
          m.type !== "broadcast",
      ).length;
    },
    refetchInterval: 5_000,
  });

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4!" />
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm">
            {crumbs.map((crumb, i) => (
              <li key={crumb} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-muted-foreground">/</span>
                )}
                <span
                  className={
                    i === crumbs.length - 1
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {crumb}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => navigate({ to: "/messages" })}
              className={cn(
                "relative flex size-8 items-center justify-center rounded-lg transition-colors",
                "hover:bg-accent text-muted-foreground hover:text-foreground",
              )}
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-2 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`
              : "No new messages"}
          </TooltipContent>
        </Tooltip>
        <ConnectionIndicator />
        <Separator orientation="vertical" className="h-4!" />
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 text-muted-foreground md:flex"
          onClick={onOpenCommandPalette}
        >
          <SearchIcon className="size-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="pointer-events-none ml-2 hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>
    </header>
  );
}
