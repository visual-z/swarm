import { useRef, useCallback, type KeyboardEvent } from "react";
import { Send, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import type { MessageType } from "./message-bubble";

const messageTypes: { value: MessageType; label: string }[] = [
  { value: "notification", label: "Notice" },
  { value: "query", label: "Query" },
];

interface MessageInputProps {
  onSend: (content: string, type: MessageType) => void;
  disabled?: boolean;
  selectedType: MessageType;
  onTypeChange: (type: MessageType) => void;
}

export function MessageInput({
  onSend,
  disabled,
  selectedType,
  onTypeChange,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

        <div
          className={cn(
            "flex min-h-[36px] flex-1 items-end rounded-xl border bg-muted/40 px-3 py-2",
            "transition-colors focus-within:border-ring focus-within:bg-background",
          )}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Type a message..."
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
          className="size-9 shrink-0 rounded-xl"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
