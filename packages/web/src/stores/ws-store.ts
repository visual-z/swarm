import { create } from "zustand";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface WsState {
  connectionStatus: ConnectionStatus;
  lastEventTimestamp: number | null;
  unreadNotifications: number;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastEvent: (timestamp: number) => void;
  incrementUnread: () => void;
  resetUnread: () => void;
}

export const useWsStore = create<WsState>((set) => ({
  connectionStatus: "disconnected",
  lastEventTimestamp: null,
  unreadNotifications: 0,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setLastEvent: (timestamp) => set({ lastEventTimestamp: timestamp }),
  incrementUnread: () =>
    set((state) => ({ unreadNotifications: state.unreadNotifications + 1 })),
  resetUnread: () => set({ unreadNotifications: 0 }),
}));
