import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL, type Message, type MessageType } from "@/lib/api";
import { formatRelativeTime } from "../utils";

const typeStyles: Record<
  MessageType,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  notification: { label: "Notification", variant: "secondary" },
  query: { label: "Query", variant: "default" },
  response: { label: "Response", variant: "outline" },
  broadcast: { label: "Broadcast", variant: "secondary" },
};

interface AgentActivityProps {
  agentId: string;
}

export function AgentActivity({ agentId }: AgentActivityProps) {
  const messagesQuery = useQuery<Message[]>({
    queryKey: ["agent-messages", agentId],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/messages?agentId=${agentId}&limit=20`,
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    refetchInterval: 15_000,
    retry: 1,
  });

  if (messagesQuery.isLoading) {
    return <ActivitySkeleton />;
  }

  const messages = messagesQuery.data ?? [];

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16">
        <MessageSquare className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          No activity yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Messages sent to or from this agent will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {messages.map((msg) => {
        const isSent = msg.from === agentId;
        const typeStyle = typeStyles[msg.type] ?? typeStyles.notification;

        return (
          <div
            key={msg.id}
            className="group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/40"
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              {isSent ? (
                <ArrowUpRight className="size-4 text-blue-500" />
              ) : (
                <ArrowDownLeft className="size-4 text-emerald-500" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {isSent ? "Sent to" : "Received from"}{" "}
                  <span className="font-semibold text-foreground">
                    {isSent ? msg.to : msg.from}
                  </span>
                </span>
                <Badge
                  variant={typeStyle.variant}
                  className="text-[9px] leading-tight"
                >
                  {typeStyle.label}
                </Badge>
                <span className="ml-auto text-[10px] text-muted-foreground/60">
                  {formatRelativeTime(msg.createdAt)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                {msg.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
