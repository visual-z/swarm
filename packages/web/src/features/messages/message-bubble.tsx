import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Bot,
  HelpCircle,
  Reply,
  Megaphone,
  Bell,
} from "lucide-react";

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
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: typeof Bell;
  }
> = {
  notification: { label: "Notice", variant: "secondary", icon: Bell },
  query: { label: "Query", variant: "default", icon: HelpCircle },
  response: { label: "Reply", variant: "outline", icon: Reply },
  broadcast: { label: "Broadcast", variant: "destructive", icon: Megaphone },
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
  const isPerson = message.senderType === "person";
  const TypeIcon = config.icon;

  return (
    <div
      className={cn(
        "group flex w-full gap-2.5",
        isSent ? "justify-end" : "justify-start",
      )}
    >
      {!isSent && (
        <div
          className={cn(
            "mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg",
            isPerson
              ? "bg-indigo-500/15 text-indigo-500 dark:bg-indigo-400/15 dark:text-indigo-400"
              : "bg-zinc-500/15 text-zinc-500 dark:bg-zinc-400/15 dark:text-zinc-400",
          )}
        >
          {isPerson ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
        </div>
      )}

      <div
        className={cn(
          "relative max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          "transition-all duration-200 hover:shadow-md",
          isSent
            ? isPerson
              ? "rounded-br-md bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 dark:bg-indigo-500"
              : "rounded-br-md bg-primary text-primary-foreground shadow-sm"
            : isPerson
              ? "rounded-bl-md border border-indigo-200/60 bg-indigo-50/80 text-foreground shadow-sm dark:border-indigo-500/20 dark:bg-indigo-950/40"
              : "rounded-bl-md bg-muted text-foreground shadow-sm",
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
                isSent
                  ? isPerson
                    ? "text-white/70"
                    : "text-primary-foreground/70"
                  : isPerson
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground",
              )}
            >
              {senderName}
            </span>
          )}

          <span
            className={cn(
              "inline-flex items-center text-[9px]",
              isSent
                ? isPerson ? "text-white/50" : "text-primary-foreground/50"
                : isPerson ? "text-indigo-500/60 dark:text-indigo-400/60" : "text-muted-foreground/50",
            )}
          >
            {isPerson ? <User className="size-2.5" /> : <Bot className="size-2.5" />}
          </span>

          <Badge
            variant={config.variant}
            className={cn(
              "h-4 gap-0.5 px-1.5 text-[9px] font-semibold uppercase tracking-widest",
              isSent && isPerson && "border-white/20 bg-white/20 text-white",
              isSent &&
                !isPerson &&
                config.variant === "default" &&
                "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/10",
              isSent &&
                !isPerson &&
                config.variant === "secondary" &&
                "bg-primary-foreground/15 text-primary-foreground/80 border-primary-foreground/10",
              isSent &&
                !isPerson &&
                config.variant === "outline" &&
                "border-primary-foreground/30 text-primary-foreground/70 bg-transparent",
              isSent &&
                !isPerson &&
                config.variant === "destructive" &&
                "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/10",
              !isSent &&
                isPerson &&
                "border-indigo-300/50 bg-indigo-100/80 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-900/40 dark:text-indigo-400",
            )}
          >
            <TypeIcon className="size-2.5" />
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
              isSent
                ? isPerson ? "text-white/50" : "text-primary-foreground/50"
                : isPerson ? "text-indigo-500/50 dark:text-indigo-400/50" : "text-muted-foreground/70",
            )}
          >
            {formatTime(message.createdAt)}
          </span>
          {isSent && (
            <span
              className={cn(
                "text-[10px]",
                message.read
                  ? isPerson ? "text-white/70" : "text-primary-foreground/70"
                  : isPerson ? "text-white/40" : "text-primary-foreground/40",
              )}
            >
              {message.read ? "Read" : "Sent"}
            </span>
          )}
        </div>
      </div>

      {isSent && (
        <div
          className={cn(
            "mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg",
            isPerson
              ? "bg-indigo-500/15 text-indigo-500 dark:bg-indigo-400/15 dark:text-indigo-400"
              : "bg-primary/15 text-primary",
          )}
        >
          {isPerson ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
        </div>
      )}
    </div>
  );
}
