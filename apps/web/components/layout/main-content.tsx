"use client";

import { useSidebarStore } from "@/lib/stores/sidebar";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

const SIDEBAR_WIDTH = 260;
const RAIL_WIDTH = 56;

/**
 * Wrapper for the main content area that applies left margin
 * when the sidebar is open on desktop. On mobile the sidebar
 * overlays, so no margin is needed.
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const isMobile = useMediaQuery("(max-width: 767px)");

  // On mobile: sidebar overlays, so no margin needed
  // On desktop: full width when open, rail width when collapsed
  const ml = isMobile ? 0 : isOpen ? SIDEBAR_WIDTH : RAIL_WIDTH;

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden transition-[margin-left] duration-200 ease-out"
      style={{ marginLeft: ml }}
    >
      {children}
    </div>
  );
}
