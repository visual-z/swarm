import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  Clock,
  Globe,
  Radio,
  RefreshCw,
  Server,
  Users,
  Wifi,
} from "lucide-react";

import { API_BASE_URL } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthData {
  status: string;
  version: string;
  uptime: number;
  agentCount: number;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

function getHubUrl(): string {
  return `${window.location.protocol}//${window.location.host}`;
}

export function HubInfo() {
  const {
    data: health,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<HealthData>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error("Failed to fetch health");
      return res.json();
    },
    refetchInterval: 30_000,
    retry: 2,
  });

  async function testConnection() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HealthData = await res.json();
      if (data.status === "ok") {
        toast.success("Connection successful", {
          description: `Hub v${data.version} is running with ${data.agentCount} agent(s)`,
        });
      } else {
        toast.error("Unexpected response", {
          description: `Status: ${data.status}`,
        });
      }
    } catch (err) {
      toast.error("Connection failed", {
        description:
          err instanceof Error ? err.message : "Could not reach the hub",
      });
    }
  }

  const hubUrl = getHubUrl();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
            <Server className="size-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Hub Information</CardTitle>
            <CardDescription>
              Status and details of your SwarmRoom hub
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button variant="default" size="sm" onClick={testConnection}>
              <Activity className="size-3.5" />
              Test Connection
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-4">
                <Skeleton className="size-9 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 py-8 text-center">
            <Wifi className="size-8 text-destructive/60" />
            <div>
              <p className="font-medium text-destructive">
                Unable to reach hub
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check that the server is running at {hubUrl}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCell
              icon={<Globe className="size-4" />}
              label="Hub URL"
              value={hubUrl}
              mono
            />
            <StatCell
              icon={<Radio className="size-4" />}
              label="Status"
              value={
                <Badge
                  variant={
                    health?.status === "ok" ? "default" : "destructive"
                  }
                  className={
                    health?.status === "ok"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : ""
                  }
                >
                  <span className="relative flex size-1.5">
                    <span
                      className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${health?.status === "ok" ? "bg-emerald-500" : "bg-destructive"}`}
                    />
                    <span
                      className={`relative inline-flex size-1.5 rounded-full ${health?.status === "ok" ? "bg-emerald-500" : "bg-destructive"}`}
                    />
                  </span>
                  {health?.status === "ok" ? "Online" : "Degraded"}
                </Badge>
              }
            />
            <StatCell
              icon={<Server className="size-4" />}
              label="Version"
              value={`v${health?.version ?? "0.0.0"}`}
              mono
            />
            <StatCell
              icon={<Clock className="size-4" />}
              label="Uptime"
              value={health ? formatUptime(health.uptime) : "—"}
              mono
            />
            <StatCell
              icon={<Users className="size-4" />}
              label="Connected Agents"
              value={String(health?.agentCount ?? 0)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCell({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <div
          className={`mt-0.5 truncate text-sm font-semibold ${mono ? "font-mono text-[13px]" : ""}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
