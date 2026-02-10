import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL, type Agent } from "@/lib/api";
import { AgentHeader } from "./agent-header";
import { AgentCardDisplay } from "./agent-card-display";
import { AgentActivity } from "./agent-activity";
import { AgentManagement } from "./agent-management";

interface AgentDetailProps {
  agentId: string;
}

export function AgentDetail({ agentId }: AgentDetailProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const agentQuery = useQuery<Agent>({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/agents/${agentId}`);
      if (!res.ok) throw new Error("Failed to fetch agent");
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    refetchInterval: 10_000,
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/agents/${agentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove agent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent removed");
      navigate({ to: "/agents" });
    },
    onError: () => {
      toast.error("Failed to remove agent");
    },
  });

  if (agentQuery.isLoading) {
    return <DetailSkeleton />;
  }

  if (agentQuery.isError || !agentQuery.data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 sm:p-8">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Bot className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Agent not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This agent may have been removed or the ID is invalid.
          </p>
        </div>
      </div>
    );
  }

  const agent = agentQuery.data;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <AgentHeader
        agent={agent}
        onDelete={() => deleteMutation.mutate()}
        isDeleting={deleteMutation.isPending}
      />

      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Agent Card</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <AgentCardDisplay agentId={agentId} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <AgentActivity agentId={agentId} />
        </TabsContent>

        <TabsContent value="management" className="mt-4">
          <AgentManagement agent={agent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="overflow-hidden rounded-xl border border-border/60">
        <Skeleton className="h-24 w-full rounded-none" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-5">
            <Skeleton className="size-20 rounded-2xl" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="mt-5 flex gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
