import { useRef, useCallback, type KeyboardEvent } from "react";
import { Send, ChevronDown, User, Bot } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { MessageType, SenderType } from "./message-bubble";

const messageTypes: { value: MessageType; label: string }[] = [
  { value: "notification", label: "Notice" },
  { value: "query", label: "Query" },
];

interface MessageInputProps {
  onSend: (content: string, type: MessageType) => void;
  disabled?: boolean;
  selectedType: MessageType;
  onTypeChange: (type: MessageType) => void;
  senderType: SenderType;
  onSenderTypeChange: (type: SenderType) => void;
}

export function MessageInput({
  onSend,
  disabled,
  selectedType,
  onTypeChange,
  senderType,
  onSenderTypeChange,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendingAsPerson = senderType === "person";

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const content = el.value.trim();
    if (!content) return;
    onSend(content, selectedType);
    el.value = "";
    el.style.height = "auto";
  }, [onSend, selectedType]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const cycleType = useCallback(() => {
    const currentIdx = messageTypes.findIndex((t) => t.value === selectedType);
    const next = messageTypes[(currentIdx + 1) % messageTypes.length];
    onTypeChange(next.value);
  }, [selectedType, onTypeChange]);

  const toggleSenderType = useCallback(() => {
    onSenderTypeChange(sendingAsPerson ? "agent" : "person");
  }, [sendingAsPerson, onSenderTypeChange]);

  const currentTypeLabel =
    messageTypes.find((t) => t.value === selectedType)?.label ?? "Notice";

  return (
    <div className="border-t bg-background/80 p-3 backdrop-blur-sm">
      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1 text-xs font-medium"
          onClick={cycleType}
        >
          {currentTypeLabel}
          <ChevronDown className="size-3 opacity-50" />
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSenderType}
              className={cn(
                "relative flex size-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200",
                sendingAsPerson
                  ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-600 dark:border-indigo-500/40 dark:text-indigo-400"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
              )}
            >
              {sendingAsPerson ? (
                <User className="size-4" />
              ) : (
                <Bot className="size-4" />
              )}
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-background transition-colors",
                  sendingAsPerson ? "bg-indigo-500" : "bg-zinc-400",
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {sendingAsPerson ? "Sending as Person" : "Sending as Agent"}
            <span className="ml-1 text-muted-foreground">(click to toggle)</span>
          </TooltipContent>
        </Tooltip>

        <div
          className={cn(
            "flex min-h-[36px] flex-1 items-end rounded-xl border px-3 py-2",
            "transition-colors focus-within:border-ring focus-within:bg-background",
            sendingAsPerson
              ? "bg-indigo-50/50 dark:bg-indigo-950/20"
              : "bg-muted/40",
          )}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              sendingAsPerson
                ? "Send as person..."
                : "Type a message..."
            }
            disabled={disabled}
            className={cn(
              "w-full resize-none bg-transparent text-sm leading-relaxed outline-none",
              "placeholder:text-muted-foreground/60",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            onInput={autoResize}
            onKeyDown={handleKeyDown}
          />
        </div>

        <Button
          type="button"
          size="icon"
          disabled={disabled}
          onClick={handleSend}
          className={cn(
            "size-9 shrink-0 rounded-xl",
            sendingAsPerson && "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600",
          )}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
