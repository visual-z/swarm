import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWsStore } from "@/stores/ws-store";
import { WS_BASE_URL } from "@/lib/api";

const MAX_RECONNECT_DELAY_MS = 30_000;
const INITIAL_RECONNECT_DELAY_MS = 3_000;

interface WsMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

function buildWsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${WS_BASE_URL}`;
}

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
  const unmountedRef = useRef(false);

  const { setConnectionStatus, setLastEvent, incrementUnread } =
    useWsStore.getState();

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus("connecting");

    const ws = new WebSocket(buildWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmountedRef.current) {
        ws.close();
        return;
      }

      delayRef.current = INITIAL_RECONNECT_DELAY_MS;
      setConnectionStatus("connected");

      ws.send(
        JSON.stringify({
          type: "register",
          payload: { clientType: "dashboard" },
          timestamp: new Date().toISOString(),
        }),
      );

      toast.success("Connected to SwarmRoom");
    };

    ws.onmessage = (event: MessageEvent) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      setLastEvent(Date.now());

      switch (msg.type) {
        case "heartbeat": {
          const payload = msg.payload as { ping?: boolean } | undefined;
          if (payload?.ping) {
            ws.send(
              JSON.stringify({
                type: "heartbeat",
                payload: { pong: true },
                timestamp: new Date().toISOString(),
              }),
            );
          }
          break;
        }

        case "agent_online": {
          const payload = msg.payload as { name?: string } | undefined;
          queryClient.invalidateQueries({ queryKey: ["agents"] });
          toast.success(`Agent ${payload?.name ?? "unknown"} came online`);
          break;
        }

        case "agent_offline": {
          const payload = msg.payload as { name?: string } | undefined;
          queryClient.invalidateQueries({ queryKey: ["agents"] });
          toast.info(`Agent ${payload?.name ?? "unknown"} went offline`);
          break;
        }

        case "message": {
          const payload = msg.payload as { from?: string } | undefined;
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          incrementUnread();

          if (!window.location.pathname.startsWith("/messages")) {
            toast.info(`New message from ${payload?.from ?? "unknown"}`);
          }
          break;
        }

        case "register":
        case "error":
          break;

        default:
          break;
      }
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;

      setConnectionStatus("disconnected");
      toast.error("Connection lost. Reconnecting...");
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose will fire after onerror — reconnect handled there
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  const scheduleReconnect = useCallback(() => {
    if (unmountedRef.current) return;
    clearReconnectTimer();

    setConnectionStatus("connecting");

    reconnectTimerRef.current = setTimeout(() => {
      connect();
      delayRef.current = Math.min(delayRef.current * 2, MAX_RECONNECT_DELAY_MS);
    }, delayRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect, clearReconnectTimer]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      clearReconnectTimer();

      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }

      setConnectionStatus("disconnected");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect]);
}
