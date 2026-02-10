import { useState } from "react";
import { Outlet } from "@tanstack/react-router";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/command-palette";

export function AppShell() {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header onOpenCommandPalette={() => setCommandOpen(true)} />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  );
}
