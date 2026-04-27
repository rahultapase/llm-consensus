"use client";

import Link from "next/link";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { cn } from "@/lib/utils";

interface LogoProps {
  /**
   * Display size in px. SVG scales perfectly at any DPI.
   * Default: 24 (sidebar / compact use); pass 40 for auth hero.
   */
  size?: number;
  /** Show branded wordmark beside the icon */
  withWordmark?: boolean;
  className?: string;
  /** Override href — defaults to "/" */
  href?: string;
}

/**
 * App logo.
 * - brain_black.svg → light mode
 * - brain_white.svg → dark mode
 * Uses Zustand theme store (client-only) with a mounted guard to
 * avoid SSR/hydration mismatches.
 */
export function Logo({
  size = 24,
  withWordmark = false,
  className,
  href = "/",
}: LogoProps) {
  const theme = usePreferencesStore((s) => s.theme);
  const isDark = theme === "dark";

  return (
    <Link
      href={href}
      aria-label="LLM Consensus — go to home"
      className={cn(
        "group inline-flex items-center gap-2 select-none rounded-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)/60",
        className
      )}
    >
      {/* Logo icon — subtle scale on hover */}
      <span
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        <img
          src="/brain_black.svg"
          width={size}
          height={size}
          alt="LLM Consensus"
          className="relative z-10 block transition-all duration-200 ease-out group-hover:scale-105 group-active:scale-95"
          style={{ filter: isDark ? "invert(1)" : "none" }}
        />
      </span>

      {/* Optional wordmark */}
      {withWordmark && (
        <span
          className="text-[15px] font-bold tracking-[-0.02em] leading-none transition-opacity duration-200 group-hover:opacity-70"
          style={{ color: "var(--color-text-primary)" }}
        >
          Consensus
        </span>
      )}
    </Link>
  );
}
