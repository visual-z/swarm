import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type MessageType = "notification" | "query" | "response" | "broadcast";
export type SenderType = "agent" | "person";

export interface Message {
  id: string;
  from: string;
  to: string;
  senderType: SenderType;
  content: string;
  type: MessageType;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const typeConfig: Record<
  MessageType,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  notification: { label: "Notice", variant: "secondary" },
  query: { label: "Query", variant: "default" },
  response: { label: "Reply", variant: "outline" },
  broadcast: { label: "Broadcast", variant: "destructive" },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  senderName?: string;
}

export function MessageBubble({ message, isSent, senderName }: MessageBubbleProps) {
  const config = typeConfig[message.type];

  return (
    <div
      className={cn(
        "group flex w-full gap-2",
        isSent ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "relative max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          "transition-shadow duration-200 hover:shadow-md",
          isSent
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md",
        )}
      >
        <div
          className={cn(
            "mb-1 flex items-center gap-1.5",
            isSent ? "justify-end" : "justify-start",
          )}
        >
          {senderName && (
            <span
              className={cn(
                "text-[11px] font-medium tracking-wide uppercase",
                isSent ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {senderName}
            </span>
          )}
          <Badge
            variant={config.variant}
            className={cn(
              "h-4 px-1.5 text-[9px] font-semibold uppercase tracking-widest",
              isSent &&
                config.variant === "default" &&
                "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/10",
              isSent &&
                config.variant === "secondary" &&
                "bg-primary-foreground/15 text-primary-foreground/80 border-primary-foreground/10",
              isSent &&
                config.variant === "outline" &&
                "border-primary-foreground/30 text-primary-foreground/70 bg-transparent",
              isSent &&
                config.variant === "destructive" &&
                "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/10",
            )}
          >
            {config.label}
          </Badge>
        </div>

        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        <div
          className={cn(
            "mt-1 flex items-center gap-1",
            isSent ? "justify-end" : "justify-start",
          )}
        >
          <span
            className={cn(
              "text-[10px] tabular-nums",
              isSent ? "text-primary-foreground/50" : "text-muted-foreground/70",
            )}
          >
            {formatTime(message.createdAt)}
          </span>
          {isSent && (
            <span
              className={cn(
                "text-[10px]",
                message.read
                  ? "text-primary-foreground/70"
                  : "text-primary-foreground/40",
              )}
            >
              {message.read ? "Read" : "Sent"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
