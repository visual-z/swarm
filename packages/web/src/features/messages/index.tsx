import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

import { ConversationList, type Agent } from "./conversation-list";
import { ChatView } from "./chat-view";
import { NewConversationDialog } from "./new-conversation-dialog";
import type { Message, MessageType, SenderType } from "./message-bubble";

const DASHBOARD_ID = "dashboard";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_BASE_URL}/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  const json: ApiResponse<Agent[]> = await res.json();
  return json.data;
}

async function fetchMessagesForAgent(agentId: string): Promise<Message[]> {
  const res = await fetch(
    `${API_BASE_URL}/messages?agentId=${encodeURIComponent(agentId)}&limit=200`,
  );
  if (!res.ok) throw new Error("Failed to fetch messages");
  const json: ApiResponse<Message[]> = await res.json();
  return json.data;
}

async function fetchConversation(
  agentA: string,
  agentB: string,
): Promise<Message[]> {
  const res = await fetch(
    `${API_BASE_URL}/messages/conversation/${encodeURIComponent(agentA)}/${encodeURIComponent(agentB)}`,
  );
  if (!res.ok) throw new Error("Failed to fetch conversation");
  const json: ApiResponse<Message[]> = await res.json();
  return json.data;
}

async function sendMessage(body: {
  from: string;
  to: string;
  content: string;
  type: MessageType;
  senderType: "agent" | "person";
}): Promise<Message> {
  const res = await fetch(`${API_BASE_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(
      errJson?.message ?? `Failed to send message (${res.status})`,
    );
  }
  const json: ApiResponse<Message> = await res.json();
  return json.data;
}

async function markAsRead(messageId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
    method: "PATCH",
  });
}

export function MessagingPage() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [senderType, setSenderType] = useState<SenderType>("person");

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    refetchInterval: 15_000,
  });

  const { data: dashboardMessages = [] } = useQuery({
    queryKey: ["messages", "dashboard"],
    queryFn: () => fetchMessagesForAgent(DASHBOARD_ID),
    refetchInterval: 5_000,
  });

  const isBroadcast = selectedAgentId === null && mobileView === "chat";
  const isInbox = selectedAgentId === "__inbox__";
  const isRealAgent =
    !!selectedAgentId && selectedAgentId !== "__inbox__";

  const { data: conversationMessages = [] } = useQuery({
    queryKey: ["conversation", DASHBOARD_ID, selectedAgentId],
    queryFn: () =>
      selectedAgentId
        ? fetchConversation(DASHBOARD_ID, selectedAgentId)
        : Promise.resolve([]),
    enabled: isRealAgent,
    refetchInterval: 3_000,
  });

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId],
  );

  const broadcastMessages = useMemo(
    () => dashboardMessages.filter((m) => m.type === "broadcast"),
    [dashboardMessages],
  );

  const inboxMessages = useMemo(
    () =>
      dashboardMessages.filter(
        (m) => m.to === DASHBOARD_ID && m.senderType === "agent" && m.type !== "broadcast",
      ),
    [dashboardMessages],
  );

  const chatMessages = isInbox
    ? inboxMessages
    : isBroadcast || (!selectedAgentId && mobileView !== "chat")
      ? broadcastMessages
      : conversationMessages;

  useQuery({
    queryKey: ["markRead", selectedAgentId],
    queryFn: async () => {
      if (!selectedAgentId || selectedAgentId === "__inbox__") return null;
      const unread = conversationMessages.filter(
        (m) => !m.read && m.from === selectedAgentId,
      );
      await Promise.all(unread.map((m) => markAsRead(m.id)));
      if (unread.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ["conversation", DASHBOARD_ID, selectedAgentId],
        });
        queryClient.invalidateQueries({
          queryKey: ["messages", "dashboard"],
        });
      }
      return null;
    },
    enabled: isRealAgent && conversationMessages.length > 0,
    refetchInterval: false,
  });

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", DASHBOARD_ID, selectedAgentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", "dashboard"],
      });
    },
    onError: (err) => {
      toast.error("Failed to send message", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  const handleSend = useCallback(
    (content: string, type: MessageType) => {
      if (isInbox) return;
      const to =
        isBroadcast || !selectedAgentId ? "broadcast" : selectedAgentId;
      sendMutation.mutate({
        from: DASHBOARD_ID,
        to,
        content,
        type: isBroadcast || !selectedAgentId ? "broadcast" : type,
        senderType,
      });
    },
    [selectedAgentId, isBroadcast, isInbox, sendMutation, senderType],
  );

  const handleSelectAgent = useCallback(
    (agentId: string | null) => {
      setSelectedAgentId(agentId);
      if (isMobile) setMobileView("chat");
    },
    [isMobile],
  );

  const handleBack = useCallback(() => {
    setMobileView("list");
  }, []);

  const handleNewConversationSelect = useCallback(
    (agentId: string) => {
      setSelectedAgentId(agentId);
      if (isMobile) setMobileView("chat");
    },
    [isMobile],
  );

  const showList = !isMobile || mobileView === "list";
  const showChat = !isMobile || mobileView === "chat";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {showList && (
        <div
          className={cn(
            "flex flex-col border-r",
            isMobile ? "w-full" : "w-80 shrink-0 xl:w-96",
          )}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h1 className="text-lg font-bold tracking-tight">Messages</h1>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => setShowNewDialog(true)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <ConversationList
            agents={agents}
            messages={dashboardMessages}
            selectedAgentId={selectedAgentId}
            onSelect={handleSelectAgent}
            isLoading={agentsLoading}
            dashboardId={DASHBOARD_ID}
          />
        </div>
      )}

      {showChat && (
        <div className="flex flex-1 flex-col">
          <ChatView
            agent={selectedAgent}
            agents={agents}
            messages={chatMessages}
            dashboardId={DASHBOARD_ID}
            onSend={handleSend}
            isBroadcast={!isInbox && (isBroadcast || (!selectedAgentId && !isMobile))}
            isInbox={isInbox}
            onBack={handleBack}
            showBackButton={isMobile}
            senderType={senderType}
            onSenderTypeChange={setSenderType}
          />
        </div>
      )}

      <NewConversationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        agents={agents}
        onSelect={handleNewConversationSelect}
      />
    </div>
  );
}
