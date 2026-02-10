import { Monitor, Moon, Sun } from "lucide-react";

import { useThemeStore } from "@/stores/theme-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const themes = [
  {
    value: "light" as const,
    label: "Light",
    icon: Sun,
    description: "Bright and clean",
  },
  {
    value: "dark" as const,
    label: "Dark",
    icon: Moon,
    description: "Easy on the eyes",
  },
  {
    value: "system" as const,
    label: "System",
    icon: Monitor,
    description: "Match your OS",
  },
];

export function Appearance() {
  const { theme, setTheme } = useThemeStore();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
            <Sun className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>
              Customize how SwarmRoom looks on your device
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map((t) => {
            const active = theme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                  active
                    ? "border-brand-500 bg-brand-500/5 shadow-sm shadow-brand-500/10"
                    : "border-transparent bg-muted/30 hover:border-border hover:bg-muted/50"
                }`}
              >
                <div
                  className={`flex size-12 items-center justify-center rounded-xl transition-colors ${
                    active
                      ? "bg-brand-500/15 text-brand-500"
                      : "bg-background text-muted-foreground shadow-sm group-hover:text-foreground"
                  }`}
                >
                  <t.icon className="size-5" />
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-semibold ${active ? "text-brand-500" : "text-foreground"}`}
                  >
                    {t.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                </div>
                {active && (
                  <div className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm">
                    <svg
                      className="size-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
