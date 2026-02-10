import { useMemo } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@/lib/api";

interface ActivityChartProps {
  messages: Message[];
  isLoading: boolean;
}

function generateHourlyBuckets(messages: Message[]): {
  label: string;
  count: number;
}[] {
  const now = new Date();
  const buckets: { label: string; count: number }[] = [];

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const label = hour
      .toLocaleTimeString([], { hour: "2-digit", hour12: false })
      .replace(/^24$/, "00");
    buckets.push({ label, count: 0 });
  }

  for (const msg of messages) {
    const msgTime = new Date(msg.createdAt);
    const hoursAgo = Math.floor(
      (now.getTime() - msgTime.getTime()) / (60 * 60 * 1000),
    );
    if (hoursAgo >= 0 && hoursAgo < 24) {
      const bucketIndex = 23 - hoursAgo;
      buckets[bucketIndex].count++;
    }
  }

  return buckets;
}

export function ActivityChart({ messages, isLoading }: ActivityChartProps) {
  const buckets = useMemo(() => generateHourlyBuckets(messages), [messages]);
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const totalMessages = buckets.reduce((sum, b) => sum + b.count, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-muted-foreground" />
            Activity
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {totalMessages} messages · last 24h
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-[3px] h-[180px]">
          {buckets.map((bucket, i) => {
            const heightPercent =
              maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
            const showLabel = i % 4 === 0;

            return (
              <div
                key={i}
                className="group relative flex flex-1 flex-col items-center justify-end h-full"
              >
                <div
                  className="relative w-full rounded-t transition-all duration-300 bg-brand-500/70 hover:bg-brand-500 dark:bg-brand-400/60 dark:hover:bg-brand-400"
                  style={{
                    height: `${Math.max(heightPercent, 2)}%`,
                    minHeight: "2px",
                  }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                    {bucket.count}
                  </div>
                </div>
                {showLabel && (
                  <span className="mt-1.5 text-[9px] text-muted-foreground leading-none">
                    {bucket.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
