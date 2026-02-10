import { MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Message, Agent } from "@/lib/api";

interface RecentMessagesProps {
  messages: Message[];
  agents: Agent[];
  isLoading: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const typeColors: Record<string, "default" | "secondary" | "outline"> = {
  notification: "secondary",
  query: "default",
  response: "outline",
  broadcast: "secondary",
};

export function RecentMessages({
  messages,
  agents,
  isLoading,
}: RecentMessagesProps) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const resolveDisplayName = (id: string) =>
    agentMap.get(id)?.displayName ?? id.slice(0, 8);

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4 text-muted-foreground" />
          Recent Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[340px] px-6 pb-4">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet
            </p>
          ) : (
            <div className="space-y-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <MessageSquare className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-foreground truncate">
                        {resolveDisplayName(msg.from)}
                      </span>
                      <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground truncate">
                        {resolveDisplayName(msg.to)}
                      </span>
                      <Badge variant={typeColors[msg.type] ?? "secondary"} className="ml-auto shrink-0 text-[10px] px-1.5 py-0">
                        {msg.type}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {msg.content}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground pt-0.5">
                    {timeAgo(msg.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
