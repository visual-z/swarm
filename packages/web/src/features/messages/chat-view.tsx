import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown, MessageSquareDashed, ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { MessageBubble, type Message, type MessageType } from "./message-bubble";
import { MessageInput } from "./message-input";
import type { Agent } from "./conversation-list";

const agentColors = [
  "bg-sky-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-emerald-600",
  "bg-cyan-600",
  "bg-fuchsia-600",
  "bg-lime-600",
];

function getAgentColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return agentColors[Math.abs(hash) % agentColors.length];
}

function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const statusColors: Record<Agent["status"], string> = {
  online: "bg-emerald-500",
  idle: "bg-amber-400",
  busy: "bg-rose-500",
  offline: "bg-zinc-400",
};

interface ChatViewProps {
  agent: Agent | null;
  messages: Message[];
  dashboardId: string;
  onSend: (content: string, type: MessageType) => void;
  isBroadcast?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatView({
  agent,
  messages,
  dashboardId,
  onSend,
  isBroadcast,
  onBack,
  showBackButton,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showNewIndicator, setShowNewIndicator] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [selectedType, setSelectedType] = useState<MessageType>("notification");
  const prevMessageCount = useRef(messages.length);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewIndicator(false);
  }, []);

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      if (isAtBottom) {
        setTimeout(() => scrollToBottom(), 50);
      } else {
        setShowNewIndicator(true);
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, isAtBottom, scrollToBottom]);

  useEffect(() => {
    setTimeout(() => scrollToBottom(), 100);
  }, [agent?.id, isBroadcast, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-slot='scroll-area-viewport']",
    );
    if (!viewport) return;
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    setIsAtBottom(atBottom);
    if (atBottom) setShowNewIndicator(false);
  }, []);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-slot='scroll-area-viewport']",
    );
    if (!viewport) return;
    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (!agent && !isBroadcast) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex size-20 items-center justify-center rounded-2xl bg-muted">
            <MessageSquareDashed className="size-8 text-muted-foreground" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Select a conversation</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Pick an agent from the list or start a new conversation to begin
            messaging.
          </p>
        </div>
      </div>
    );
  }

  const headerTitle = isBroadcast
    ? "Broadcast"
    : agent?.displayName ?? "Unknown";
  const headerSubtitle = isBroadcast
    ? "Message all online agents"
    : agent?.status ?? "";

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let lastDate = "";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}

        {isBroadcast ? (
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white">
            <MessageSquareDashed className="size-4" />
          </div>
        ) : (
          agent && (
            <div className="relative">
              <Avatar>
                <AvatarFallback
                  className={cn(
                    "text-xs font-bold text-white",
                    getAgentColor(agent.id),
                  )}
                >
                  {initials(agent.displayName)}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background",
                  statusColors[agent.status],
                )}
              />
            </div>
          )
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{headerTitle}</h2>
          <p className="truncate text-xs capitalize text-muted-foreground">
            {headerSubtitle}
          </p>
        </div>
      </div>

      <div className="relative flex-1">
        <ScrollArea ref={scrollAreaRef} className="absolute inset-0">
          <div className="flex flex-col gap-3 px-4 py-4">
            {sortedMessages.length === 0 && (
              <div className="py-20 text-center text-sm text-muted-foreground">
                No messages yet. Say hello!
              </div>
            )}

            {sortedMessages.map((msg) => {
              const msgDate = new Date(msg.createdAt).toLocaleDateString(
                undefined,
                { weekday: "short", month: "short", day: "numeric" },
              );
              const showDateSep = msgDate !== lastDate;
              lastDate = msgDate;

              const isSent = msg.from === dashboardId;
              const senderName = isSent
                ? "You"
                : agent?.displayName ?? msg.from.slice(0, 8);

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 py-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                        {msgDate}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isSent={isSent}
                    senderName={senderName}
                  />
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {showNewIndicator && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 gap-1.5 rounded-full shadow-lg"
            onClick={scrollToBottom}
          >
            <ArrowDown className="size-3" />
            New messages
          </Button>
        )}
      </div>

      <MessageInput
        onSend={onSend}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />
    </div>
  );
}
