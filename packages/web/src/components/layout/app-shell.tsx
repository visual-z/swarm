import { useState } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/command-palette";
import { useWebSocket } from "@/hooks/use-websocket";

export function AppShell() {
  const [commandOpen, setCommandOpen] = useState(false);
  const routerState = useRouterState();
  const routeKey = routerState.location.pathname;

  useWebSocket();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header onOpenCommandPalette={() => setCommandOpen(true)} />
        <AnimatePresence mode="wait">
          <motion.div
            key={routeKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </SidebarInset>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  );
}
