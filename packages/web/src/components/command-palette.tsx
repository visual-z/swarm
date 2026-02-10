import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bot,
  Gauge,
  FolderKanban,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const pages = [
  { title: "Dashboard", href: "/", icon: Gauge },
  { title: "Agents", href: "/agents", icon: Bot },
  { title: "Messages", href: "/messages", icon: MessageSquare },
  { title: "Teams", href: "/teams", icon: Users },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Settings", href: "/settings", icon: Settings },
] as const;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  function handleSelect(href: string) {
    onOpenChange(false);
    navigate({ to: href });
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Navigate to a page or run a command"
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              value={page.title}
              onSelect={() => handleSelect(page.href)}
            >
              <page.icon className="size-4" />
              <span>{page.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
