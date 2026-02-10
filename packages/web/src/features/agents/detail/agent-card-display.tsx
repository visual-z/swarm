import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Zap,
  Tag,
  ChevronDown,
  ChevronRight,
  Code2,
  Sparkles,
  Globe,
  FileJson,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { API_BASE_URL } from "@/lib/api";

interface Skill {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

interface AgentCardData {
  name: string;
  description: string;
  version: string;
  url: string;
  skills: Skill[];
  teams: string[];
  projectGroups: string[];
}

interface AgentCardDisplayProps {
  agentId: string;
}

export function AgentCardDisplay({ agentId }: AgentCardDisplayProps) {
  const [jsonExpanded, setJsonExpanded] = useState(false);

  const cardQuery = useQuery<AgentCardData>({
    queryKey: ["agent-card", agentId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/agents/${agentId}/card`);
      if (!res.ok) throw new Error("Failed to fetch agent card");
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  if (cardQuery.isLoading) {
    return <CardLoadingSkeleton />;
  }

  if (cardQuery.isError || !cardQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16">
        <FileJson className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          No Agent Card available
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          This agent hasn&apos;t published an A2A Agent Card yet.
        </p>
      </div>
    );
  }

  const card = cardQuery.data;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-amber-500" />
            Description
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {card.description || "No description provided."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {card.version && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono">
                v{card.version}
              </span>
            )}
            {card.url && (
              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 transition-colors hover:text-foreground"
              >
                <Globe className="size-3" />
                {card.url}
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="size-4 text-blue-500" />
            Skills
            {card.skills.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {card.skills.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          {card.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills declared.</p>
          ) : (
            <div className="space-y-3">
              {card.skills.map((skill) => (
                <div key={skill.id} className="group">
                  <div className="flex items-center gap-2">
                    <Code2 className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium">{skill.name}</span>
                  </div>
                  <p className="ml-5.5 mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {skill.description}
                  </p>
                  {skill.tags.length > 0 && (
                    <div className="ml-5.5 mt-1.5 flex flex-wrap gap-1">
                      {skill.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          <Tag className="mr-0.5 size-2.5" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 lg:col-span-2">
        <CardHeader className="px-5 py-4">
          <button
            type="button"
            onClick={() => setJsonExpanded((prev) => !prev)}
            className="flex w-full items-center gap-2 text-left"
          >
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileJson className="size-4 text-muted-foreground" />
              Raw Agent Card
            </CardTitle>
            {jsonExpanded ? (
              <ChevronDown className="ml-auto size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {jsonExpanded && (
          <>
            <Separator />
            <CardContent className="px-5 py-4">
              <pre className="max-h-96 overflow-auto rounded-lg bg-muted/60 p-4 font-mono text-xs leading-relaxed text-foreground/80">
                {JSON.stringify(card, null, 2)}
              </pre>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

function CardLoadingSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-20 rounded-xl lg:col-span-2" />
    </div>
  );
}
