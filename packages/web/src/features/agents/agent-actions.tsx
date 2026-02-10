import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Eye, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Agent } from "./index";

interface AgentActionsProps {
  agent: Agent;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function AgentActions({ agent, onDelete, isDeleting }: AgentActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="Agent actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              navigate({ to: "/agents/$agentId", params: { agentId: agent.id } })
            }
          >
            <Eye className="mr-2 size-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              navigate({
                to: "/messages",
                search: { to: agent.id },
              })
            }
          >
            <MessageSquare className="mr-2 size-4" />
            Send Message
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="mr-2 size-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove agent</DialogTitle>
            <DialogDescription>
              This will set{" "}
              <span className="font-medium text-foreground">
                {agent.displayName}
              </span>{" "}
              to offline. The agent can re-register at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                onDelete(agent.id);
                setConfirmOpen(false);
              }}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
