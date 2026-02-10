import { useState } from "react";
import { Send, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function QuickActions() {
  const [messageOpen, setMessageOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2" size="sm">
            <Send className="size-3.5" />
            Send Message
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to an agent or broadcast to all agents.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
            <Plus className="mr-2 size-4" />
            Message composer coming soon
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2" size="sm">
            <Users className="size-3.5" />
            Create Team
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>
              Group agents into a team for coordinated work.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
            <Plus className="mr-2 size-4" />
            Team builder coming soon
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
