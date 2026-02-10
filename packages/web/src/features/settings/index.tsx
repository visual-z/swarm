import { HubInfo } from "./hub-info";
import { ConnectionConfig } from "./connection-config";
import { Appearance } from "./appearance";
import { About } from "./about";

export function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 pb-16 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your SwarmRoom instance
        </p>
      </div>

      <div className="space-y-6">
        <HubInfo />
        <ConnectionConfig />
        <Appearance />
        <About />
      </div>
    </div>
  );
}
