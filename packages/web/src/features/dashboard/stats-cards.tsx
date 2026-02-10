import { Bot, MessageSquare, Users, FolderKanban, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/use-count-up";

interface StatsCardsProps {
  agentCount: number;
  messageCount: number;
  teamCount: number;
  projectCount: number;
  onlineCount: number;
  isLoading: boolean;
}

const stats = [
  {
    key: "agents" as const,
    label: "Total Agents",
    icon: Bot,
    color: "text-brand-500",
    bgColor: "bg-brand-500/10",
    trendUp: true,
  },
  {
    key: "messages" as const,
    label: "Active Messages",
    icon: MessageSquare,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    trendUp: true,
  },
  {
    key: "teams" as const,
    label: "Teams",
    icon: Users,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    trendUp: false,
  },
  {
    key: "projects" as const,
    label: "Projects",
    icon: FolderKanban,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    trendUp: true,
  },
];

function getCount(
  key: "agents" | "messages" | "teams" | "projects",
  props: StatsCardsProps,
): number {
  switch (key) {
    case "agents":
      return props.agentCount;
    case "messages":
      return props.messageCount;
    case "teams":
      return props.teamCount;
    case "projects":
      return props.projectCount;
  }
}

function getSubtext(
  key: "agents" | "messages" | "teams" | "projects",
  props: StatsCardsProps,
): string {
  switch (key) {
    case "agents":
      return `${props.onlineCount} online`;
    case "messages":
      return "recent activity";
    case "teams":
      return "configured";
    case "projects":
      return "active";
  }
}

function AnimatedCount({ value }: { value: number }) {
  const displayed = useCountUp(value);
  return <>{displayed}</>;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function StatsCards(props: StatsCardsProps) {
  if (props.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat) => {
        const count = getCount(stat.key, props);
        const subtext = getSubtext(stat.key, props);
        const TrendIcon = stat.trendUp ? TrendingUp : TrendingDown;

        return (
          <motion.div key={stat.key} variants={itemVariants}>
            <Card
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-500/[0.03] dark:to-brand-400/[0.05]" />
              <CardContent className="relative flex items-center gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${stat.bgColor} transition-transform group-hover:scale-105`}
                >
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    <AnimatedCount value={count} />
                  </p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendIcon className="size-3" />
                    <span>{subtext}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
