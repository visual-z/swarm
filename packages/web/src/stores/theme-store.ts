import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("swarmroom-theme") as Theme) || "system";
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getStoredTheme();
  applyTheme(initial);

  if (typeof window !== "undefined") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        const current = useThemeStore.getState().theme;
        if (current === "system") {
          applyTheme("system");
        }
      });
  }

  return {
    theme: initial,
    setTheme: (theme) => {
      localStorage.setItem("swarmroom-theme", theme);
      applyTheme(theme);
      set({ theme });
    },
  };
});
