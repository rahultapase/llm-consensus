"use client";

import { useSidebarStore } from "@/lib/stores/sidebar";

/**
 * Minimal top header bar for the main content area.
 *
 * Behaviour mirrors T3.chat:
 * • Sidebar OPEN  → background matches `--color-sidebar-bg` so the header
 *   reads as one continuous surface with the sidebar header row.
 * • Sidebar CLOSED → background matches `--color-bg` so the header
 *   blends seamlessly into the content area.
 *
 * No title, no border, no shadow — purely a height spacer that
 * keeps visual alignment with the sidebar header (both h-12).
 */
export function AppHeader() {
  const isOpen = useSidebarStore((s) => s.isOpen);

  return (
    <header
      className="flex h-12 shrink-0 items-center px-4 transition-colors duration-200"
      style={{
        background: isOpen ? "var(--color-sidebar-bg)" : "var(--color-bg)",
        borderBottom: "none",
        boxShadow: "none",
      }}
    />
  );
}