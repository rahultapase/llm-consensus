"use client";

import { useChatStore } from "@/lib/stores/chat";
import { useSidebarStore } from "@/lib/stores/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { SHORTCUT_LABELS } from "@/lib/shortcut-labels";
import { Menu } from "lucide-react";

/** Chrome-style incognito icon (hat + glasses silhouette). */
function IncognitoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Hat crown */}
      <path d="M8 3h8a2 2 0 0 1 2 2v4.5H6V5a2 2 0 0 1 2-2z" />
      {/* Hat brim */}
      <rect x="2" y="9" width="20" height="2.5" rx="1.25" />
      {/* Left lens */}
      <circle cx="8.5" cy="17" r="2.8" />
      {/* Right lens */}
      <circle cx="15.5" cy="17" r="2.8" />
      {/* Bridge */}
      <rect x="11.3" y="16.25" width="1.4" height="1.5" />
    </svg>
  );
}

export function TopControls() {
  const isTemporary = useChatStore((s) => s.isTemporary);
  const setIsTemporary = useChatStore((s) => s.setIsTemporary);
  const { isOpen, toggle } = useSidebarStore();

  return (
    <>
      {/* Mobile hamburger — opens sidebar; hidden on sm+ where sidebar is always accessible */}
      {!isOpen && (
        <button
          onClick={toggle}
          aria-label="Open sidebar"
          className="fixed left-4 top-3 z-50 flex size-8 items-center justify-center rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:hidden"
          style={{
            background: "transparent",
            color: "var(--color-text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-sidebar-hover)";
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
        >
          <Menu className="size-5" />
        </button>
      )}

      <div className="fixed right-4 top-3 z-50 flex items-center gap-1">
      {/* Temporary chat toggle — icon-only */}
      <Tooltip
        label={isTemporary ? "Disable temporary chat" : "Enable temporary chat"}
        shortcut={SHORTCUT_LABELS.temporaryChat}
        description={!isTemporary ? "Messages won't be saved to your account" : undefined}
      >
        <button
          onClick={() => setIsTemporary(!isTemporary)}
          aria-label={isTemporary ? "Disable Temporary chat" : "Enable Temporary chat"}
          className="flex size-7 items-center justify-center rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          style={{
            background: isTemporary ? "var(--color-btn-primary-bg)" : "transparent",
            color: isTemporary ? "var(--color-btn-primary-fg)" : "var(--color-text-secondary)",
          }}
          onMouseEnter={(e) => {
            if (!isTemporary) {
              e.currentTarget.style.background = "var(--color-sidebar-hover)";
              e.currentTarget.style.color = "var(--color-text-primary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isTemporary) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }
          }}
        >
          <IncognitoIcon className="size-4" />
        </button>
      </Tooltip>

      {/* Theme toggle */}
      <ThemeToggle className="size-9" />
    </div>
    </>
  );
}
