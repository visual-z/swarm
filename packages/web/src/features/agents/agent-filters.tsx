import { Search, LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export type ViewMode = "grid" | "table";
export type StatusFilter = "all" | "online" | "offline" | "busy" | "idle";
export type SortField = "name" | "status" | "lastSeen";
export type SortDirection = "asc" | "desc";

interface Team {
  id: string;
  name: string;
  color: string;
}

interface AgentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  teamFilter: string | null;
  onTeamFilterChange: (value: string | null) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  teams: Team[];
  totalCount: number;
  filteredCount: number;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "busy", label: "Busy" },
  { value: "idle", label: "Idle" },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
  { value: "lastSeen", label: "Last seen" },
];

export function AgentFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  teamFilter,
  onTeamFilterChange,
  viewMode,
  onViewModeChange,
  sortField,
  sortDirection,
  onSortChange,
  teams,
  totalCount,
  filteredCount,
}: AgentFiltersProps) {
  const activeStatusLabel =
    STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label ?? "All";
  const activeTeamLabel =
    teams.find((t) => t.id === teamFilter)?.name ?? "All teams";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        {/* Search */}
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              <span
                className={`mr-1.5 inline-block size-2 rounded-full ${
                  statusFilter === "online"
                    ? "bg-emerald-500"
                    : statusFilter === "offline"
                      ? "bg-zinc-400"
                      : statusFilter === "busy"
                        ? "bg-amber-500"
                        : statusFilter === "idle"
                          ? "bg-sky-400"
                          : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
              {activeStatusLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={statusFilter === opt.value}
                onCheckedChange={() => onStatusFilterChange(opt.value)}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Team filter */}
        {teams.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                {activeTeamLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by team</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={teamFilter === null}
                onCheckedChange={() => onTeamFilterChange(null)}
              >
                All teams
              </DropdownMenuCheckboxItem>
              {teams.map((team) => (
                <DropdownMenuCheckboxItem
                  key={team.id}
                  checked={teamFilter === team.id}
                  onCheckedChange={() => onTeamFilterChange(team.id)}
                >
                  <span
                    className="mr-1.5 inline-block size-2.5 rounded"
                    style={{ backgroundColor: team.color }}
                  />
                  {team.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="shrink-0 gap-1">
              <ArrowUpDown className="size-3.5" />
              <span className="hidden sm:inline">Sort</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
              >
                {opt.label}
                {sortField === opt.value && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        {/* Count */}
        <span className="text-muted-foreground text-xs tabular-nums">
          {filteredCount === totalCount
            ? `${totalCount} agent${totalCount !== 1 ? "s" : ""}`
            : `${filteredCount} of ${totalCount}`}
        </span>

        {/* View toggle */}
        <div className="bg-muted flex rounded-md p-0.5">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => onViewModeChange("table")}
            aria-label="Table view"
          >
            <List className="size-3.5" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
