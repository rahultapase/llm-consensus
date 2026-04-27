"use client";

import { Sun, Moon } from "lucide-react";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = usePreferencesStore();

  const isDark = theme === "dark";

  return (
    <Tooltip label={isDark ? "Switch to light theme" : "Switch to dark theme"}>
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "flex items-center justify-center rounded-md",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className ?? "size-7"
        )}
        style={{ color: "var(--color-text-secondary)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--color-sidebar-hover)";
          e.currentTarget.style.color = "var(--color-text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--color-text-secondary)";
        }}
      >
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </button>
    </Tooltip>
  );
}
