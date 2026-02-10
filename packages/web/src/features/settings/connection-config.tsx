import { useState } from "react";
import { toast } from "sonner";
import { Check, Clipboard, Code2, FileJson, Terminal } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function getHubUrl(): string {
  return `${window.location.protocol}//${window.location.host}`;
}

interface ConfigExample {
  id: string;
  name: string;
  file: string;
  icon: React.ReactNode;
  getConfig: (mcpUrl: string) => string;
}

const configs: ConfigExample[] = [
  {
    id: "claude",
    name: "Claude Code",
    file: ".mcp.json",
    icon: <Terminal className="size-4" />,
    getConfig: (mcpUrl) =>
      JSON.stringify(
        {
          mcpServers: {
            swarmroom: {
              url: mcpUrl,
            },
          },
        },
        null,
        2,
      ),
  },
  {
    id: "opencode",
    name: "OpenCode",
    file: "opencode.json",
    icon: <Code2 className="size-4" />,
    getConfig: (mcpUrl) =>
      JSON.stringify(
        {
          mcp: {
            swarmroom: {
              type: "streamable-http",
              url: mcpUrl,
            },
          },
        },
        null,
        2,
      ),
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    file: ".gemini/settings.json",
    icon: <FileJson className="size-4" />,
    getConfig: (mcpUrl) =>
      JSON.stringify(
        {
          mcpServers: {
            swarmroom: {
              httpUrl: mcpUrl,
            },
          },
        },
        null,
        2,
      ),
  },
];

export function ConnectionConfig() {
  const hubUrl = getHubUrl();
  const mcpUrl = `${hubUrl}/mcp`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent-500/10 text-accent-500">
            <Code2 className="size-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Connection</CardTitle>
            <CardDescription>
              Configure your AI tools to connect to this SwarmRoom hub
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Hub MCP Endpoint
          </label>
          <CopyableField value={mcpUrl} />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Configuration Examples
          </p>
          <div className="grid gap-3">
            {configs.map((cfg) => (
              <ConfigBlock key={cfg.id} config={cfg} mcpUrl={mcpUrl} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CopyableField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex w-full items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <code className="flex-1 truncate font-mono text-sm">{value}</code>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:bg-background group-hover:shadow-sm">
        {copied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Clipboard className="size-3.5" />
        )}
      </span>
    </button>
  );
}

function ConfigBlock({
  config,
  mcpUrl,
}: {
  config: ConfigExample;
  mcpUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const code = config.getConfig(mcpUrl);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`${config.name} config copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-muted/20">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        <span className="text-muted-foreground">{config.icon}</span>
        <span className="flex-1 text-sm font-medium">{config.name}</span>
        <Badge variant="outline" className="font-mono text-[11px]">
          {config.file}
        </Badge>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={copy}
          className="ml-1"
        >
          {copied ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Clipboard className="size-3" />
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-foreground/80">
        {code}
      </pre>
    </div>
  );
}
