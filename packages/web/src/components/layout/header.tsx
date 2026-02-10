import { useRouterState } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/agents": "Agents",
  "/messages": "Messages",
  "/teams": "Teams",
  "/projects": "Projects",
  "/settings": "Settings",
};

function getBreadcrumb(pathname: string): string[] {
  if (pathname === "/") return ["Dashboard"];

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: string[] = [];

  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    crumbs.push(routeLabels[path] || seg.charAt(0).toUpperCase() + seg.slice(1));
  }

  return crumbs;
}

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  const routerState = useRouterState();
  const crumbs = getBreadcrumb(routerState.location.pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4!" />
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm">
            {crumbs.map((crumb, i) => (
              <li key={crumb} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-muted-foreground">/</span>
                )}
                <span
                  className={
                    i === crumbs.length - 1
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {crumb}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 text-muted-foreground md:flex"
          onClick={onOpenCommandPalette}
        >
          <SearchIcon className="size-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="pointer-events-none ml-2 hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>
    </header>
  );
}
