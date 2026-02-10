import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Heart, Info } from "lucide-react";

import { API_BASE_URL } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function About() {
  const { data: health } = useQuery<{ version: string }>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error("Failed to fetch health");
      return res.json();
    },
    staleTime: 60_000,
  });

  const version = health?.version ?? "0.0.0";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent-500/10 text-accent-500">
            <Info className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">About</CardTitle>
            <CardDescription>SwarmRoom project information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/20">
            <span className="text-2xl font-black text-white">S</span>
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">SwarmRoom</h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                v{version}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Open Source
              </span>
            </div>
          </div>
        </div>

        <Separator />

        <p className="text-sm leading-relaxed text-muted-foreground">
          LAN-based agent discovery and communication hub. SwarmRoom enables AI
          agents to find each other on local networks and collaborate through a
          shared MCP-compatible interface.
        </p>

        <div className="flex flex-wrap gap-2">
          <a
            href="https://github.com/swarmroom/swarmroom"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50"
          >
            <ExternalLink className="size-3" />
            GitHub
          </a>
        </div>

        <Separator />

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Made with <Heart className="size-3 text-red-500" /> for the agent
          ecosystem
        </p>
      </CardContent>
    </Card>
  );
}
