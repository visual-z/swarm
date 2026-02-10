import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface StatusInfo {
  label: string;
  dot: string;
  variant: BadgeVariant;
}

export const statusConfig: Record<string, StatusInfo> = {
  online: {
    label: "Online",
    dot: "bg-emerald-500",
    variant: "default",
  },
  offline: {
    label: "Offline",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    variant: "secondary",
  },
  busy: {
    label: "Busy",
    dot: "bg-amber-500",
    variant: "outline",
  },
  idle: {
    label: "Idle",
    dot: "bg-sky-400",
    variant: "outline",
  },
};

export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function getInitials(name: string): string {
  const parts = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s\-_]+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#2563eb",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function truncateUrl(url: string, maxLen = 32): string {
  try {
    const u = new URL(url);
    const short = u.host + u.pathname;
    return short.length > maxLen ? short.substring(0, maxLen) + "…" : short;
  } catch {
    return url.length > maxLen ? url.substring(0, maxLen) + "…" : url;
  }
}
